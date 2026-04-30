---
sidebar_position: 3
---

# Features

## Video

Shen decodes the video stream from Leviathan on the GPU. HEVC requires a hardware decoder on every platform; if none is available the stream will not start. Only AV1 has a software fallback, because some otherwise-supported GPUs lack an AV1 hardware decoder.

| Codec | Windows | macOS | Linux |
|-------|---------|-------|-------|
| H.265 (HEVC) | D3D11VA / NVDEC | VideoToolbox | VAAPI |
| AV1 | D3D11VA / NVDEC if supported; otherwise `rav1d` | VideoToolbox if supported; otherwise `rav1d` | `rav1d` |

`rav1d` is a pure-Rust port of `dav1d` and is used as the AV1-only software fallback when hardware AV1 decode is unavailable. There is no equivalent fallback for HEVC: software HEVC decode caused devices to overheat and has been removed.

## Audio

Remote audio is decoded from Opus and played back with low latency via a dedicated audio worklet. Channel layout is configurable per server (stereo, 5.1, or 7.1).

### Play audio on host

By default, the host PC is muted for the duration of the streaming session so audio only plays on the client. Enable **Play audio on host** in the stream settings if you want the host to keep playing audio locally — useful when someone near the host also wants to hear the session. The host's original mute state is restored on disconnect, and concurrent sessions are refcounted so the host stays muted as long as any active session has the option off.

## Multi-Session

Shen can connect to multiple Leviathan servers simultaneously. Each streaming session opens in its own window; the home screen shows live status for every active session and lets you start and stop them independently.

## Input

All input captured in the Shen window is forwarded to the host in real time.

| Input Type | Notes |
|-----------|-------|
| Keyboard | Full pass-through including modifier keys. `Ctrl+Alt+Backspace` is translated to `Ctrl+Alt+Delete` on the host. |
| Mouse | Relative (for gaming) and absolute (remote-desktop) modes. |
| Scroll | High-precision trackpad scroll supported. |
| Gamepad | Up to 16 simultaneous controllers via **SDL3** (statically linked). Buttons, analog sticks, triggers, rumble (body and trigger), motion sensors, touchpad, LEDs, and battery state are all forwarded where the controller supports them. |

### Remote Desktop Mode

When enabled, Shen uses absolute mouse positioning with the local cursor visible — ideal for desktop productivity. The cursor position is forwarded to the host so Leviathan can render a cursor overlay blended into the stream.

### Pointer Lock

During streaming in relative mouse mode, Shen automatically re-acquires pointer lock whenever the overlay is dismissed, preventing the local cursor from appearing during gameplay.

## Immersive Mode

Immersive mode installs **global** keyboard and mouse hooks so system shortcuts (`Alt+Tab`, the Windows / Command key, `Cmd+Space`, `Ctrl+Esc`, and so on) are captured by Shen and forwarded to the host instead of being consumed by the client OS.

- Toggle at runtime with `Ctrl+Shift+Alt+I`.
- Automatically suspended while the overlay is open, while the Shen window is unfocused, and during screen lock / system sleep.
- Only activates while the stream is actively receiving media — it will not engage during the `connecting` or `reconnecting` phases.
- On **macOS**, the global hooks require **Accessibility** permission. If any saved server config has `immersive_mode = true`, Shen proactively requests the permission at startup so the check never blocks the first session.

## Performance Overlay

A real-time overlay shows streaming diagnostics:

- Stream resolution, codec, and configured FPS
- Received vs rendered frame rate
- Network round-trip time (RTT) with color-coded health indicators (green ≤ 30 ms, yellow ≤ 80 ms, red > 80 ms)
- Packet loss percentage
- FEC (Forward Error Correction) recovery rate
- IDR keyframe request count

RTT and loss data arrive via a dedicated **telemetry DataChannel**, which Leviathan populates from RTCP Receiver Reports.

## Clipboard Sync

Text, images, and files can be copied on one machine and pasted on the other. See [Clipboard](./clipboard) for platform-specific details and the macOS `clipboard-helper` architecture.

## Resolution & Refresh Rate

The stream resolution and frame rate are negotiated per session. You can pick a preset, enter a custom resolution, or select **Use host resolution** to match the server's primary display. The server caps the request to the bounds it exposes (`max_width`, `max_height`, `max_fps`).

## HDR

HDR streaming can be requested per session when the server advertises HDR support and the client display is in HDR mode. HDR is best-effort: Leviathan today runs the internal encode path in SDR even on HDR desktops (the DWM tonemaps before capture), so the flag primarily affects the client-side decode and display path.
