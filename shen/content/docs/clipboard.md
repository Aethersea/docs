---
title: "Clipboard Synchronization"
description: "How Shen synchronizes text, images, and files across supported platforms."
---

Shen provides seamless, bidirectional clipboard synchronization between your host machine and remote streaming sessions. This ensures that text, images, and file references can be shared across environments as if they were running locally.

## Architecture

The clipboard system is designed for high performance and reliability, with platform-specific implementations to handle OS-level sandboxing and multi-window environments.

### Platform Implementations

*   **Windows & Linux**: Uses the Electron `clipboard` API directly within the main process.
*   **macOS**: Due to App Sandbox restrictions and the need for low-level `NSPasteboard` access, Shen uses a dedicated `clipboard-helper` subprocess.

#### macOS Helper Watchdog
To prevent the accumulation of "orphan" processes, the macOS `clipboard-helper` includes a parent-process watchdog. It utilizes the `kqueue` kernel facility with `NOTE_EXIT` to monitor the main Shen process. If Shen terminates unexpectedly, the helper detects the parent's exit and shuts itself down immediately.

### Multi-Window Orchestration

Shen supports multiple concurrent streaming windows, managed by a singleton clipboard controller:

1.  **Singleton Helper**: Only one instance of the clipboard-helper (on macOS) or the main process listener (Windows/Linux) is active, regardless of how many windows are open.
2.  **Cross-Session Relay**: Anything you copy on your own machine reaches every open streaming session, as it always has. Text and images copied on a remote host now reach your other sessions as well, so you can copy on one remote machine and paste on another.
3.  **No Echo-Back to Origin**: Relayed content is never sent back to the session it came from. Every other session still receives it.
4.  **Text and Images Only**: The cross-session relay excludes files. A file copied on one remote host is shared with your local machine but will not appear on another remote session.
5.  **Late-Joiner Cache**: If you copy a file or text locally and *then* open a streaming window, the new window will receive the most recent clipboard announcement immediately upon connection.

## Performance Optimization

Clipboard payloads are transmitted via a **dedicated binary channel**. By avoiding Base64 encoding, Shen achieves:
*   **~33% reduction** in network payload size.
*   **Lower CPU overhead** on both the host and the remote client.
*   **Faster transfer** for large image or file-list data.

## Host → Shen Push Behaviour

To prevent the clipboard from interrupting your workflow, Shen implements a **2-second suppression window**. If you are actively typing or providing input in a streaming window, Shen will delay pushing host clipboard changes to that specific remote session for 2 seconds to avoid race conditions or unexpected focus steals.

## Supported Content Types

| Type | Description |
| :--- | :--- |
| **Plain Text** | UTF-8 encoded text strings. |
| **HTML** | Rich text formatting (where supported by the remote app). |
| **Images** | PNG and JPEG formats are synchronized as bitmaps. |
| **File References** | Copying files in Explorer/Finder allows "pasting" the file path/data into the remote session. |

## Troubleshooting

### Privacy & Security (macOS)
On macOS, ensure Shen has the necessary permissions. If the clipboard is not syncing, check:
`System Settings > Privacy & Security > Accessibility` and ensure Shen is enabled.

### Singleton Constraints
Shen ensures exactly **one** `clipboard-helper` is running. If you suspect a hang, check your Activity Monitor for `clipboard-helper`. The watchdog should handle this automatically, but a manual restart may be required in extreme cases.

### General Fix
If synchronization stops working:
1. Close all active streaming windows.
2. Fully quit Shen (from the tray/menu bar).
3. Restart Shen and reconnect.
