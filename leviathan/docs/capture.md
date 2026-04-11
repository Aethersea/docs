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
