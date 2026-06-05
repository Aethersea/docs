---
sidebar_position: 4
---

# Capture

Leviathan uses OS-native APIs to capture the desktop with minimal overhead.

## CaptureHub

Leviathan uses a **CaptureHub** abstraction to share a single capture instance across multiple streaming sessions. Instead of each client creating its own capture, CaptureHub maintains one OS-level capture and distributes frames to all subscribers. This significantly reduces system resource usage when multiple clients are connected.

Each subscriber receives its own set of GPU texture buffers. On Windows, the texture pool grows dynamically (up to 24 textures) based on the number of active subscribers, with ~6 textures per subscriber for in-flight buffering. On macOS, `CVPixelBuffer` reference counting ensures buffers remain valid for all subscribers.

### Recovery frame edge detection

When DXGI Desktop Duplication recovers from `DXGI_ERROR_ACCESS_LOST` (e.g. resolution change, secure desktop, GPU TDR), the C capture layer emits a burst of *fallback* frames marked `RecoveryFrame=true` so encoders know to force a fresh IDR. CaptureHub collapses this burst into a **single edge** per recovery episode: only the first frame of each episode reaches subscribers with `RecoveryFrame=true`; the remainder of the burst is delivered with the flag cleared. Without this de-duplication, every fallback frame would trigger an IDR on every subscriber, producing an IDR storm that flickers all connected clients.

### Multi-subscriber encoder isolation (Windows)

When a second session subscribes to a hub that already has an active subscriber, the new session's pipeline is automatically promoted to **cross-device encoder mode** — its NVENC/MFT encoder allocates its own D3D11 device instead of reusing the capture's shared device. This is critical because the D3D11 Video Processor used for BGRA→NV12 conversion serializes work on the immediate context: two encoders sharing one device would cause per-frame VP times to spike from `<1ms` to `30–90ms`, dropping frames on the existing client and triggering a recovery loop. Cross-device costs one cross-adapter texture copy per frame but eliminates the contention.

The first subscriber may also be promoted to cross-device retroactively if both sessions race to subscribe.

## Windows — DXGI Desktop Duplication

On Windows, Leviathan uses the **DXGI Desktop Duplication API** to capture frames directly from the GPU framebuffer as `BGRA8` textures. This is a zero-copy path that does not require any intermediate CPU copy on the way into the encoder.

- Supports all GPUs (NVIDIA, AMD, Intel)
- Always captures the **primary display** (display ID `0`); multi-monitor selection is not yet exposed in the config schema
- Automatic DXGI output re-enumeration on desktop switches (UAC prompts, lock screen, RDP disconnect) to prevent stale capture handles
- HDR-safe via `IDXGIOutput5::DuplicateOutput1` when the desktop is in `R16G16B16A16_FLOAT` mode — the DWM tonemaps to `BGRA8` so the rest of the pipeline stays in SDR. There is **no HDR10 passthrough** today; everything is encoded as SDR.

### Frame pacing & asynchronous sources

The Windows capture loop paces itself with a **high-resolution timer**, the same way Sunshine does — it sleeps to the next target-frame-interval boundary and then polls `AcquireNextFrame` (a `0 ms` timeout once pacing is established; ~`100 ms` to prime the first frame and after any recovery). It does **not** pace against the display's vertical blank.

This is a deliberate change from the earlier VBlank-aligned design (`IDXGIOutput::WaitForVBlank` → short `AcquireNextFrame`), which collapsed the captured rate for a game presenting **asynchronously** (uncapped, or with in-game V-Sync off) on a high-refresh host. While a foreground flip-model game owns the scanout, `WaitForVBlank`'s effective tick rate is throttled, so the loop sampled far fewer frames than the game produced — e.g. an 80 fps game on a 144 Hz host streamed at only ~30 fps, while the *same* game capped to the refresh rate (which re-phase-locks it to the VBlank cadence) streamed correctly. Widening the per-acquire timeout recovered it only partway (~40–60 fps); the residue was the VBlank pacing itself. Timer pacing removes the dependency on `WaitForVBlank` entirely and restored the full rate.

The VBlank waiter thread and all the V-Sync / SAS-suspend recovery branches still exist in the source but are gated behind a now-always-`0` `use_vsync` flag (the waiter thread is never even created). Reverting that single initializer restores the old VBlank-paced behavior.

One inherent cost of timer-pacing with a `0 ms` poll: when the captured source runs **below** the target rate (e.g. an 80 fps game with a 120 fps target), the timer wakes more often than the source produces frames, so a fraction of polls find nothing and briefly busy-spin until the next present (bounded by one inter-present gap, here ~4 ms). This matches Sunshine's poll-after-sleep design and was already the behavior whenever the target exceeded the refresh rate.

If a borderless-fullscreen game *still* streams at a reduced rate after this, the remaining suspect is Windows **independent flip / Multiplane Overlay (MPO)**: the game's swap chain is handed straight to the scanout plane, so Desktop Duplication only receives a throttled recomposited copy from the DWM. That is outside the capture loop's control — mitigations are host-side (disable *fullscreen optimizations* for the game executable, or disable MPO).

## macOS — ScreenCaptureKit

On macOS 12.3+, Leviathan uses **ScreenCaptureKit** for low-latency screen capture.

- Requires Screen Recording permission in System Settings → Privacy & Security
- Captures at the display's native resolution and refresh rate
- Supports macOS displays including ProMotion (up to 120 Hz)
- `CVPixelBuffer` reference counting keeps frame buffers valid across all CaptureHub subscribers for safe multi-session sharing

## Resolution & Frame Rate

The capture resolution and frame rate are negotiated **per session** by the client (via `SessionConfig`), bounded by the limits in `config.toml`:

```toml
[video]
max_width = 3840
max_height = 2160
max_fps = 120
```

The actual frame rate is also bounded by the display's refresh rate. On ProMotion or 144 Hz displays, values up to the panel rate are supported.

## Cursor Handling

Cursor images are captured at the desktop's native resolution and scaled to match the stream resolution. The cursor cache is automatically invalidated when the resolution ratio changes (e.g. when the encoder adjusts resolution), ensuring correct cursor sizing at all times.

There are two cursor rendering paths, and they are sized to agree:

- **Overlay path** (Windows default / Local Cursor mode): the cursor is captured via `GetIconInfo` + `DrawIconEx`, encoded as a lossless WebP, sent over the overlay DataChannel, and drawn by the client as an `<img>` on top of the video.
- **GPU-composite path** (pointer-lock / relative mode): the cursor is taken from DXGI Desktop Duplication's `GetFramePointerShape` and composited straight into the video frame by a D3D11 compute shader.

The overlay path renders each cursor at its **native bitmap size** (multiplied by the client's device-pixel-ratio oversample for Retina sharpness), *not* forced to the system cursor metric (`SM_CXCURSOR`). Under the per-monitor-DPI-aware (PMAv2) thread context the host already holds, `GetIconInfo` reports the same dimensions DXGI's `GetFramePointerShape` does — so a standard cursor is 48×48 at 150% scaling and an application that sets a genuinely large custom cursor (e.g. **Final Fantasy XIV**'s hardware cursor) keeps its true size. This makes the overlay cursor and the GPU-composited cursor render at identical on-screen sizes instead of the overlay squashing large cursors down to the system metric. The oversample factor only affects bitmap resolution; the pipeline strips it back out before reporting CSS dimensions to the client, which sizes the cursor as `reportedWidth × videoScale`.
