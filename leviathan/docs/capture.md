---
sidebar_position: 4
---

# Capture

Leviathan uses OS-native APIs to capture the desktop with minimal overhead.

## Windows — DXGI Desktop Duplication

On Windows, Leviathan uses the **DXGI Desktop Duplication API** to capture frames directly from the GPU framebuffer. This is a zero-copy path that does not require any intermediate CPU copy.

- Supports all GPUs (NVIDIA, AMD, Intel)
- Supports HDR capture (when `hdr = true` in config)
- Captures the primary monitor by default; multi-monitor is configurable

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
