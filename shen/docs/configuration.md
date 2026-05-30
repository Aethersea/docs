---
sidebar_position: 6
---

# Configuration

Shen stores settings **per paired server**. There is no single global config file — each Leviathan server you pair with gets its own stream configuration, persisted as JSON on disk. Most users never need to edit these files directly; the **Stream Settings** dialog in the UI writes them for you.

## Storage Layout

| File | Purpose |
|------|---------|
| `shen/servers.json` | List of paired servers (UUID, name, address, DTLS fingerprint) |
| `shen/configs/{uuid}.json` | Per-server stream configuration |

The parent directory is the OS-native data directory:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\shen\` |
| macOS | `~/Library/Application Support/shen/` |
| Linux | `$XDG_DATA_HOME/shen/` (falls back to `~/.local/share/shen/`) |

Pairing credentials themselves are stored in the OS keyring (Credential Manager on Windows, Keychain on macOS, Secret Service on Linux) via the Rust `keyring` crate — not in any JSON file.

## Stream Config Keys

Each `{uuid}.json` file contains a `StreamConfig` object with the following keys:

### Video

| Key | Type | Description |
|-----|------|-------------|
| `width` | `number` | Horizontal resolution in pixels |
| `height` | `number` | Vertical resolution in pixels |
| `fps` | `number` | Target frames per second |
| `bitrate` | `number \| "auto"` | Bitrate in kbps, or `"auto"` to compute from resolution/FPS/codec |
| `codec` | `"Hevc" \| "Av1"` | Video codec to request from the server |
| `enable_hdr` | `boolean` | Request HDR from the server (host and display must both support it) |
| `frame_pacing` | `"min-latency" \| "balanced" \| "max-smoothness"` | Render pacing strategy |

The `use_custom_resolution` and `use_host_resolution` flags record which preset radio button was last selected in the Settings dialog; they are UI state, not server-facing fields.

### Audio

| Key | Type | Description |
|-----|------|-------------|
| `audio_configuration` | `"Stereo" \| "Surround51" \| "Surround71"` | Channel layout |
| `play_audio_on_host` | `boolean` | If `true`, the host PC keeps playing audio during the session. If `false` (default), the host's default render endpoint is muted for the duration of the session and restored on disconnect. |

### Window & Input

| Key | Type | Description |
|-----|------|-------------|
| `window_mode` | `"fullscreen" \| "borderless" \| "windowed"` | Window mode during streaming. Default: `fullscreen`. |
| `immersive_mode` | `boolean` | Enable global keyboard and mouse hooks so system shortcuts (`Alt+Tab`, `Cmd+Tab`, Win/Cmd key, `Ctrl+Esc`, etc.) are forwarded to the host instead of being consumed locally. Requires Accessibility permission on macOS. **Ignored on Linux** (unsupported — forced off on load; see Features → Immersive Mode). |
| `remote_desktop_mode` | `boolean` | Use absolute mouse positioning with the local cursor visible. The cursor position is sent to the host so it can render a blended cursor overlay. Intended for desktop productivity; defaults to `false` (relative mouse for gaming). |

### Network Measurement

| Key | Type | Description |
|-----|------|-------------|
| `measured_throughput_kbps` | `number` (optional) | Most recent speed-test result, used to cap `bitrate = "auto"`. Updated automatically after each run of the in-app bandwidth test. |

## Example

A typical per-server config file looks like this:

```json
{
  "width": 2560,
  "height": 1440,
  "fps": 120,
  "bitrate": "auto",
  "codec": "Hevc",
  "audio_configuration": "Stereo",
  "play_audio_on_host": false,
  "enable_hdr": false,
  "frame_pacing": "balanced",
  "window_mode": "fullscreen",
  "immersive_mode": true,
  "remote_desktop_mode": false,
  "measured_throughput_kbps": 120000
}
```

## Editing from the UI

Open the **Settings** icon on any paired server card in the home view. The dialog writes to the same `{uuid}.json` file whenever you click **Save**. Stream configurations do not sync between paired servers — tune each one individually.
