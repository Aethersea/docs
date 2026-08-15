---
title: "Introduction"
description: "An overview of Leviathan, the Aethersea host and streaming server."
---

**Leviathan** is the server component of [Aethersea](https://theaethersea.com). Written in Go, it runs on the host machine, captures the desktop, encodes it with hardware acceleration, and streams it securely to [Shen](https://shen.theaethersea.com) clients.

## Supported Platforms

| Platform | Status |
|----------|--------|
| Windows 10/11 (x64) | ✅ Supported |
| macOS 13+ (Apple Silicon) | ✅ Supported |
| macOS 13+ (Intel) | ✅ Supported |
| Linux (x64) | 🚧 Stub backends only — the gRPC signaling layer runs but no media is produced. |

## Key Features

- **Hardware-accelerated encoding** — H.265 (HEVC) and AV1 via NVENC (NVIDIA), QSV (Intel), AMF (AMD, untested), VideoToolbox (Apple); SVT-AV1 software fallback on both platforms.
- **Low-latency capture** — DXGI Desktop Duplication on Windows; ScreenCaptureKit on macOS; shared **CaptureHub** distributes one capture instance to all subscribed sessions.
- **Multi-session** — multiple clients can stream simultaneously from a single capture; on Windows the second session's encoder is automatically promoted to a separate D3D11 device to avoid Video Processor contention.
- **Audio streaming** — system audio captured via platform loopback and encoded with libopus. The host's default render endpoint is optionally muted for the duration of a session (refcounted across concurrent sessions) and restored on disconnect.
- **Input injection** — keyboard, mouse, and touch events from Shen are injected through `SendInput` (Windows) / `CGEvent` (macOS). Virtual gamepad injection via **ViGEm** on Windows is implemented; the end-to-end gamepad path is under active development. Lock-key state is reconciled from the client rather than injected as keystrokes — Windows syncs Caps/Num/Scroll, macOS syncs Caps only.
- **Telemetry** — real-time RTT from RTCP Receiver Reports surfaced to the client over a dedicated DataChannel.
- **Adaptive FEC** — Reed-Solomon Forward Error Correction with overhead tuned to measured loss and the GCC delay-gradient signal, to avoid congestion-driven FEC death-spirals.
- **Secure pairing** — Argon2id password pairing with per-IP rate limiting; subsequent sessions authenticate by pinned DTLS fingerprint.
- **Clipboard sync** — bidirectional text, images, and files. On macOS a bundled `clipboard-helper` process owns `NSPasteboard` so lazy/delayed rendering works correctly.

## Architecture

```
┌──────────────────────────────────────────┐
│               Leviathan                  │
│                                          │
│  ┌───────────┐    ┌────────────────────┐ │
│  │  Capture  │───>│  Hardware Encoder  │ │
│  │  (DXGI /  │    │  (NVENC/AMF/VT)   │ │
│  │  SCK)     │    └────────┬───────────┘ │
│  └───────────┘             │             │
│                            ▼             │
│  ┌───────────┐    ┌────────────────────┐ │
│  │  Audio    │───>│   RTP / Transport  │◄──── Shen (client)
│  │  Capture  │    └────────────────────┘ │
│  └───────────┘                           │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         Input Injection            │◄──── Input events from Shen
│  │   (keyboard / mouse / gamepad)     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Next Steps

- [Getting Started](./getting-started) — install and run Leviathan
- [Configuration](./configuration) — tune capture, encoding, and networking settings
