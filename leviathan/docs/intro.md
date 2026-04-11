---
sidebar_position: 1
---

# Introduction

**Leviathan** is the server component of [Aethersea](https://theaethersea.com). Written in Go, it runs on the host machine, captures the desktop, encodes it with hardware acceleration, and streams it securely to [Shen](https://shen.theaethersea.com) clients.

## Supported Platforms

| Platform | Status |
|----------|--------|
| Windows 10/11 (x64) | ✅ Supported |
| macOS 12+ (Apple Silicon) | ✅ Supported |
| macOS 12+ (Intel) | ✅ Supported |
| Linux (x64) | 🚧 Experimental |

## Key Features

- **Hardware-accelerated encoding** — H.265 and AV1 via NVENC (NVIDIA), AMF (AMD), QuickSync (Intel), VideoToolbox (Apple)
- **Low-latency capture** — DXGI Desktop Duplication on Windows; ScreenCaptureKit on macOS, with shared CaptureHub for multi-session
- **Multi-session** — multiple clients can stream simultaneously from a single capture instance
- **Audio streaming** — captures system audio and forwards it to the client
- **Full input injection** — keyboard, mouse, and gamepad input received from Shen is injected into the OS
- **Telemetry** — real-time RTT measurement and network quality stats via dedicated DataChannel
- **Adaptive FEC** — dynamic Forward Error Correction based on network conditions
- **Secure pairing** — Argon2id password pairing with DTLS fingerprint pinning for subsequent sessions
- **Clipboard sync** — bidirectional clipboard between host and client

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
