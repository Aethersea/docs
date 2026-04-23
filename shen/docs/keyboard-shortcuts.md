---
sidebar_position: 7
---

# Keyboard Shortcuts

The shortcuts below are handled **inside the Shen window** during an active streaming session. All other keys are forwarded to the host as-is — there are no home-screen or global shortcuts.

## Client-Side Shortcuts

These combinations are intercepted by Shen and never reach the host.

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+Alt+Q` | Show or hide the in-session overlay (server info, disconnect, settings). Modifier keys are released on the host when the overlay opens. |
| `Ctrl+Shift+Alt+I` | Toggle **immersive mode** (global keyboard/mouse hooks). The toast `Immersive mode ON/OFF` briefly appears. |
| `Ctrl+Shift+Alt+K` | **Emergency stuck-keys clear.** Immediately sends `key up` for every key Shen believes is pressed. Use this if a modifier key gets stuck on the host after Alt-Tabbing out during a session. |
| `Escape` | When the overlay is visible, dismiss it. |

## Passthrough with Server-Side Effect

Shen recognizes these combinations and translates them before sending.

| Shortcut | Sent to Host As |
|----------|-----------------|
| `Ctrl+Alt+Backspace` | `Ctrl+Alt+Delete` (Secure Attention Sequence). Useful because Windows reserves the actual `Ctrl+Alt+Del` for the secure desktop and it cannot be injected through the input driver. |

## Notes on Intercepted System Shortcuts

Without immersive mode enabled, the following are **consumed by the client OS** before they reach Shen and are therefore never forwarded:

- **Windows**: `Win`, `Ctrl+Esc`, `Alt+Tab`, `Alt+Esc`, `Ctrl+Shift+Esc`
- **macOS**: `Cmd+Tab`, `Cmd+Space`, `Cmd+Q`, Mission Control / Spaces shortcuts
- **All platforms**: `Alt+F4`, screenshot keys, screen lock keys

With **immersive mode** enabled, the native layer installs global keyboard and mouse hooks so these shortcuts are captured and forwarded to the host. Immersive mode only activates while a stream is actively receiving media — it will not engage during the `connecting` or `reconnecting` phases, nor while the overlay is visible, nor while the Shen window is unfocused. The current capture state is indicated by a small indicator in the overlay.

## macOS Accessibility Permission

Immersive mode on macOS requires **Accessibility** permission. If any saved server config has `immersive_mode = true`, Shen proactively requests the permission at startup. You can manage it in **System Settings → Privacy & Security → Accessibility**.
