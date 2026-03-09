---
sidebar_position: 2
---

# Architecture

A deeper look at how Aethersea's components work together.

## Transport

Aethersea uses a custom signaling protocol for connection establishment and a direct encrypted channel for media transport.

## Video Pipeline

**Leviathan (capture side)**

1. Desktop capture via OS APIs (DXGI on Windows, ScreenCaptureKit on macOS)
2. Hardware encode: NVENC (NVIDIA), AMF (AMD), VideoToolbox (Apple)
3. RTP packetisation and transmission

**Shen (render side)**

1. RTP reception and jitter buffering
2. Hardware decode: D3D11VA / NVDEC (Windows), VideoToolbox (macOS)
3. Frame rendering via WebGL / native renderer

## Input Pipeline

Input events (keyboard, mouse, gamepad) are captured by Shen, serialised via Protocol Buffers, and forwarded to Leviathan which injects them through the OS input subsystem.

## Clipboard

Clipboard synchronisation is handled by the `clipboard-helper` auxiliary process on macOS, which bridges the sandboxed Electron renderer with the native pasteboard.
