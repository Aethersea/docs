---
sidebar_position: 10
---

# Internal Architecture

A detailed look at Leviathan's internal pipeline and platform-level implementation.

## Streaming Pipeline

```
gRPC (TLS) Session stream
    └─► signaling.Server
            └─► streaming.SessionManager.CreateSession()
                    └─► WebRTC PeerConnection (media) + PeerConnection (control)
                            ├─ darwinPipeline / windowsPipeline
                            │   ├─ capture.CaptureHub → shared capture instance
                            │   │   └─ Subscriber (per session) → raw frames
                            │   ├─ encoder.VideoEncoder → H.265/AV1 RTP
                            │   ├─ audio.OpusEncoder → Opus RTP
                            │   ├─ FecEncoder → Reed-Solomon parity packets (dynamic %)
                            │   └─ WebRTC VideoTrack/AudioTrack injection
                            ├─ Control DataChannel
                            │   ├─ input.VirtualInput (keyboard/mouse/gamepad)
                            │   ├─ clipboard.ClipboardSync
                            │   ├─ cursor overlay (WebP over DataChannel)
                            │   └─ filetransfer.DataChannelTransfer
                            └─ Telemetry DataChannel
                                └─ RTT (from RTCP RR), heartbeat, server stats
```

### Connection Flow

1. A Shen client initiates a gRPC session stream to `signaling.Server`.
2. `SessionManager.CreateSession()` creates a new WebRTC peer connection pair — one for media, one for control.
3. The platform-specific pipeline (`darwinPipeline` or `windowsPipeline`) is started, which:
   - Subscribes to the shared `CaptureHub` instance (creates one if none exists).
   - Receives raw frames via per-subscriber channels and feeds them to the hardware encoder.
   - Encodes video to H.265 or AV1 RTP packets using a long GOP strategy (no periodic IDR — keyframes are on-demand only).
   - Encodes system audio to Opus RTP packets.
   - Applies Reed-Solomon FEC with dynamic overhead (5–25%) based on measured RTT.
   - Injects encoded tracks into the WebRTC media connection.
4. The control DataChannel handles input events, clipboard sync, cursor overlays, and file transfers.
5. The telemetry DataChannel sends periodic heartbeats with RTT measurements derived from RTCP Receiver Reports.
6. If the client did not set `AudioConfig.play_on_host`, the `internal/hostaudio` package mutes the host's default render endpoint for the duration of the session (Sunshine-compatible behaviour). A refcount ensures the host is unmuted only after the last "mute-requesting" session ends, and the endpoint's original mute state is restored rather than unconditionally cleared.

## Platform Support Matrix

| Feature | macOS | Windows | Linux |
|---|---|---|---|
| Screen capture | ScreenCaptureKit via CaptureHub (CGO) | DXGI Desktop Duplication via CaptureHub (CGO) | stub |
| Video encode | VideoToolbox + SVT-AV1 (CGO) | Media Foundation + SVT-AV1 (CGO) | stub |
| Audio encode | libopus (CGO) | libopus (CGO) | stub |
| Host audio mute | CoreAudio (CGO) | IAudioEndpointVolume (CGO) | stub |
| Input injection | CGEvent / Objective-C | SendInput + ViGEm | stub |
| Cursor capture | NSCursor | GetCursorInfo | stub |
| Clipboard | NSPasteboard + helper IPC | Win32 Clipboard (base64 text encoding) | stub |

## CGO Platform Backends

Leviathan uses CGO extensively for platform-specific functionality. Native code is organized under `cgo/`:

- **`cgo/macos/`** — Objective-C and C sources for macOS: screen capture via ScreenCaptureKit, video encoding via VideoToolbox, input injection via CGEvent, cursor capture via NSCursor, and audio encoding via libopus.
- **`cgo/windows/`** — C headers and prebuilt libraries for Windows: screen capture via DXGI Desktop Duplication, video encoding via Media Foundation, input injection via SendInput and ViGEm (virtual gamepad).

## macOS Clipboard Helper

On macOS, clipboard sync requires a separate helper process (`clipboard-helper`) because `NSPasteboard`'s `declareTypes:owner:` (lazy/delayed rendering) requires an active `NSApplication` run loop. Without one, Universal Clipboard / Handoff immediately steals pasteboard ownership and deferred data callbacks never fire.

The helper process communicates via Unix domain socket using **4-byte little-endian length-prefixed protobuf** messages. See the [Clipboard Helper](https://theaethersea.com/docs/clipboard-helper) documentation for details.

## Proto File Reference

| File | Purpose |
|---|---|
| `signaling.proto` | `SignalingService` — bidirectional gRPC stream for SDP/ICE exchange; `SessionConfig` |
| `control.proto` | DataChannel messages: `KeyEvent`, `MouseEvent`, `GamepadState`, `TouchEvent`, `IDRRequest`, `RumbleFeedback`, `StatsReport`, `BitrateEstimate`, `ServerTelemetryEvent` |
| `pairing.proto` | Client pairing / authentication RPC |
| `management.proto` | Server management RPC |
| `clipboard.proto` | Clipboard sync messages |
| `clipboard_helper.proto` | IPC with macOS `clipboard-helper` helper process |
| `overlay.proto` | Cursor / overlay DataChannel messages |

### Regenerating Proto Files

When `.proto` files change, regenerate the Go code:

```bash
make proto
```

This requires `protoc`, `protoc-gen-go`, and `protoc-gen-go-grpc` to be installed. Run `make deps` to install the Go protoc plugins.
