---
sidebar_position: 7
---

# Keyboard Shortcuts

## Global Shortcuts

These shortcuts work at all times within the Shen window.

| Shortcut | Action |
|----------|--------|
| `Ctrl+Alt+Shift+Q` | Disconnect and return to host list |
| `Ctrl+Alt+Shift+F` | Toggle fullscreen |
| `Ctrl+Alt+Shift+S` | Open Settings |
| `Ctrl+Alt+Shift+C` | Toggle clipboard sync |
| `Ctrl+Alt+Shift+G` | Toggle gamepad input |

## Input Capture

When connected, all keyboard input is forwarded to the host. Press `Ctrl+Alt+Shift+Q` to release input capture and return to the Shen UI.

## macOS

On macOS, some system shortcuts (e.g. `Cmd+Tab`, `Cmd+Space`) are intercepted by the OS and cannot be forwarded. Use the on-screen keyboard shortcut mapper in **Settings → Input** to remap these if needed.

## Android

When an external physical keyboard is paired, Shen Android intercepts key events at the activity's `dispatchKeyEvent` (rather than `onKeyDown`/`onKeyUp`) so that combos like `Alt+Tab`, the Search key, and the Menu key are forwarded to the host instead of being consumed by the framework. The `Home` key is reserved by Android itself and cannot be intercepted by any non-launcher app — use a remapping on the host side if you need it. Volume keys are deliberately not forwarded so that media volume continues to work locally during streaming.
