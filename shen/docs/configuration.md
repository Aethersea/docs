---
sidebar_position: 6
---

# Configuration

Shen stores its settings in a JSON config file.

**Location:**

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\Shen\config.json` |
| macOS | `~/Library/Application Support/Shen/config.json` |
| Linux | `~/.config/Shen/config.json` |

## Settings Reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preferredCodec` | `"h265" \| "av1"` | `"h265"` | Preferred video codec |
| `maxBitrate` | `number` | `50000` | Maximum stream bitrate in kbps |
| `resolution` | `string` | `"auto"` | Stream resolution, e.g. `"1920x1080"` or `"auto"` |
| `refreshRate` | `number` | `0` | Target refresh rate (0 = match host) |
| `audioEnabled` | `boolean` | `true` | Enable remote audio |
| `clipboardSync` | `boolean` | `true` | Enable clipboard synchronisation |
| `gamepadEnabled` | `boolean` | `true` | Enable gamepad forwarding |
| `hardwareDecode` | `boolean` | `true` | Enable hardware-accelerated video decoding |
| `cursorMode` | `"client" \| "remote"` | `"remote"` | Cursor rendering mode |
| `window_mode` | `"fullscreen" \| "borderless" \| "windowed"` | `"fullscreen"` | Window display mode during streaming |
| `immersive_mode` | `boolean` | `false` | Enable global keyboard/mouse hooks (macOS requires Accessibility permission) |
| `remote_desktop_mode` | `boolean` | `false` | Use absolute mouse positioning with local cursor visible — ideal for desktop productivity |

Most settings can be changed through the **Settings** UI without editing the file directly. Per-server stream settings are also stored and applied individually.
