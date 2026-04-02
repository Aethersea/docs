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
| `"software"` | Software (SVT-AV1 / libx265) — fallback, high CPU usage |

## Supported Codecs

| Codec | Description |
|-------|-------------|
| `"h265"` | H.265 (HEVC) — widely supported, good quality/performance balance |
| `"av1"` | AV1 — ~30% more efficient than HEVC at equivalent quality |

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

On macOS, VideoToolbox provides hardware H.265 encoding on all Apple Silicon Macs and most Intel Macs with a T-series chip.

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

## Keyframe Strategy

Leviathan uses a **long GOP** (Group of Pictures) strategy instead of periodic IDR frames. The GOP length is set to 1 minute (`fps × 60` frames), which avoids the large bitrate spikes (300+ KB) that periodic IDR frames cause — these spikes can congest the network and cause visible stutter.

When a client needs recovery (e.g. after packet loss), it sends an explicit **IDR request** via the control channel, and Leviathan responds with an on-demand keyframe. This approach provides smoother bitrate distribution while maintaining fast error recovery.

## Forward Error Correction (FEC)

Reed-Solomon FEC is applied to encoded packets. The FEC overhead percentage is dynamically adjusted based on network conditions:

| Network Type | RTT | FEC Overhead |
|-------------|-----|-------------|
| LAN | < 5 ms | 5% |
| Local | < 20 ms | 10% |
| Regional | < 80 ms | 15% |
| Long-haul | < 150 ms | 20% |
| Intercontinental | > 150 ms | 25% |

When RTT is unavailable (no RTCP Sender Report received), Leviathan falls back to jitter-based estimation.
