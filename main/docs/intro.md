---
sidebar_position: 1
---

# Introduction

**Aethersea** is an open-source, high-performance remote desktop and game streaming platform designed for low latency and high fidelity.

## Components

### Leviathan (Server)

[Leviathan](https://leviathan.theaethersea.com) is the server component, written in **Go**. It captures the host desktop, encodes video and audio with hardware acceleration, and streams to clients over WebRTC.

- Hardware-accelerated H.265 / AV1 encoding (NVENC, QSV, AMF, VideoToolbox, SVT-AV1 software fallback)
- Low-latency audio capture via Opus
- Reed-Solomon Forward Error Correction with dynamic overhead
- Multi-session streaming: a single capture instance is shared across all connected clients via CaptureHub
- Keyboard, mouse, and touch input forwarding; virtual gamepad injection on Windows (ViGEm)
- Password-based pairing (Argon2id) with DTLS fingerprint pinning for subsequent sessions
- Bidirectional clipboard, cursor overlay, and file transfer

Supported on Windows (10/11) and macOS (13+). Linux currently has stub backends only.

### Shen (Client)

[Shen](https://shen.theaethersea.com) is the cross-platform client family. The clients share the same WebRTC/FEC protocol with Leviathan but have independent codebases tailored to each platform:

- **Desktop** — Electron + Rust (napi-rs). Windows, macOS, Linux. Documented at [shen.theaethersea.com](https://shen.theaethersea.com).
- **iOS** — Swift / SwiftUI + Rust (via FFI). iPhone and iPad.
- **Android** — Kotlin / Jetpack Compose + Rust (via JNI).

All variants provide:

- Hardware-accelerated video decode with a pure-Rust `rav1d` software AV1 fallback
- Up to 16 gamepads via SDL3 on desktop; native gamepad APIs on mobile
- Real-time performance overlay with RTT, packet loss, FEC recovery rate, and codec/resolution/FPS
- Clipboard synchronization (bidirectional)

## High-Level Architecture

```
┌─────────────────────────────┐       ┌─────────────────────────────┐
│          Leviathan          │       │             Shen            │
│           (Server)          │       │           (Client)          │
│                             │       │                             │
│  Capture → Encoder → RTP    │ ────► │  RTP → FEC recover → Decode │
│  Input injection            │ ◄──── │  Input capture              │
│  Clipboard / Cursor / Files │  ◄──► │  Clipboard / Cursor / Files │
└─────────────────────────────┘       └─────────────────────────────┘
    Signaling (gRPC over TLS) + Media (DTLS-SRTP) + DataChannels
```

## Quick Start

1. Install and configure [Leviathan](https://leviathan.theaethersea.com/docs/getting-started) on the host machine.
2. Install [Shen](https://shen.theaethersea.com/docs/getting-started) on the client.
3. Pair the client using the username and password you set on the server.
4. Connect and start streaming.
