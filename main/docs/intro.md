---
sidebar_position: 1
---

# Introduction

**Aethersea** is an open-source, high-performance remote desktop platform designed for low latency and high fidelity streaming.

## Components

### Leviathan (Server)

[Leviathan](https://leviathan.theaethersea.com) is the server-side component written in Go. It captures your desktop, encodes the video stream using hardware acceleration (NVENC, AMF, VideoToolbox), and streams it to connected clients over a secure connection.

- Hardware-accelerated video encoding
- Low-latency audio capture and streaming
- Keyboard, mouse, and gamepad input forwarding
- Secure pairing and encrypted transport

### Shen (Client)

[Shen](https://shen.theaethersea.com) is the cross-platform client that connects to a Leviathan server, decodes the incoming stream, and renders it with minimal delay.

- **Desktop** (Electron + Rust) — Windows, macOS, Linux
- **iOS** (Swift) — iPhone and iPad
- **Android** (Kotlin) — phones and tablets
- Hardware-accelerated decoding on all platforms
- Multi-session support — connect to multiple servers simultaneously
- Full input support including gamepad passthrough
- Real-time performance overlay with network RTT and FEC stats
- Clipboard synchronization

## Architecture

```
┌─────────────────────────────────────┐      ┌──────────────────────────────┐
│              Leviathan              │      │             Shen             │
│              (Server)               │      │            (Client)          │
│                                     │      │                              │
│  Desktop Capture → Encoder          │ ──── │  Decoder → Renderer         │
│  Audio Capture → Encoder            │ ←─── │  Input → Controller         │
│  Clipboard Manager                  │      │  Clipboard Manager           │
└─────────────────────────────────────┘      └──────────────────────────────┘
             Signaling (WebRTC / custom)
```

## Quick Start

1. [Install and configure Leviathan](https://leviathan.theaethersea.com/docs/getting-started) on the host machine.
2. [Install Shen](https://shen.theaethersea.com/docs/getting-started) on the client machine.
3. Pair the two using the PIN shown in Leviathan.
4. Connect and start streaming.
