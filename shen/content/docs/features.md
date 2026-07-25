---
title: "Features"
description: "Explore Shen streaming, input, clipboard, and multi-session capabilities."
---

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

Re-acquisition is a persistent retry loop rather than a single attempt. Chromium blocks pointer-lock requests for 1.25 s after the user exits the lock with `Esc` (the block is waived in fullscreen), so after an `Esc` press in windowed mode the cursor is briefly released and then locked again automatically — typically within about 1.5 s, or instantly in fullscreen. If a lock attempt keeps failing, Shen retries every 300 ms for up to 6 s per trigger; the next click always re-arms it.

## Immersive Mode

Immersive mode installs **global** keyboard and mouse hooks so system shortcuts (`Alt+Tab`, the Windows / Command key, `Cmd+Space`, `Ctrl+Esc`, and so on) are captured by Shen and forwarded to the host instead of being consumed by the client OS.

- Toggle at runtime with `Ctrl+Shift+Alt+I`.
- Automatically suspended while the overlay is open, while the Shen window is unfocused, and during screen lock / system sleep.
- Only activates while the stream is actively receiving media — it will not engage during the `connecting` or `reconnecting` phases.
- On **macOS**, the global hooks require **Accessibility** permission. If any saved server config has `immersive_mode = true`, Shen proactively requests the permission at startup so the check never blocks the first session.
- **Not available on Linux.** The native Wayland path cannot grab input from a foreign surface (issue #14), so immersive mode is unsupported there: the Stream Settings toggle is hidden and `immersive_mode` is forced off when a config loads, regardless of what is stored. Use **Keyboard Lock** (active in fullscreen) for system-shortcut capture on Linux instead.

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

The resolution you configure is a **budget box** — a maximum, never a literal output size. The host derives the actual stream as a uniform, never-upscaled fit of its live desktop into the box, so a mismatched aspect ratio (a 16:9 preset on a 16:10 host, say) can never distort the picture: the stream keeps the host's aspect and simply spends fewer pixels, and the client letterboxes as needed. The host reports every derived size back mid-stream, including desktop resolution changes.

Resolution modes:

- **Host Resolution** (default): sends a host-native budget — the host streams its live desktop size (capped by its own `max_width`/`max_height`) and follows desktop changes automatically. Works even when the host cannot describe its monitor (e.g. its session is on RDP); the host itself decides once capture starts.
- **Follow Window Size**: the budget tracks this window's physical pixel size (CSS size × display scaling) and renegotiates after you resize the window or move it to a display with a different scale factor. An oversized window simply streams at the host's native size.
- **Presets / Custom**: fixed budget boxes. Preset heights are derived from the host's aspect ratio when known; custom boxes accept any ratio (the surplus axis of an odd ratio is just unused).

Frame rate is negotiated per session and capped by the server's `max_fps` and the display refresh rate.

## HDR

HDR streaming can be requested per session when the server advertises HDR support and the client display is in HDR mode. HDR is best-effort: Leviathan today runs the internal encode path in SDR even on HDR desktops (the DWM tonemaps before capture), so the flag primarily affects the client-side decode and display path.
