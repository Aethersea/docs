---
title: "Encoding"
description: "Choose and tune Leviathan hardware and software video encoders."
---

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

> **`auto` follows the desktop's GPU, not the fastest GPU.** Auto-detection reads the vendor of the D3D11 device that *capture* is running on — the adapter driving the desktop. On a hybrid-GPU laptop whose desktop is rendered by the Intel iGPU, `auto` selects **QSV** even when a discrete NVIDIA GPU is present and idle. Set `encoder` explicitly to override.

## GPU Texture Sharing and the Keyed Mutex

On Windows the capture texture pool is allocated with cross-device sharing (`SHARED_NTHANDLE | SHARED_KEYEDMUTEX`) for every hardware encoder path, so the encoder can consume frames without a CPU round trip. Access to those textures is governed by a two-key handshake:

| Step | Actor | Call |
|------|-------|------|
| 1 | Capture | `AcquireSync(key 0)` — take write ownership |
| 2 | Capture | write the frame, then `ReleaseSync(key 1)` — publish |
| 3 | Encoder | `AcquireSync(key 1)` — take read ownership |
| 4 | Encoder | copy the frame, then `ReleaseSync(key 0)` — hand the slot back |

All three hardware backends implement steps 3–4 (NVENC natively; QSV and AMF via the shared helpers in `cgo/windows/keyed_mutex.h`). The software encoder reads on the CPU and keeps the classic unshared pool.

**Diagnosing a broken consumer:** the capture phase summary logs a `key_recovered` counter:

```
[Capture] phases (5s, 292 iters): ... pool_drops=0; key_recovered=39 key_busy=0
```

A steadily climbing `key_recovered` means a consumer copied frames without completing the handshake, so capture had to reclaim slots stranded on key 1 every frame. The stream then shows **black or stale frames** even though capture and the encoder both report healthy frame rates. On a healthy host this counter stays at or near zero. (`key_busy` counts ordinary contention and a small non-zero value is normal under load.)

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
