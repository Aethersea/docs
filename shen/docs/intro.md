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
| Linux (x64) | 🚧 Experimental |

## Key Features

- **Hardware-accelerated decoding** — uses D3D11VA / NVDEC on Windows and VideoToolbox on macOS for smooth playback at full resolution
- **Ultra-low latency** — end-to-end latency under 20 ms on a local network
- **Full input support** — keyboard, mouse, scroll, and gamepad passthrough
- **Clipboard sync** — seamless copy-paste between host and client
- **Secure connection** — encrypted transport with authenticated pairing

## Architecture

Shen is built with:

- **Electron** for the app shell and UI
- **Rust** (`shen-native`) for performance-critical paths: stream decoding, input handling, audio playback
- **Protocol Buffers** for the control plane communication with Leviathan

## Next Steps

- [Getting Started](./getting-started) — download and connect to your first Leviathan server
- [Features](./features) — explore what Shen can do
