---
sidebar_position: 4
---

# Clipboard

Shen supports bidirectional clipboard synchronisation with the host.

## How It Works

- **Windows / Linux**: Clipboard access is handled directly by the Electron renderer. Text content is transmitted using **base64 encoding** for improved compatibility with special characters and encoding edge cases.
- **macOS**: Due to macOS sandbox restrictions, a helper process (`clipboard-helper`) runs alongside Shen. It bridges the Electron renderer to the native `NSPasteboard` and communicates via a local Unix socket.

Content type priority: images → files → text.

## Host → Shen Push Behaviour

While you are actively driving the host through Shen (keyboard, mouse, touch, or typed text), copies of **images** and **files / folders** on the host are not auto-pushed to your client for about 2 seconds — those copies are usually side effects of your own remote actions and shipping them back would just waste bandwidth. Plain text keeps syncing immediately. After a brief input pause all content types resume normal sync.

## Supported Content Types

| Type | Windows | macOS | Linux |
|------|---------|-------|-------|
| Plain text | ✅ | ✅ | ✅ |
| Rich text (RTF / HTML) | ✅ | ✅ | ✅ |
| Images (PNG) | ✅ | ✅ | ✅ |
| Files | ✅ (path list) | ✅ (via `clipboard-helper`) | ✅ (path list) |

## Troubleshooting

**Clipboard sync not working on macOS**

1. Open **System Settings → Privacy & Security → Accessibility** and ensure Shen is listed and enabled.
2. Check that `clipboard-helper` is running: open Activity Monitor and search for `clipboard-helper`.
3. Restart Shen if the helper process was not running when Shen launched.
