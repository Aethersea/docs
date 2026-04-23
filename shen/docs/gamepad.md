---
sidebar_position: 5
---

# Gamepad

Shen forwards up to **16 simultaneous controllers** to the host. Every platform uses the same [**SDL3**](https://www.libsdl.org/) backend compiled into the native addon — there is no per-OS branching in the gamepad path, which gives identical behaviour, mapping, and rumble semantics regardless of platform.

## Backend

| Component | Detail |
|-----------|--------|
| Input library | SDL3, built from source, statically linked |
| Mapping database | [SDL_GameControllerDB](https://github.com/gabomdq/SDL_GameControllerDB) (bundled) |
| Polling | 1 ms poll in a dedicated thread |
| Max controllers | 16 |

## Supported Features

- **Buttons and axes** — full gamepad mapping (face buttons, D-pad, sticks, triggers, bumpers, Start/Back, stick-click, Guide)
- **Rumble** — body rumble and trigger rumble (DualSense / DualShock 4 / modern Xbox controllers)
- **Motion sensors** — accelerometer and gyroscope via SDL3 raw FFI, on controllers that expose them (DualSense, DualShock 4, Switch Pro)
- **Touchpad** — DualSense / DualShock 4 touchpad events
- **LED** — controller LED color where supported
- **Battery state** — reported to the host every 5 seconds
- **Controller-type detection** — via SDL3's `GamepadType` enum, so Xbox vs PlayStation vs Switch glyphs stay correct

## Special Combinations

| Combination | Action |
|-------------|--------|
| Long-press **Start** (≥ 750 ms) | Enter/exit on-controller mouse emulation mode |
| **Start + Select + LB + RB** | Quit the current session (mirrors the Moonlight/Sunshine convention) |

## Enabling Gamepad Input

Gamepad forwarding is on by default. Connect the controller before or during a session — hot-plug is supported. SDL3 will detect it and add it to the active controller set.

## Troubleshooting

**Controller not detected**

- Confirm the controller works in another SDL3-based app (e.g. the SDL3 test utility or a Steam game).
- On macOS, grant Shen access in **System Settings → Privacy & Security → Input Monitoring** if prompted.
- Reconnect the controller while Shen is running — SDL3 picks up hot-plug events automatically.

**Rumble not working**

Rumble is forwarded from the host to the controller only when the host application requests it and the controller reports rumble capability. Some Bluetooth controllers report support but do not actually rumble over BT — try a wired connection to isolate.

**Wrong glyphs (Xbox buttons shown on PlayStation controller or vice-versa)**

SDL3 usually identifies the controller correctly via USB VID/PID, but off-brand controllers sometimes misreport themselves. Check the controller-type reported in the performance overlay; if it's wrong, the vendor database in SDL_GameControllerDB may need an entry for that device.
