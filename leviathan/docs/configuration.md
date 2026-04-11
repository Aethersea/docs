---
sidebar_position: 3
---

# Configuration

Leviathan is configured via a single TOML file. On first run, a default file is generated at the OS-specific path below.

**Default location:**

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\leviathan\config.toml` |
| macOS | `~/Library/Application Support/leviathan/config.toml` |
| Linux | `$XDG_CONFIG_HOME/leviathan/config.toml` (falls back to `~/.config/leviathan/config.toml`) |

## Full Example

```toml
[server]
name = "My PC"                    # Display name advertised to clients

[network]
mode = "lan"                      # "lan" or "manual"
bind_address = "0.0.0.0"          # Interface to bind WebRTC media to

  [network.manual]
  external_ip = ""                # Public IP for NAT1To1 (manual mode only)
  grpc_port = 21218               # gRPC signaling port
  webrtc_port = 0                 # 0 = OS-assigned ephemeral port

[video]
max_width = 3840
max_height = 2160
max_fps = 120
default_codec = "hevc"            # "hevc" or "av1"
encoder = "auto"                  # "auto", "nvenc", "qsv", "amf", or "software"
max_bitrate_kbps = 50000
min_bitrate_kbps = 1000
cross_device = false              # Force separate D3D11 devices for capture+encoder (Windows)
source = "display"                # "display" (default); "v4l2" reserved for RK3588 box
source_device = ""                # e.g. "/dev/video0" when source = "v4l2"

[audio]
channels = 2
sample_rate = 48000
bitrate_kbps = 256
source = "system"                 # "system" (default); "alsa" / "pulseaudio" reserved
source_device = ""                # e.g. "hw:1,0" when source = "alsa"

[input]
enable_keyboard = true
enable_mouse = true
enable_gamepad = true
enable_touch = true

[clipboard]
disabled = false                  # true disables clipboard sync entirely
```

## Sections

### `[server]`

| Key | Default | Description |
|-----|---------|-------------|
| `name` | hostname | Friendly server name returned to clients via `GetServerInfo` |

### `[network]`

| Key | Default | Description |
|-----|---------|-------------|
| `mode` | `"lan"` | Network mode. `"lan"` lets the OS assign ephemeral UDP ports for WebRTC. `"manual"` enables the `[network.manual]` overrides for fixed ports / NAT1To1. |
| `bind_address` | `"0.0.0.0"` | Local interface to bind WebRTC ICE candidates to. Set to a specific IP (e.g. a VPN interface) to restrict the server's reachable surface. |

#### `[network.manual]`

These keys are only meaningful when `network.mode = "manual"`.

| Key | Default | Description |
|-----|---------|-------------|
| `external_ip` | `""` | Public IP advertised as a host candidate via WebRTC `NAT1To1IPs`. Required when port-forwarding. |
| `grpc_port` | `21218` | TCP port the gRPC signaling server listens on. Also used in `lan` mode. |
| `webrtc_port` | `0` | Fixed UDP port for the shared WebRTC ICE UDP mux. `0` means dynamic ephemeral ports per session. |

> **Note:** Leviathan does not run a STUN/TURN client. ICE candidate gathering is the client's responsibility — the server runs in **ICE-Lite** mode and only responds to connectivity checks.

### `[video]`

| Key | Default | Description |
|-----|---------|-------------|
| `max_width` | `3840` | Upper bound on negotiated stream width. The actual width is requested by the client per-session. |
| `max_height` | `2160` | Upper bound on negotiated stream height. |
| `max_fps` | `120` | Upper bound on capture frame rate. The display's refresh rate ultimately limits this. |
| `default_codec` | `"hevc"` | `"hevc"` (H.265) or `"av1"`. Clients can override per-session. |
| `encoder` | `"auto"` | Encoder backend. See [Encoding](./encoding) for the per-platform mapping. |
| `max_bitrate_kbps` | `50000` | Adaptive bitrate ceiling. |
| `min_bitrate_kbps` | `1000` | Adaptive bitrate floor. |
| `cross_device` | `false` | Force the encoder to allocate its own D3D11 device instead of sharing the capture device (Windows). The pipeline auto-promotes to cross-device when more than one session subscribes to the same display, so this flag is rarely needed manually. |
| `source` | `"display"` | Video input backend. Only `"display"` is wired up today; `"v4l2"` is reserved for the RK3588 streaming box backend. |
| `source_device` | `""` | Device identifier when `source` is not `"display"` (e.g. `/dev/video0`). |

### `[audio]`

| Key | Default | Description |
|-----|---------|-------------|
| `channels` | `2` | Channel count for the captured/encoded stream. |
| `sample_rate` | `48000` | Sample rate in Hz. |
| `bitrate_kbps` | `256` | Opus bitrate per stream. |
| `source` | `"system"` | Audio input backend. Only `"system"` (platform loopback / WASAPI / ScreenCaptureKit audio) is wired up today; `"alsa"` and `"pulseaudio"` are reserved. |
| `source_device` | `""` | Device identifier when `source` is not `"system"` (e.g. `hw:1,0` for ALSA). |

### `[input]`

Toggle whether each input class is honored by the server's virtual input layer. Disabled classes are silently dropped from the control DataChannel.

| Key | Default | Description |
|-----|---------|-------------|
| `enable_keyboard` | `true` | Inject keyboard events. |
| `enable_mouse` | `true` | Inject mouse events. |
| `enable_gamepad` | `true` | Inject gamepad events (Windows: ViGEm). |
| `enable_touch` | `true` | Inject touch events. |

### `[clipboard]`

| Key | Default | Description |
|-----|---------|-------------|
| `disabled` | `false` | Set to `true` to disable bidirectional clipboard sync entirely. On macOS this also skips launching `clipboard-helper`. |

## Validation

Invalid configuration is rejected at startup. The most common errors:

- `network.mode must be one of: lan, manual`
- `video.default_codec must be hevc or av1`
- `video.encoder must be one of: auto, nvenc, qsv, amf, software`
- `video bitrate range is invalid` — `min_bitrate_kbps` must be `> 0` and `≤ max_bitrate_kbps`
- `network.manual.grpc_port must be between 0 and 65535`

See [Capture](./capture) and [Encoding](./encoding) for backend-specific tuning notes.
