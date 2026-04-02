---
sidebar_position: 1
---

# Introduction

**Shen** is the official cross-platform client for [Aethersea](https://theaethersea.com). It connects to a [Leviathan](https://leviathan.theaethersea.com) server and renders the remote desktop stream with ultra-low latency.

## Supported Platforms

| Platform | Status |
|----------|--------|
| Windows (x64) | ✅ Supported |
| macOS (Apple Silicon) | ✅ Supported |
| macOS (Intel) | ✅ Supported |
| iOS (iPhone / iPad) | ✅ Supported |
| Android | ✅ Supported |
| Linux (x64) | 🚧 Experimental |

## Key Features

- **Hardware-accelerated decoding** — uses D3D11VA / NVDEC on Windows, VideoToolbox on macOS/iOS, and MediaCodec on Android
- **Ultra-low latency** — end-to-end latency under 20 ms on a local network
- **Multi-session** — connect to multiple Leviathan servers simultaneously (desktop)
- **Full input support** — keyboard, mouse, scroll, gamepad passthrough, and remote desktop mode
- **Performance overlay** — real-time RTT, FEC stats, frame rate, and codec information
- **Clipboard sync** — seamless copy-paste between host and client
- **Secure connection** — encrypted transport with authenticated pairing

## Architecture

### Desktop (Windows / macOS / Linux)

- **Electron** for the app shell and UI
- **Rust** (`shen-native`) for performance-critical paths: stream decoding, input handling, audio playback
- **Protocol Buffers** for the control plane communication with Leviathan

### iOS

- **Swift** with SwiftUI for the UI
- **Rust** (via FFI) for WebRTC, stream decoding, and media delivery
- Zero-copy frame delivery with dedicated OS threads for video and audio

### Android

- **Kotlin** with Jetpack Compose for the UI
- **Rust** (via JNI) for WebRTC, stream decoding, and media delivery
- Hardware-backed credential storage via Android KeyStore (AES-256-GCM)

## Next Steps

- [Getting Started](./getting-started) — download and connect to your first Leviathan server
- [Features](./features) — explore what Shen can do
