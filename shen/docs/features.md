---
sidebar_position: 3
---

# Features

## Video Streaming

Shen receives the H.264 or H.265 (HEVC) video stream from Leviathan and decodes it using the GPU, keeping CPU usage minimal even at 4K/144 Hz.

| Codec | Windows | macOS |
|-------|---------|-------|
| H.264 | ✅ | ✅ |
| H.265 (HEVC) | ✅ | ✅ |
| AV1 | 🚧 | 🚧 |

## Audio

Remote audio is received and played back with low latency using a dedicated audio worklet, minimising buffering artefacts.

## Input

All input events captured in the Shen window are forwarded to the host in real time:

| Input Type | Notes |
|-----------|-------|
| Keyboard | Full key pass-through including modifier keys |
| Mouse | Relative and absolute modes |
| Scroll | High-precision trackpad scroll supported |
| Gamepad | Up to 4 simultaneous controllers via XInput / SDL |

## Clipboard Sync

Text, images, and files can be copied on one machine and pasted on the other. On macOS, clipboard synchronisation is handled by the bundled **clipboard-helper** process which bridges the Electron sandbox to the native pasteboard.

See [Clipboard](./clipboard) for details.

## Resolution & Refresh Rate

Shen automatically negotiates the stream resolution with Leviathan. You can override this in **Settings → Display**.
