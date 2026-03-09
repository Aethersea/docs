---
sidebar_position: 5
---

# Encoding

Leviathan supports multiple hardware encoder backends.

## Encoder Selection

Set `encoder` in `config.toml` to one of:

| Value | Description |
|-------|-------------|
| `"auto"` | Automatically select the best available encoder |
| `"nvenc"` | NVIDIA NVENC (requires NVIDIA GPU) |
| `"amf"` | AMD AMF (requires AMD GPU) |
| `"qsv"` | Intel Quick Sync Video (requires Intel GPU / iGPU) |
| `"videotoolbox"` | Apple VideoToolbox (macOS only) |
| `"software"` | Software (libx264 / libx265) — fallback, high CPU usage |

## NVIDIA NVENC

NVENC uses the dedicated hardware encoder on NVIDIA GPUs (Kepler or newer). Recommended for the best quality-to-performance ratio on Windows.

Requires NVIDIA driver **522.25** or later.

```toml
[encoding]
encoder = "nvenc"
codec = "h265"
```

## AMD AMF

AMF uses the Video Coding Engine (VCE) on AMD GPUs. Supported on RX 400 series and newer.

```toml
[encoding]
encoder = "amf"
codec = "h265"
```

## Apple VideoToolbox

On macOS, VideoToolbox provides hardware H.264 and H.265 encoding on all Apple Silicon Macs and most Intel Macs with a T-series chip.

```toml
[encoding]
encoder = "videotoolbox"
codec = "h265"
```

## Bitrate & Quality

Leviathan uses adaptive bitrate control. The initial bitrate targets can be set:

```toml
[encoding]
bitrate = 50000      # kbps – starting bitrate
min_bitrate = 5000   # kbps – minimum (poor network)
max_bitrate = 100000 # kbps – maximum (local network)
```

For a local gigabit network, setting `max_bitrate = 150000` (150 Mbps) provides near-lossless quality. For WAN connections, keep `max_bitrate` under `20000`.
