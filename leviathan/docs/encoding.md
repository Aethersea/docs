---
sidebar_position: 5
---

# Encoding

Leviathan encodes captured frames in H.265 (HEVC) or AV1 using a hardware-accelerated backend selected per platform. All encoder settings live under the `[video]` section of `config.toml`.

## Encoder Selection

Set `video.encoder` to one of:

| Value | Description |
|-------|-------------|
| `"auto"` | Pick the best available backend for the current platform/GPU. Default. |
| `"nvenc"` | NVIDIA NVENC (Windows; requires NVIDIA GPU) |
| `"amf"` | AMD AMF (Windows; requires AMD GPU) |
| `"qsv"` | Intel Quick Sync Video (Windows; requires Intel GPU / iGPU) |
| `"software"` | CPU encoding via SVT-AV1 / libx265 fallback. High CPU usage. |

> **Note:** macOS always uses **VideoToolbox** when running on macOS, regardless of the `encoder` value (the per-platform `pipeline_darwin.go` selects it directly). The `encoder` config keys above describe the Windows backend matrix.

```toml
[video]
encoder = "auto"
default_codec = "hevc"
```

## Supported Codecs

| Value | Description |
|-------|-------------|
| `"hevc"` | H.265 / HEVC — widely supported, best quality/performance balance today |
| `"av1"` | AV1 — ~30% more efficient than HEVC at equivalent quality (requires AV1-capable encoder hardware) |

The default codec is set via `video.default_codec`. Clients may also request a specific codec per session via `SessionConfig.codec`.

## Bitrate

Leviathan uses adaptive bitrate (ABR) bounded by an explicit min/max in kbps:

```toml
[video]
max_bitrate_kbps = 50000
min_bitrate_kbps = 1000
```

| Key | Default | Description |
|-----|---------|-------------|
| `max_bitrate_kbps` | `50000` | Adaptive ceiling. For local gigabit networks, raising this to `100000`–`150000` gives near-lossless quality at the cost of LAN bandwidth. |
| `min_bitrate_kbps` | `1000` | Adaptive floor. The bitrate controller will not drop below this even on degraded networks. |

The runtime target moves between these bounds based on RTCP loss reports and the GCC delay-gradient signal.

## Keyframe Strategy

Leviathan uses a **long GOP** (Group of Pictures) strategy instead of periodic IDR frames. The GOP length is set to roughly 1 minute (`fps × 60` frames), avoiding the large bitrate spikes that periodic IDRs would cause — those spikes can congest the network and produce visible stutter.

When a client needs recovery (e.g. after unrecoverable packet loss), it sends an explicit **IDR request** via the control DataChannel and Leviathan responds with an on-demand keyframe. This gives smoother bitrate distribution while keeping fast error recovery.

## Forward Error Correction (FEC)

Reed-Solomon FEC parity packets are added to each encoded frame so the client can recover from limited UDP loss without round-tripping a retransmission request. The FEC overhead percentage is dynamically adjusted based on measured loss and the GCC delay-gradient signal:

- `delay_gradient ≈ 0` and `loss > 0` → random loss (e.g. WiFi); **increase** FEC.
- `delay_gradient ↑` and `loss > 0` → congestion loss; **decrease** FEC.
- `delay_gradient ↑` and `loss ≈ 0` → early congestion; **preemptively reduce** FEC.

This avoids the "FEC death spiral" where congestion-induced loss triggers more FEC, which consumes more bandwidth, which causes more congestion.

When RTT is unavailable (no RTCP Receiver Report yet), Leviathan falls back to jitter-based estimation for the network-quality classification.
