---
sidebar_position: 2
---

# Architecture

A deeper look at how Aethersea's components work together.

## Transport

- **Signaling**: gRPC over TLS. The client opens a bidirectional stream against Leviathan's `SignalingService` to negotiate SDP offer/answer and exchange ICE candidates.
- **Media**: WebRTC DTLS-SRTP over UDP for video and audio tracks.
- **Control, telemetry, clipboard, file-transfer**: WebRTC DataChannels over SCTP/DTLS on a separate peer connection from the media one, so control events don't share head-of-line blocking with video RTP.

Leviathan runs WebRTC in **ICE-Lite** mode — it does not perform STUN binding or act as a TURN client. The client is responsible for ICE candidate gathering.

## Video Pipeline

**Leviathan (capture side)**

1. Desktop capture via OS APIs — DXGI Desktop Duplication on Windows, ScreenCaptureKit on macOS.
2. **CaptureHub** distributes raw frames to multiple streaming sessions; a single capture instance serves all connected clients.
3. Hardware encode:
   - Windows: NVENC (NVIDIA), QSV (Intel), AMF (AMD, untested)
   - macOS: VideoToolbox
   - SVT-AV1 is available on both platforms as a software AV1 encoder.
4. Reed-Solomon **Forward Error Correction (FEC)** is applied to encoded packets. The overhead percentage is dynamically adjusted based on measured loss and the GCC delay-gradient signal (avoiding the classic "FEC death spiral" where congestion-induced loss triggers more FEC, which causes more congestion).
5. RTP packetization and transmission.

**Shen (render side)**

1. RTP reception and FEC recovery (no retransmission — loss beyond what FEC can cover triggers an on-demand IDR request via the control DataChannel).
2. Hardware decode:
   - Windows: D3D11VA / NVDEC
   - macOS: VideoToolbox
   - Mobile: VideoToolbox (iOS) / MediaCodec (Android)
3. Software AV1 fallback via `rav1d` (pure-Rust port of `dav1d`) on any platform where hardware AV1 decode is unavailable.
4. Frame rendering via WebGL (desktop) or platform-native surfaces (iOS, Android).

## Multi-Session

Leviathan supports multiple concurrent streaming sessions via CaptureHub:

- On Windows, the GPU texture pool grows with subscriber count (~6 textures per subscriber, up to 24 total).
- When a second session subscribes to a shared hub, its encoder is automatically promoted to **cross-device mode**: it allocates its own D3D11 device instead of reusing the capture's device, avoiding contention on the D3D11 Video Processor that would otherwise spike per-frame times from sub-ms to 30–90 ms.
- On macOS, `CVPixelBuffer` reference counting keeps frame buffers valid for all subscribers.

Shen Desktop also supports connecting to multiple servers simultaneously — each session runs in its own window.

## Telemetry

A dedicated **telemetry DataChannel** runs alongside the control channel. Leviathan sends periodic heartbeats carrying round-trip time (RTT) derived from RTCP Receiver Reports. Clients display this alongside FEC recovery statistics, received vs rendered frame rate, codec, and resolution in the performance overlay.

## Input Pipeline

Input events (keyboard, mouse, scroll, touch, gamepad) are captured by Shen, serialised via Protocol Buffers, and forwarded to Leviathan over the control DataChannel. Leviathan injects them through the OS input subsystem:

- Windows: `SendInput` for keyboard/mouse; **ViGEm** for virtual gamepads.
- macOS: `CGEvent` for keyboard/mouse.

Shen supports both relative mouse mode (for gaming) and absolute/remote-desktop mode (for desktop use). When remote-desktop mode is enabled, Shen sends the cursor position to the server so Leviathan can blend a cursor overlay into the encoded stream.

## Clipboard

Clipboard synchronization is bidirectional and supports text, images, and files. On Windows the Shen renderer accesses the clipboard directly; on macOS, clipboard sync runs through the bundled [`clipboard-helper`](./clipboard-helper) auxiliary process, which owns `NSPasteboard` from a proper `NSApplication` run loop so macOS's lazy/delayed rendering (`declareTypes:owner:`) actually fires — sandboxed Electron renderers cannot do this themselves.

## Security

- **gRPC signaling**: TLS 1.2+ (negotiates TLS 1.3 when the client supports it). The server's certificate is auto-generated on first run and its SHA-256 fingerprint is logged at startup.
- **Media and DataChannels**: DTLS-SRTP (Pion defaults: `SRTP_AEAD_AES_128_GCM`, `SRTP_AES128_CM_HMAC_SHA1_80`).
- **Pairing**: Argon2id-hashed password with per-IP rate limiting on failed attempts. Once paired, clients authenticate automatically by their pinned DTLS fingerprint — the password is not needed again.

See the [Leviathan security page](https://leviathan.theaethersea.com/docs/security) for operational guidance on exposing a server to the internet.
