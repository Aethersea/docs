---
sidebar_position: 2
---

# Architecture

A deeper look at how Aethersea's components work together.

## Transport

Aethersea uses a custom signaling protocol for connection establishment and a direct encrypted channel for media transport.

## Video Pipeline

**Leviathan (capture side)**

1. Desktop capture via OS APIs (DXGI on Windows, ScreenCaptureKit on macOS)
2. **CaptureHub** distributes raw frames to multiple streaming sessions, allowing a single capture instance to serve several clients simultaneously
3. Hardware encode: NVENC (NVIDIA), AMF (AMD), VideoToolbox (Apple)
4. Reed-Solomon **Forward Error Correction (FEC)** is applied to encoded packets for packet loss resilience
5. RTP packetisation and transmission

**Shen (render side)**

1. RTP reception and FEC recovery
2. Hardware decode: D3D11VA / NVDEC (Windows), VideoToolbox (macOS), MediaCodec (Android), VideoToolbox (iOS)
3. Frame rendering via WebGL / native renderer

## Multi-Session

Leviathan supports multiple concurrent streaming sessions through CaptureHub. A single capture instance is shared across all connected clients, with each subscriber receiving its own set of GPU texture buffers. Shen Desktop also supports connecting to multiple servers simultaneously, with each session running in its own window.

## Telemetry

A dedicated **telemetry DataChannel** runs alongside the control channel. Leviathan sends periodic heartbeats containing round-trip time (RTT) measurements derived from RTCP Receiver Reports. Clients display this data in a real-time performance overlay, along with FEC recovery statistics, frame rates, and codec information.

## Input Pipeline

Input events (keyboard, mouse, gamepad) are captured by Shen, serialised via Protocol Buffers, and forwarded to Leviathan which injects them through the OS input subsystem. Shen supports both relative mouse mode (for gaming) and absolute/remote desktop mode (for desktop use).

## Clipboard

Clipboard synchronisation is bidirectional and supports text, images, and files. Text content is transmitted using base64 encoding for improved compatibility with special characters. On macOS, clipboard sync is handled by the `clipboard-helper` auxiliary process, which bridges the sandboxed Electron renderer with the native pasteboard.
