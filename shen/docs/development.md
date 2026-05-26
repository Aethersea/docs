---
sidebar_position: 8
---

# Development

This guide covers building Shen from source and understanding the project layout.

## Prerequisites

- **Node.js 18+**
- **Rust toolchain** (via `rustup`)
- **C/C++ toolchain** (for native addon compilation)
- **protoc** (Protocol Buffers compiler)
- **NASM** (for assembly-optimized codecs)

## Build Commands

```bash
npm install                    # Install JS deps (also runs build:icons via postinstall)
npm run build:native           # Build Rust .node addon (release)
npm run build:native:debug     # Build Rust .node addon (debug)
npm run build:clipboard-helper # Download macOS clipboard-helper binary
npm run build:icons            # Generate platform icons
npm run build:frontend         # electron-vite build only (no native, no packaging)
npm run dev                    # build:native + build:clipboard-helper + electron-vite dev (HMR port 1420)
npm run start                  # alias for `electron-vite dev` (no native rebuild)
npm run preview                # electron-vite preview (runs the last `npm run build` output)
npm run build                  # Full production build: icons → native → clipboard-helper → vite build → electron-builder
```

## Project Structure

```
shen/
├── electron/               # Electron main & preload
│   ├── main.ts             # Window creation, GPU flags, Chromium switches
│   └── preload.ts          # Loads .node addon, exposes API via contextBridge
├── src/                    # React renderer
│   ├── components/         # UI components
│   ├── pages/              # Home, Streaming pages
│   ├── services/           # Bridge to native addon + WebRTC logic
│   ├── stores/             # Zustand state
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   ├── utils/              # Utilities
│   └── proto/              # Protobuf TS types
├── native/                 # Rust napi-rs addon (crate: shen-native)
│   ├── src/
│   │   ├── lib.rs          # napi-rs entry point
│   │   ├── leviathan/      # gRPC signaling + WebRTC control
│   │   ├── av1_decoder.rs  # Software AV1 via rav1d
│   │   ├── gamepad.rs      # SDL3 gamepad input
│   │   ├── immersive/      # Global keyboard/mouse hooks
│   │   ├── clipboard/      # Clipboard support
│   │   ├── bridge.rs       # JS↔Rust bridge
│   │   ├── input_buffer.rs # Input ring buffer
│   │   └── ring_buffer.rs  # SharedArrayBuffer ring buffers
│   ├── proto/              # .proto definitions
│   ├── patches/            # sdl3-sys local patch
│   └── build.rs            # Build script (napi-build + tonic-build)
├── scripts/
│   ├── build-native.js
│   ├── download-clipboard-helper.js
│   └── generate-icons.js
├── config/
│   └── entitlements.mac.plist   # macOS hardened runtime entitlements
└── build/icons/                 # Generated platform icons
```

## Tech Stack

| Layer | Technology |
|---|---|
| Renderer | React 19 + TypeScript + MUI 7 + Zustand 5 |
| Build tool | Vite 6 + electron-vite 5 |
| Main / Preload | Electron 41 + TypeScript |
| Native addon | Rust (napi-rs 2) compiled to `.node` shared library |
| Signaling | gRPC via `tonic` → Leviathan server |
| Media transport | Browser-native WebRTC `RTCPeerConnection` |
| Control transport | `webrtc-rs` DataChannel (Rust side) |
| AV1 SW decode | `rav1d` (pure-Rust port of dav1d) |
| Gamepad | SDL3 (built from source, statically linked) |
| Credentials | `keyring` (OS native: Win / Mac / Linux) |
| Packaging | electron-builder 26 (NSIS on Win, DMG on Mac) |

## Architecture Notes

### Native addon in preload

The Rust `.node` addon is loaded in the **preload** script (not the main process). This gives the renderer direct `SharedArrayBuffer` access for video frame data, avoiding IPC serialization overhead between processes.

### In-process GPU

The Chromium flag `--in-process-gpu` runs the GPU compositor in the renderer process. This eliminates IPC round-trips on WebGL calls, preventing hardware decoder texture pool starvation during high-framerate streaming.

### WebRTC IP handling

The flag `--force-webrtc-ip-handling-policy=disable_non_proxied_udp` prevents WebRTC from leaking local IP addresses.

### SDL3 gamepad

SDL3 is built from source with a local `sdl3-sys` patch that strips unused SDL subsystems, reducing binary size and build time.

### Bytecode compilation

Main and preload scripts are compiled to V8 bytecode via electron-vite for obfuscation.

### Logging

`RUST_LOG` is set to `debug` in development and `info` in production builds.

## macOS Packaging

- DMG with hardened runtime + entitlements
- `clipboard-helper` binary bundled into `Helpers/`
- `.node` files placed in `extraResources` (unpacked from asar)

## Linux Packaging

- AppImage + `.deb` (`electron-builder --linux`)
- `clipboard-helper` (Qt 6) binary bundled into `extraResources/`
- **Icons**: `linux.icon` points at the `build/icons` directory. electron-builder
  scans that directory and only installs PNGs whose filename encodes a size (the
  first run of digits), mapping each to `/usr/share/icons/hicolor/<size>/apps/`.
  `generate-icons.js` therefore emits `16x16.png` … `512x512.png`. **Do not rely
  on `icon.png` alone** — once any size-encoded PNG (e.g. the `icon-1024.png`
  used for the macOS `.icns`) exists in the directory, electron-builder skips its
  auto-resize fallback, so the standard hicolor sizes must be generated
  explicitly or the installed `.deb` shows a blank application icon.
