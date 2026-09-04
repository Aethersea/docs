---
title: "Capture"
description: "Configure platform capture backends and display selection in Leviathan."
---

Leviathan uses OS-native APIs to capture the desktop with minimal overhead.

## CaptureHub

Leviathan uses a **CaptureHub** abstraction to share a single capture instance across multiple streaming sessions. Instead of each client creating its own capture, CaptureHub maintains one OS-level capture and distributes frames to all subscribers. This significantly reduces system resource usage when multiple clients are connected.

Each subscriber receives its own set of GPU texture buffers. On Windows, the texture pool grows dynamically (up to 24 textures) based on the number of active subscribers, with ~6 textures per subscriber for in-flight buffering. On macOS, `CVPixelBuffer` reference counting ensures buffers remain valid for all subscribers.

### Recovery frame edge detection

When DXGI Desktop Duplication recovers from `DXGI_ERROR_ACCESS_LOST` (e.g. resolution change, secure desktop, GPU TDR), the C capture layer emits a burst of *fallback* frames marked `RecoveryFrame=true` so encoders know to force a fresh IDR. CaptureHub collapses this burst into a **single edge** per recovery episode: only the first frame of each episode reaches subscribers with `RecoveryFrame=true`; the remainder of the burst is delivered with the flag cleared. Without this de-duplication, every fallback frame would trigger an IDR on every subscriber, producing an IDR storm that flickers all connected clients.

### Multi-subscriber encoder isolation (Windows)

When a second session subscribes to a hub that already has an active subscriber, the new session's pipeline gives its encoder **its own D3D11 device** instead of reusing the capture's shared device. This is critical because the D3D11 Video Processor used for BGRA→NV12 conversion serializes work on the immediate context: two encoders sharing one device would cause per-frame VP times to spike from `<1ms` to `30–90ms`, dropping frames on the existing client and triggering a recovery loop. The second device costs one texture copy per frame but eliminates the contention.

That second device is always created on the **same adapter as capture**. Encoding from a different GPU is refused outright — the CPU bridge it would need does not honour the capture pool's keyed mutex and encodes black frames (issue #44). If no encoder can be placed on the capture adapter, the pipeline falls back to sharing the capture device and accepts the contention.

The first subscriber may also be given its own device retroactively if both sessions race to subscribe.

## Windows — Windows.Graphics.Capture

Since 2026-09, Windows has two capture sources, selected by `[video] capture_backend` (`auto` by default). **Windows.Graphics.Capture (WGC)** is preferred where it works; **DXGI Desktop Duplication** remains the fallback and is still what captures the lock screen.

WGC exists here for one reason: when an output's hardware cursor plane falls back to composition — which some games trigger for the whole output — Desktop Duplication hands back frames with the mouse pointer already painted in, and offers **no API to remove it**. In overlay cursor mode the client then draws its own cursor on top of a baked one and the user sees two. `GraphicsCaptureSession.IsCursorCaptureEnabled = false` tells the compositor to omit the pointer at the source, which is the only real fix.

### It runs in a separate process, under the interactive user's token

WGC **refuses a SYSTEM process outright**: `GraphicsCaptureSession::IsSupported()` throws `0x80070424` (`ERROR_SERVICE_DOES_NOT_EXIST`) and `CreateForMonitor` returns the same, with or without the calling thread impersonating the interactive user. Leviathan's streaming child runs as SYSTEM deliberately — that is what lets Desktop Duplication capture the lock screen — so the WinRT half lives in `LeviathanWGC.exe`, launched beside it with `WTSQueryUserToken` + `CreateProcessAsUser`.

Frames come back through a shared `SHARED_NTHANDLE | SHARED_KEYEDMUTEX` texture plus a frame-ready event: the same keyed-mutex bracket the in-process texture pool already uses, with the producer role moved across a process boundary. The helper is given the capture device's adapter LUID because a shared texture cannot cross adapters.

`LeviathanWGC.exe` is looked up **beside `leviathan.exe`** and is optional — without it the capture loop simply stays on DXGI.

### Hybrid switching

The two sources swap live, and the swap forces a keyframe:

- **Secure desktop** (lock screen, UAC, Ctrl-Alt-Del) — WGC cannot see it, so capture falls back to DXGI, and the helper process is **stopped**. That second part is not housekeeping: a live WGC session keeps the output off the hardware cursor plane, so a helper left running while DXGI captures makes DXGI bake the pointer into every frame — the exact defect this backend exists to fix. Returning to the Default desktop relaunches the helper.
- **Resolution change** — the helper republishes at the new size (`RESIZE`), the capture loop rebuilds its texture pool and the encoder reconfigures, exactly as the DXGI path does on a mode switch.
- **Adapter swap or device reset** — the shared texture was opened on the destroyed device, so the helper is relaunched against the new adapter.

### Known cost: a second cursor on the host's own display

While a WGC session is running, the **host's own physical display shows two cursors**, and `IsCursorCaptureEnabled = false` does *not* remove it — the property governs the captured frames, not what the compositor does to the display. A DXGI session does not do this.

This is a deliberate trade: during a streaming session nobody is usually sitting at the host, and the stream itself is correct. Set `capture_backend = "dxgi"` on a machine somebody also uses locally.

## Windows — DXGI Desktop Duplication

Leviathan uses the **DXGI Desktop Duplication API** to capture frames directly from the GPU framebuffer as `BGRA8` textures. This is a zero-copy path that does not require any intermediate CPU copy on the way into the encoder.

- Supports all GPUs (NVIDIA, AMD, Intel)
- Always captures the **primary display** (display ID `0`); multi-monitor selection is not yet exposed in the config schema
- Automatic DXGI output re-enumeration on desktop switches (UAC prompts, lock screen, RDP disconnect) to prevent stale capture handles
- HDR-safe via `IDXGIOutput5::DuplicateOutput1` when the desktop is in `R16G16B16A16_FLOAT` mode — the DWM tonemaps to `BGRA8` so the rest of the pipeline stays in SDR. There is **no HDR10 passthrough** today; everything is encoded as SDR.

### Frame pacing & asynchronous (uncapped-game) sources

A game presenting **asynchronously** — uncapped, or with in-game V-Sync off — does not present at a steady cadence. On a high-refresh host (e.g. an 80 fps game on a 144 Hz display, streamed at a 120 fps target) its frames arrive in *clumps* rather than evenly spaced. The streaming pipeline historically assumed a **constant frame rate (CFR)** end-to-end and tolerated this poorly: the symptom was the stream collapsing to ~12–60 fps for the async source, while the *same* game **capped to a steady 60 fps streamed perfectly** — the tell-tale sign that irregular *cadence*, not throughput, was the trigger.

The capture loop therefore **decouples output cadence from the source**: it runs on its own fixed clock and *resamples* the latest captured frame (duplicating to fill gaps). The Windows path does this across these stages:

- **Fixed cfg.FPS timer grid (not VBlank).** `use_vsync` is forced 0 so the loop paces with a high-resolution timer at the target FPS rather than `WaitForVBlank`. VBlank pacing under-sampled an async source — it phase-aliases against the source's presents and DXGI coalesces frames (`AccumulatedFrames ≥ 2`) — capping an 80 fps game at ~40–60 fps even with a widened acquire window. The grid index (`pacing_tick`) advances **every iteration, not per delivered frame**; the pure, unit-tested `pacing_grid_next` (in `pacing_windows.c`) computes the next sleep target from it and resyncs only if we fall >2 frames behind. Advancing every tick is what prevents the busy-spin that previously collapsed a 0 ms-poll timer attempt to ~12 fps. Each tick polls `AcquireNextFrame(0)` for the latest present.
- **Duplicate-fill on a miss.** When a grid tick finds no new present but the source is *actively presenting* (a real desktop frame within `active_window_ticks` = 500 ms), the loop re-emits the last frame via the existing repeat-frame path, gated to the target cadence — so the output is an even cfg.FPS the client can pace (≈ source-rate unique frames + cheap duplicate P-frames). A genuinely static desktop (no real present for 500 ms) falls back to the 1 fps low-power keepalive. `last_real_present_time` is set only on a *real* delivery, so the active/idle switch is automatic.
- **Capture→encode hand-off depth.** The capture handler pushes texture references onto a bounded channel drained by the encode goroutine (`enqueueEncodeFrameDropOldest`, latest-wins: under back-pressure the *oldest* queued frame is evicted and its texture released, keeping the freshest moving). The channel is **4** deep and the GPU texture pool is sized to match (`CAPTURE_TEXTURES_PER_SUBSCRIBER` = **9**: up to 5 textures in-flight leaves ~4 free for the capture thread).
- **Client decode-queue back-pressure.** The shen renderer used to drain the *entire* video ring into the WebCodecs decoder synchronously each poll tick; a clump spiked `decodeQueueSize` past a hard cap, which (with the server's infinite-GOP config) forced a frame drop **and an IDR-storm recovery** that then dropped every P-frame until a fresh keyframe — a self-reinforcing collapse. The drain now uses `RingBufferReader.processWhile`, feeding the decoder only while its queue is below a *soft* limit (`max(8, ⌈fps/8⌉)`, well under the hard cap) and leaving the rest of the burst in the ring for the next tick. Nothing is dropped or reordered (the reference chain stays intact); the ring is the buffer, draining as the decoder regains headroom.

Together these make the host emit an even cfg.FPS stream (catching every present via the 0 ms poll at a rate ≥ the source) and the client meter it into the decoder without bursting. Reverting the single `use_vsync = 0` initializer restores the old VBlank pacing.

If a borderless-fullscreen game *still* streams at a reduced rate after this, the remaining suspect is Windows **independent flip / Multiplane Overlay (MPO)**: the game's swap chain is handed straight to the scanout plane, so Desktop Duplication only receives a throttled recomposited copy from the DWM. That is outside the capture loop's control — mitigations are host-side (disable *fullscreen optimizations* for the game executable, or disable MPO).

## macOS — ScreenCaptureKit

On macOS 12.3+, Leviathan uses **ScreenCaptureKit** for low-latency screen capture.

- Requires Screen Recording permission in System Settings → Privacy & Security. Leviathan requests it at startup and refuses new sessions while it is missing (`SESSION_ERROR_CODE_PERMISSION_DENIED`). Because macOS applies a Screen Recording grant only at process launch, leviathan watches for the grant and restarts itself (clean exit; launchd relaunches it) so the grant actually takes effect — without this, ScreenCaptureKit keeps delivering a frozen wallpaper frame to an already-running process.
- Captures at the display's native resolution and refresh rate
- Supports macOS displays including ProMotion (up to 120 Hz)
- `CVPixelBuffer` reference counting keeps frame buffers valid across all CaptureHub subscribers for safe multi-session sharing

## Resolution & Frame Rate

The client's requested `SessionConfig` width/height are a **budget box** (a maximum spend), never a literal output size. The encoder output is always derived host-side as a **uniform, never-upscaled fit of the live desktop into that box** — both axes share one scale factor ≤ 1.0, so the picture can never be squashed by a 16:9 vs 16:10 (or any other) aspect mismatch, and a budget larger than the desktop simply streams at the desktop's native size instead of wasting bitrate on upscaling. Axes ≤ 0 mean *host-native* on that axis; the same derivation re-runs on every mid-stream desktop mode switch, GPU adapter swap, and client `VideoBudgetUpdate` (control-channel message for mid-stream budget changes, e.g. the desktop client's follow-window mode). The client learns every derived size through `ResolutionChanged` — the host is the sole authority, and clients render aspect-preserving, so no client-side math is correctness-relevant.

The derived output is additionally capped per axis by the limits in `config.toml`:

```toml
[video]
max_width = 3840
max_height = 2160
max_fps = 120
```

The actual frame rate is also bounded by the display's refresh rate. On ProMotion or 144 Hz displays, values up to the panel rate are supported.

**Where the scaling happens** differs by platform, and so does the mid-stream mechanism:

- **Windows**: Desktop Duplication always captures the full native desktop; each session's encoder scales it into that session's derived output, so **per-session budgets are fully independent**. A desktop mode switch (or GPU adapter swap) re-derives each session's output and reconfigures — or rebuilds — its encoder in place.
- **macOS**: ScreenCaptureKit scales the display into one shared output buffer per display, whose size is applied live via `SCStream.updateConfiguration`. The hub therefore aggregates the subscribers' desired sizes (**largest area wins**) and every subscriber's encoder follows the frames that actually arrive — VideoToolbox cannot resize in place, so a size change rebuilds the encoder. With a single subscriber (the normal case) the budget is honoured exactly; with **multiple subscribers the budget degrades to best-effort**, and a mid-stream `VideoBudgetUpdate` is rejected rather than silently resizing a sibling session's stream. Every client is always told the truth via `ResolutionChanged`.

Rotated (portrait) DXGI desktops are not supported: Desktop Duplication delivers rotated displays unrotated and Leviathan does not rotate the image.

### Advertising the host display

`GetServerInfo` / `WatchServerInfo` carry the host's primary display geometry (`display_width`, `display_height`, `display_refresh_rate`) so clients with **"use host resolution"** can match the server instead of their own screen. Clients treat `display_width == 0` as *unknown* and fall back to their own display, so the server reports zeroes rather than a guess.

Which display is advertised, and when:

- **Primary, not first.** The advertised monitor is the one flagged `DISPLAY_DEVICE_PRIMARY_DEVICE` (Windows); DXGI's adapter/output enumeration order carries no primary guarantee. Refresh rate is queried per device name — passing `NULL` would report the primary's rate for every monitor.
- **Never while the session is on RDP.** When an RDP client takes the host session over, every display API describes the RDP *virtual* display, sized to the remote viewer's window. Advertising it would make clients auto-configure to a resolution that disappears when RDP disconnects. The server instead reports the last geometry seen on the physical console, or nothing at all if it never saw one. Detection is `SM_REMOTESESSION` plus the `GlassSessionId` registry check, because a RemoteFX vGPU session reports itself as local.
- **Held steady across transients.** DXGI reports zero outputs while the display sleeps, during a session switch, and right after a secure-desktop (SAS) dismiss. The last good geometry is reported through those gaps so the advertised value does not flap between real and unknown — clients rebuild their stream config whenever it changes.

The 1 Hz change-detection poll behind `WatchServerInfo` is skipped entirely when no client is subscribed, so an idle server does not pay for a display enumeration every second.

## Cursor Handling

Cursor images are captured at the desktop's native resolution and scaled to match the stream resolution. The cursor cache is automatically invalidated when the resolution ratio changes (e.g. when the encoder adjusts resolution), ensuring correct cursor sizing at all times.

There are two cursor rendering paths, and they are sized to agree:

- **Overlay path** (Windows default / Local Cursor mode): the cursor is captured via `GetIconInfo` + `DrawIconEx`, encoded as a lossless WebP, sent over the overlay DataChannel, and drawn by the client as an `<img>` on top of the video.
- **GPU-composite path** (pointer-lock / relative mode): the cursor is taken from DXGI Desktop Duplication's `GetFramePointerShape` and composited straight into the video frame by a D3D11 compute shader.

Under the **WGC backend** the second path does not run at all: WGC carries no pointer metadata and there is nothing to composite. The same decision — should the video carry a cursor? — is instead pushed to the compositor as `IsCursorCaptureEnabled`, so the frames arrive already correct. The overlay path is unchanged: it reads the cursor through `GetCursorInfo`, which is independent of the capture source. The `[CursorDiag]` line names the live source as `backend=wgc` or `backend=dxgi`, and reports the DXGI pointer readings as unavailable (`-1`) under WGC rather than leaving a stale duplication reading to be read as live.

Which path is active is **per-display state owned by the CaptureHub**, not by individual sessions: each pipeline registers its client's preference (`CaptureHub.SetCursorInVideo`), and the hub applies the aggregate — the cursor is composited into the video only when *every* live subscriber wants it there; any overlay-mode session wins. Preferences are re-settled when a subscriber leaves and re-asserted on a fresh capture instance. Pipelines never write the capture layer's cursor flag directly — a session's default snapping the shared flag used to leave a sibling client rendering its overlay cursor on top of the video-blended one (two visible cursors), with the client's reconnect resync unable to repair it.

When the host cursor becomes hidden, the overlay path notifies the client (`CURSOR_HIDE`, which makes the client engage its own pointer lock and switch to relative-delta input) only when the hide looks like a **game capture**: the cursor is confined via `ClipCursor` to a sub-rect of the virtual desktop, **or** a client-injected mouse button is currently held — FF14/WoW-style camera drags hide the cursor for the duration of the drag without a detectable clip, and without this signal the client would keep sending absolute positions whose derived deltas are amplified by `streamW / canvasCSSW` (the "Local Cursor drag too fast" bug, shen#19). A passive hide (idle media player, fullscreen video) sends nothing, so the client keeps the last cursor shape for navigation.

The overlay path renders each cursor at its **native bitmap size** (multiplied by the client's device-pixel-ratio oversample for Retina sharpness), *not* forced to the system cursor metric (`SM_CXCURSOR`). Under the per-monitor-DPI-aware (PMAv2) thread context the host already holds, `GetIconInfo` reports the same dimensions DXGI's `GetFramePointerShape` does — so a standard cursor is 48×48 at 150% scaling and an application that sets a genuinely large custom cursor (e.g. **Final Fantasy XIV**'s hardware cursor) keeps its true size. This makes the overlay cursor and the GPU-composited cursor render at identical on-screen sizes instead of the overlay squashing large cursors down to the system metric. The oversample factor only affects bitmap resolution; the pipeline strips it back out before reporting CSS dimensions to the client, which sizes the cursor as `reportedWidth × videoScale`.

### DPI transitions (display switch / scaling change)

After a display-scale change — switching to a virtual display with a different scaling factor, dock/undock, or moving the Windows scaling slider — Windows regenerates the shared system cursors **asynchronously and in place**: the `HCURSOR` handle keeps its value while the bitmap contents are swapped underneath it some time later. A single re-capture at the moment the change is detected therefore races the regeneration and can latch the old-DPI bitmap, leaving the client's overlay cursor at the wrong size until the shape happens to change.

The capture layer closes this race with a bounded **settle window**: for 3 seconds after any DPI-change trigger (the `SM_CXCURSOR` sentinel, a capture reset from the pipeline's DPI watcher, or a resolution-change cache invalidation) it re-captures the cursor every 200 ms and compares the bitmap content hash against the last delivered capture. An unchanged probe is dropped without emitting any overlay traffic; the first probe whose content differs — the regenerated bitmap landing — is delivered as a fresh `CursorData` (its content hash yields a new cursor id) and closes the window early.

Cursor payloads are also bounded to the WebRTC SCTP message limit (64 KB): an animated cursor whose lossless WebP exceeds the budget is downgraded to a static first-frame encode, and a cursor id is marked as "sent to this client" only after its `CursorData` was actually handed to the DataChannel — a dropped send must not degrade later appearances of that cursor to `CursorSignal` references the client cannot resolve.
