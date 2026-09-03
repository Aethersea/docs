---
title: "Configuration"
description: "Reference for Leviathan server configuration and runtime options."
---

Leviathan is configured via a single TOML file. On first run, a default file is generated at the OS-specific path below.

**Default location:**

| Platform | Path |
|----------|------|
| Windows | `%ProgramData%\leviathan\config.toml` (machine-wide — readable by the service supervisor before any user logs in; legacy `%APPDATA%` configs are migrated forward automatically) |
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
hybrid_gpu_hook = true            # Keep outputs on the GPU that drives them, on hybrid laptops (Windows)
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

[virtual_display]
enabled = false                   # Windows only. Create/adopt and enable the bundled virtual display; false disables a device Leviathan manages and never touches one it doesn't
monitors = 1                      # 1-4 virtual monitors
resolutions = "1920x1080@60, 2560x1440@60, 3840x2160@60"   # comma-separated WxH@Hz (@Hz optional)
refresh_rates = "60"              # comma-separated global refresh rates, applied to every resolution
gpu = ""                          # DXGI adapter name to render on; "" = the driver picks the adapter with the most VRAM
make_primary = false              # Make the virtual monitor the primary display before capture starts
hardware_cursor = true
logging = false                   # Driver's own log under the settings directory

[session]
reattach_console = true           # Reattach an off-console (RDP) user session to the physical console at stream start (Windows)

[telemetry]
enabled = false                   # Off by default; nothing is exported and instrumentation is a no-op
endpoint = ""                     # OTLP/HTTP base URL, e.g. "https://signoz.example.net"
ingestion_key = ""                # Only for collectors that require one (SigNoz Cloud)
ingestion_key_header = ""         # Defaults to "signoz-ingestion-key"
insecure = false                  # Allow a plain http:// endpoint
service_name = ""                 # Defaults to "leviathan"
environment = ""                  # Fills deployment.environment, e.g. "lab"
metric_interval_secs = 15         # Metric export period
logs = true                       # Mirror the process log to the collector
traces = true                     # Export session start-up spans
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
| `hybrid_gpu_hook` | `true` | Windows only. On a laptop with both an integrated and a discrete GPU, DXGI resolves a GPU preference for the process and then *reparents* display outputs onto the resolved GPU — which routinely drags capture onto the integrated GPU, and with it the encoder, since the encoder is created on the capture device. This suppresses that resolution so outputs stay on the adapter that actually drives them. Set `false` to restore the OS behaviour without rebuilding. No effect on single-GPU machines or off Windows. |
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

### `[virtual_display]` (Windows only)

Leviathan's Windows installer can bundle the MIT-licensed [Virtual Display Driver](https://github.com/VirtualDrivers/Virtual-Display-Driver) (an IddCx driver, hardware ID `Root\MttVDD`) so a host can stream without a physical monitor. The installer only stages the driver package (it is an optional, unchecked-by-default component; see [Control Panel](./control-panel)); the device itself is created, enabled, disabled and configured from this section. The control panel's **Virtual Display** category edits the same keys.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | `true` creates the virtual display device (or adopts one that already exists) and enables it. `false` disables a device Leviathan manages. Leviathan never touches — and never uninstalls — a Virtual Display Driver device it did not create or adopt. |
| `monitors` | `1` | Number of virtual monitors, 1–4. |
| `resolutions` | `"1920x1080@60, 2560x1440@60, 3840x2160@60"` | Comma-separated `WxH@Hz` modes; `@Hz` is optional. Width 640–7680, height 480–4320, refresh 24–500 Hz. |
| `refresh_rates` | `"60"` | Comma-separated global refresh rates the driver replicates onto every resolution. |
| `gpu` | `""` | DXGI adapter description the driver should render on (the panel offers the machine's adapter names). Empty lets the driver pick the adapter with the most VRAM. This is only a *preference*: on laptops with an integrated and a discrete GPU, Windows may still place the virtual display on the integrated GPU, which then drives which encoder is used. |
| `make_primary` | `false` | Move the virtual monitor to the primary position before capture starts — capture always follows the primary display. Uses the Windows display-configuration API and saves the layout to the machine display database. The previous primary is not restored on disable; Windows picks a new primary when the virtual monitor goes away. |
| `hardware_cursor` | `true` | Let streaming software own the cursor plane. |
| `logging` | `false` | Enable the driver's own log under the settings directory. |

Lists are comma-separated strings rather than TOML arrays on purpose. Values are validated when the file is saved (also while `enabled = false`), so a typo surfaces immediately rather than when the display is switched on.

**How a change is applied.** The generated driver settings file lives at `%ProgramData%\leviathan\vdd\vdd_settings.xml`; when the feature is enabled, Leviathan points the driver at that directory through the registry value `HKLM\SOFTWARE\MikeTheTech\VirtualDisplayDriver\VDDPATH`. The driver reads its settings only when the device starts, so every change disables and re-enables the device. The service does this at service start and whenever the control panel saves a changed `[virtual_display]` section: it stops the streaming capture process, reconciles the device, then relaunches capture.

**Ownership.** Leviathan records under `HKLM\SOFTWARE\Leviathan\VirtualDisplay` whether it *created* the device or *adopted* an existing one (after snapshotting the previous `VDDPATH` and enable state). Disabling an adopted device that was enabled before hands it back to its previous configuration; uninstalling removes only a device Leviathan created (together with its staged driver package and publisher trust) and restores an adopted one.

### `[session]` (Windows only)

| Key | Default | Description |
|-----|---------|-------------|
| `reattach_console` | `true` | When a streaming client connects while the machine's user session is parked off-console (typically on RDP) and the physical console sits at a userless lock screen, the service reattaches that session to the console (`tscon <sid> /dest:console`) and restarts the capture process into it. Without this, capture can only see the console's black lock screen. **Any active RDP connection to that session is disconnected by design** — the connecting streaming client is assumed to be the machine's owner. On multi-user machines the reattach is skipped when the target session would be ambiguous (several user sessions off-console, none or more than one of them active). Read once at service start: changing it requires a service restart (`leviathan service restart`). |

### `[telemetry]`

Exports OpenTelemetry metrics, logs and traces to an OTLP collector (SigNoz).
Disabled by default — a host that is not pointed at a collector spends nothing
on instrumentation.

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | `false` | Master switch. While `false`, every recording call is a no-op and no exporter is constructed. |
| `endpoint` | *(empty)* | OTLP/**HTTP** base URL, e.g. `https://signoz.example.net`. The `/v1/metrics`, `/v1/logs` and `/v1/traces` paths are appended automatically. A bare `host:port` is accepted and gets a scheme from `insecure`. OTLP/gRPC is not supported: a collector published through a reverse proxy or CDN commonly terminates HTTP/1.1 only. |
| `ingestion_key` | *(empty)* | Sent as an auth header. Leave empty for an unauthenticated self-hosted collector. |
| `ingestion_key_header` | `signoz-ingestion-key` | Header name `ingestion_key` is sent under. |
| `insecure` | `false` | Permit a plain `http://` endpoint. Ignored when `endpoint` already carries a scheme. |
| `service_name` | `leviathan` | Reported `service.name`. |
| `environment` | *(empty)* | Reported `deployment.environment`. Omitted when empty. |
| `metric_interval_secs` | `15` | Metric export period. Kept short deliberately: drop bursts and FEC oscillation are invisible at a minute's resolution. |
| `logs` | `true` | Mirror the process log to the collector as OTLP log records. The local log file/stderr is never replaced — this only adds a second sink. Severity is inferred from the message text. |
| `traces` | `true` | Export session start-up spans (`pipeline.start` → `encoder.init`, `capture.subscribe`). Per-frame work is deliberately not traced; it is covered by metrics instead. |

**Exported metrics.** All are labelled with `session.id`, `video.codec`,
`video.resolution`, `video.fps` and `capture.platform`.

| Metric | Type | What it answers |
|--------|------|-----------------|
| `leviathan.capture.frame_interval` | histogram (ms) | Is delivery smooth? Buckets straddle the 16.7 ms 60fps budget. |
| `leviathan.capture.frames` | counter | Frames the capture backend delivered. |
| `leviathan.encode.latency` | histogram (ms) | Submit → encoded packet. macOS only; the Windows path has no submit-time map to difference against. |
| `leviathan.encode.queue_depth` | gauge | Frames in flight inside the encoder. |
| `leviathan.encode.frames` / `.bytes` | counter | Real delivered bitrate, as opposed to the configured one. |
| `leviathan.encode.keyframes` | counter | Keyframes actually emitted. Kept separate from `keyframe.requests` so "who asked for an IDR" stays answerable. |
| `leviathan.frames.dropped` | counter, by `drop.reason` | `encoder_backlog`, `encode_queue_full`, `encoder_ratecontrol`, `rtp_queue_full` — which stage is losing frames. |
| `leviathan.rtcp.loss` / `.rtt` / `.jitter` | gauge / histogram / gauge | What the client reports receiving. |
| `leviathan.fec.ratio` | gauge | The adaptive FEC level, recorded every cycle so a sawtooth is visible as a sawtooth. |
| `leviathan.keyframe.requests` | counter, by `keyframe.source` | Whether IDRs are client-driven or encoder-drop-driven. |
| `leviathan.sessions.active` | up/down counter | Concurrent sessions. |

`drop.reason = encoder_ratecontrol` is worth watching on its own: it means the
hardware encoder refused a frame because it could not meet the bitrate target.
On the VideoToolbox path that also poisons the following P-frame and forces an
IDR, so a rising count there is the signature of a bitrate set too low for the
resolution.

## Validation

Invalid configuration is rejected at startup. The most common errors:

- `network.mode must be one of: lan, manual`
- `video.default_codec must be hevc or av1`
- `video.encoder must be one of: auto, nvenc, qsv, amf, software`
- `video bitrate range is invalid` — `min_bitrate_kbps` must be `> 0` and `≤ max_bitrate_kbps`
- `network.manual.grpc_port must be between 0 and 65535`

See [Capture](./capture) and [Encoding](./encoding) for backend-specific tuning notes.
