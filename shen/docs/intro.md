---
sidebar_position: 1
---

# Introduction

**Shen** is the desktop client for [Aethersea](https://theaethersea.com). It connects to a [Leviathan](https://leviathan.theaethersea.com) server over WebRTC and renders the remote desktop or game stream with low end-to-end latency.

This documentation covers the **desktop** client (Windows, macOS, Linux). The iOS and Android clients are separate projects with their own builds and differ in feature coverage.

## Supported Platforms

| Platform | Status |
|----------|--------|
| Windows 10/11 (x64) | ✅ Supported |
| macOS 13+ (Apple Silicon) | ✅ Supported |
| macOS 13+ (Intel) | ✅ Supported |
| Linux (x64, AppImage / .deb) | 🚧 Experimental |

## Key Features

- **Hardware-accelerated decoding** — D3D11VA / NVDEC on Windows, VideoToolbox on macOS, VAAPI on Linux. HEVC is hardware-only (no software fallback); AV1 falls back to `rav1d` (pure-Rust) where hardware AV1 decode is unavailable.
- **Multi-session** — connect to several Leviathan servers at once, each in its own window.
- **Full input** — keyboard, mouse (relative and absolute), high-precision scroll, and up to 16 gamepads via SDL3 with rumble and motion sensor support where available.
- **Immersive mode** — global keyboard and mouse hooks so system shortcuts (`Alt+Tab`, `Cmd+Tab`, Win/Cmd key, etc.) are forwarded to the host instead of being eaten by the client OS.
- **Remote desktop mode** — absolute mouse with a visible local cursor, for productivity use.
- **Clipboard sync** — bidirectional text, images, and files. On macOS this is handled by a bundled `clipboard-helper` process.
- **Performance overlay** — live RTT, packet loss, FEC recovery rate, codec, resolution, and frame rate, driven by a dedicated telemetry DataChannel from the server.
- **Encrypted transport** — DTLS-SRTP for media, DTLS/SCTP for DataChannels, TLS for signaling. Pairing credentials live in the OS keyring.

## Architecture

Shen is an Electron app with a Rust native addon loaded in the preload script:

- **Electron + React 19 + MUI 7** for the UI and Chromium-side WebRTC media transport.
- **Rust (napi-rs)** compiled to a `.node` shared library for gRPC signaling, input injection, gamepad (SDL3), global hooks, AV1 software decode, and WebRTC control/telemetry/clipboard DataChannels.
- **Protocol Buffers** for everything on the wire between Shen and Leviathan.

Video frames cross process boundaries through `SharedArrayBuffer` ring buffers — the native addon is loaded in the **preload** (not the main process) so the renderer can read frames directly with no IPC serialization.

## Next Steps

- [Getting Started](./getting-started) — install Shen and pair with a Leviathan server.
- [Features](./features) — details on each of the capabilities above.
- [Keyboard Shortcuts](./keyboard-shortcuts) — client-side hotkeys.
- [Configuration](./configuration) — per-server stream settings and where they're stored.
