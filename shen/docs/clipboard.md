---
sidebar_position: 4
---

# Clipboard

Shen supports bidirectional clipboard synchronisation with the host.

## How It Works

- **Windows / Linux**: Clipboard access is handled directly by the Electron renderer. Text content is transmitted using **base64 encoding** for improved compatibility with special characters and encoding edge cases.
- **macOS**: Due to macOS sandbox restrictions, a helper process (`clipboard-helper`) runs alongside Shen. It bridges the Electron renderer to the native `NSPasteboard` and communicates via a local Unix socket.

Content type priority: images → files → text.

## Supported Content Types

| Type | Windows | macOS |
|------|---------|-------|
| Plain text | ✅ | ✅ |
| Rich text (RTF / HTML) | ✅ | ✅ |
| Images (PNG) | ✅ | ✅ |
| Files | ✅ (path list) | ✅ (via clipboard-helper) |

## Troubleshooting

**Clipboard sync not working on macOS**

1. Open **System Settings → Privacy & Security → Accessibility** and ensure Shen is listed and enabled.
2. Check that `clipboard-helper` is running: open Activity Monitor and search for `clipboard-helper`.
3. Restart Shen if the helper process was not running when Shen launched.
