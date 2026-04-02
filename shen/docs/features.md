---
sidebar_position: 3
---

# Features

## Video Streaming

Shen receives the H.265 (HEVC) or AV1 video stream from Leviathan and decodes it using the GPU, keeping CPU usage minimal even at 4K/144 Hz.

| Codec | Windows | macOS | iOS | Android |
|-------|---------|-------|-----|---------|
| H.265 (HEVC) | ✅ | ✅ | ✅ | ✅ |
| AV1 | ✅ | ✅ | ✅ | ✅ |

## Audio

Remote audio is decoded from Opus and played back with low latency. On desktop, a dedicated audio worklet minimises buffering artefacts. On iOS, a dedicated `OpusAudioPlayer` decodes Opus packets to PCM and renders via `AVAudioEngine` with low-latency buffering.

## Multi-Session (Desktop)

Shen Desktop supports connecting to multiple Leviathan servers simultaneously. Each streaming session opens in its own window, and the home screen shows live status indicators for active sessions. You can start and stop individual sessions independently.

## Input

All input events captured in the Shen window are forwarded to the host in real time:

| Input Type | Notes |
|-----------|-------|
| Keyboard | Full key pass-through including modifier keys |
| Mouse | Relative and absolute modes |
| Scroll | High-precision trackpad scroll supported |
| Gamepad | Up to 4 simultaneous controllers via XInput / SDL |

### Remote Desktop Mode

When enabled, Shen uses absolute mouse positioning with the local cursor visible — ideal for desktop productivity use. The server-side cursor rendering is disabled automatically. On iOS, this mode uses `UIPointerInteraction` and `UIHoverGestureRecognizer` to track pointer devices (trackpad/mouse) separately from touch input.

### Pointer Lock

During streaming in relative mouse mode, Shen automatically re-acquires pointer lock when the overlay is dismissed, preventing the cursor from appearing unexpectedly during gameplay.

## Performance Overlay

A real-time performance overlay displays streaming diagnostics:

- Stream resolution, codec, and configured FPS
- Received vs rendered frame rate
- Network round-trip time (RTT) with colour-coded health indicators (green ≤ 30 ms, yellow ≤ 80 ms, red > 80 ms)
- Packet loss percentage
- FEC (Forward Error Correction) recovery rate
- IDR frame request count

RTT data is received from Leviathan via a dedicated telemetry DataChannel using RTCP Receiver Report measurements.

## Clipboard Sync

Text, images, and files can be copied on one machine and pasted on the other. On macOS, clipboard synchronisation is handled by the bundled **clipboard-helper** process which bridges the Electron sandbox to the native pasteboard.

See [Clipboard](./clipboard) for details.

## Resolution & Refresh Rate

Shen automatically negotiates the stream resolution with Leviathan. You can override this in **Settings → Display**. The default resolution on desktop is now **fullscreen** mode. On iOS, the default resolution is 2560×1440 or the host's native display dimensions.

## macOS Accessibility Permission

On macOS, if any saved stream configuration has **immersive mode** enabled, Shen proactively requests Accessibility permission on startup. This kernel-level permission check ensures global keyboard and mouse hooks work correctly during streaming. The permission dialog is only shown once; subsequent checks are silent.
