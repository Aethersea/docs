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

### Frame pacing & asynchronous (uncapped-game) sources

A game presenting **asynchronously** — uncapped, or with in-game V-Sync off — does not present at a steady cadence. On a high-refresh host (e.g. an 80 fps game on a 144 Hz display, streamed at a 120 fps target) its frames arrive in *clumps* rather than evenly spaced. The streaming pipeline historically assumed a **constant frame rate (CFR)** end-to-end and tolerated this poorly: the symptom was the stream collapsing to ~12–60 fps for the async source, while the *same* game **capped to a steady 60 fps streamed perfectly** — the tell-tale sign that irregular *cadence*, not throughput, was the trigger.

The capture loop is therefore modelled directly on **OBS and Sunshine**, which both decouple output cadence from the source by running on their own fixed clock and *resampling* the latest captured frame (duplicating to fill gaps). The Windows path now does the same, across these stages:

- **Fixed cfg.FPS timer grid (not VBlank).** `use_vsync` is forced 0 so the loop paces with a high-resolution timer at the target FPS rather than `WaitForVBlank`. VBlank pacing under-sampled an async source — it phase-aliases against the source's presents and DXGI coalesces frames (`AccumulatedFrames ≥ 2`) — capping an 80 fps game at ~40–60 fps even with a widened acquire window. The grid index (`pacing_tick`) advances **every iteration, not per delivered frame**; the pure, unit-tested `pacing_grid_next` (in `pacing_windows.c`) computes the next sleep target from it and resyncs only if we fall >2 frames behind. Advancing every tick is what prevents the busy-spin that previously collapsed a 0 ms-poll timer attempt to ~12 fps. Each tick polls `AcquireNextFrame(0)` for the latest present.
- **Duplicate-fill on a miss.** When a grid tick finds no new present but the source is *actively presenting* (a real desktop frame within `active_window_ticks` = 500 ms), the loop re-emits the last frame via the existing repeat-frame path, gated to the target cadence — so the output is an even cfg.FPS the client can pace (≈ source-rate unique frames + cheap duplicate P-frames). A genuinely static desktop (no real present for 500 ms) falls back to the 1 fps low-power keepalive. `last_real_present_time` is set only on a *real* delivery, so the active/idle switch is automatic.
- **Capture→encode hand-off depth.** The capture handler pushes texture references onto a bounded channel drained by the encode goroutine (`enqueueEncodeFrameDropOldest`, latest-wins: under back-pressure the *oldest* queued frame is evicted and its texture released, keeping the freshest moving). The channel is **4** deep and the GPU texture pool is sized to match (`CAPTURE_TEXTURES_PER_SUBSCRIBER` = **9**: up to 5 textures in-flight leaves ~4 free for the capture thread).
- **Client decode-queue back-pressure.** The shen renderer used to drain the *entire* video ring into the WebCodecs decoder synchronously each poll tick; a clump spiked `decodeQueueSize` past a hard cap, which (with the server's infinite-GOP config) forced a frame drop **and an IDR-storm recovery** that then dropped every P-frame until a fresh keyframe — a self-reinforcing collapse. The drain now uses `RingBufferReader.processWhile`, feeding the decoder only while its queue is below a *soft* limit (`max(8, ⌈fps/8⌉)`, well under the hard cap) and leaving the rest of the burst in the ring for the next tick. Nothing is dropped or reordered (the reference chain stays intact); the ring is the buffer, draining as the decoder regains headroom.

Together these make the host emit an even cfg.FPS stream (catching every present via the 0 ms poll at a rate ≥ the source) and the client meter it into the decoder without bursting — exactly the OBS/Sunshine shape. Reverting the single `use_vsync = 0` initializer restores the old VBlank pacing.

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

Which path is active is **per-display state owned by the CaptureHub**, not by individual sessions: each pipeline registers its client's preference (`CaptureHub.SetCursorInVideo`), and the hub applies the aggregate — the cursor is composited into the video only when *every* live subscriber wants it there; any overlay-mode session wins. Preferences are re-settled when a subscriber leaves and re-asserted on a fresh capture instance. Pipelines never write the capture layer's cursor flag directly — a session's default snapping the shared flag used to leave a sibling client rendering its overlay cursor on top of the video-blended one (two visible cursors), with the client's reconnect resync unable to repair it.

When the host cursor becomes hidden, the overlay path notifies the client (`CURSOR_HIDE`, which makes the client engage its own pointer lock and switch to relative-delta input) only when the hide looks like a **game capture**: the cursor is confined via `ClipCursor` to a sub-rect of the virtual desktop, **or** a client-injected mouse button is currently held — FF14/WoW-style camera drags hide the cursor for the duration of the drag without a detectable clip, and without this signal the client would keep sending absolute positions whose derived deltas are amplified by `streamW / canvasCSSW` (the "Local Cursor drag too fast" bug, shen#19). A passive hide (idle media player, fullscreen video) sends nothing, so the client keeps the last cursor shape for navigation.

The overlay path renders each cursor at its **native bitmap size** (multiplied by the client's device-pixel-ratio oversample for Retina sharpness), *not* forced to the system cursor metric (`SM_CXCURSOR`). Under the per-monitor-DPI-aware (PMAv2) thread context the host already holds, `GetIconInfo` reports the same dimensions DXGI's `GetFramePointerShape` does — so a standard cursor is 48×48 at 150% scaling and an application that sets a genuinely large custom cursor (e.g. **Final Fantasy XIV**'s hardware cursor) keeps its true size. This makes the overlay cursor and the GPU-composited cursor render at identical on-screen sizes instead of the overlay squashing large cursors down to the system metric. The oversample factor only affects bitmap resolution; the pipeline strips it back out before reporting CSS dimensions to the client, which sizes the cursor as `reportedWidth × videoScale`.
