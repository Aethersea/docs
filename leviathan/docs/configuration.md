---
sidebar_position: 3
---

# Configuration

Leviathan is configured via a TOML file.

**Default location:**

| Platform | Path |
|----------|------|
| Windows | `%ProgramData%\Leviathan\config.toml` |
| macOS / Linux | `~/.config/leviathan/config.toml` |

## Full Example

```toml
[server]
port = 47990
bind = "0.0.0.0"

[capture]
fps = 60
hdr = false

[encoding]
codec = "h265"          # "h264" or "h265"
encoder = "auto"        # "auto", "nvenc", "amf", "videotoolbox", "software"
bitrate = 50000         # kbps
min_bitrate = 5000
max_bitrate = 100000

[audio]
enabled = true
device = "default"

[input]
keyboard = true
mouse = true
gamepad = true

[pairing]
timeout = 120           # seconds

[clipboard]
enabled = true
```

## Sections

### `[server]`

| Key | Default | Description |
|-----|---------|-------------|
| `port` | `47990` | TCP port for the control connection |
| `bind` | `"0.0.0.0"` | Interface to listen on |

### `[encoding]`

| Key | Default | Description |
|-----|---------|-------------|
| `codec` | `"h265"` | Video codec: `"h264"` or `"h265"` |
| `encoder` | `"auto"` | Encoder backend (see [Encoding](./encoding)) |
| `bitrate` | `50000` | Initial bitrate in kbps |
| `min_bitrate` | `5000` | Minimum adaptive bitrate |
| `max_bitrate` | `100000` | Maximum adaptive bitrate |

### `[audio]`

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `true` | Stream audio |
| `device` | `"default"` | Audio capture device name |

See [Capture](./capture) and [Encoding](./encoding) for detailed tuning options.
