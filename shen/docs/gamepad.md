---
sidebar_position: 5
---

# Gamepad

Shen supports forwarding up to **4 simultaneous gamepads** to the host machine.

## Supported APIs

| Platform | Input API |
|----------|-----------|
| Windows | XInput (Xbox controllers), DirectInput |
| macOS | Game Controller framework, SDL |
| Linux | evdev / SDL |

The gamepad database used is [SDL_GameControllerDB](https://github.com/gabomdq/SDL_GameControllerDB), which covers thousands of controllers.

## Enabling Gamepad Input

Gamepad forwarding is enabled by default when a controller is detected. You can toggle it in **Settings → Input → Gamepad**.

## Vibration / Haptics

Rumble feedback is forwarded from the host to the physical controller when the host application requests it (Windows only via XInput).

## Troubleshooting

**Controller not detected**

- Ensure the controller is connected before launching Shen.
- On macOS, grant Shen access in **System Settings → Privacy & Security → Input Monitoring**.
- Try reconnecting the controller while Shen is running.
