---
sidebar_position: 4
---

# Capture

Leviathan uses OS-native APIs to capture the desktop with minimal overhead.

## CaptureHub

Leviathan uses a **CaptureHub** abstraction to share a single capture instance across multiple streaming sessions. Instead of each client creating its own capture, CaptureHub maintains one OS-level capture and distributes frames to all subscribers. This significantly reduces system resource usage when multiple clients are connected.

Each subscriber receives its own set of GPU texture buffers. On Windows, the texture pool grows dynamically (up to 24 textures) based on the number of active subscribers, with ~6 textures per subscriber for in-flight buffering. On macOS, `CVPixelBuffer` reference counting ensures buffers remain valid for all subscribers.

## Windows — DXGI Desktop Duplication

On Windows, Leviathan uses the **DXGI Desktop Duplication API** to capture frames directly from the GPU framebuffer. This is a zero-copy path that does not require any intermediate CPU copy.

- Supports all GPUs (NVIDIA, AMD, Intel)
- Supports HDR capture (when `hdr = true` in config)
- Captures the primary monitor by default; multi-monitor is configurable
- Automatic DXGI output re-enumeration on desktop switches (UAC prompts, lock screen, RDP disconnect) to prevent stale capture handles

### HDR Compatibility

When HDR is enabled, the desktop uses `DXGI_FORMAT_R16G16B16A16_FLOAT`. Leviathan automatically detects this and uses the `IDXGIOutput5::DuplicateOutput1` API for HDR-safe capture, falling back to the legacy `DuplicateOutput` on older Windows versions. The captured HDR content is tonemapped to BGRA8 by the DWM for the rest of the pipeline.

### Multi-monitor

```toml
[capture]
monitor = 0   # 0 = primary, 1 = secondary, etc.
```

## macOS — ScreenCaptureKit

On macOS 12.3+, Leviathan uses **ScreenCaptureKit** for low-latency screen capture.

- Requires Screen Recording permission in System Settings
- Captures at the display's native resolution and refresh rate
- Supports macOS displays including ProMotion (up to 120 Hz)
- Pixel buffer retention via reference counting for safe multi-subscriber frame sharing

## Frame Rate

```toml
[capture]
fps = 60   # Target capture frame rate
```

The actual frame rate is limited by the display's refresh rate. On ProMotion or 144 Hz displays, values up to 120/144 are supported.

## HDR

HDR capture is currently supported on Windows only (requires an HDR-capable display and GPU).

```toml
[capture]
hdr = true
```

When HDR is enabled, Leviathan encodes in HDR10 and sets the appropriate metadata for the stream.

## Cursor Handling

Cursor images are captured at the desktop's native resolution and scaled to match the stream resolution. The cursor cache is automatically invalidated when the resolution ratio changes (e.g. when the encoder adjusts resolution), ensuring correct cursor sizing at all times.
