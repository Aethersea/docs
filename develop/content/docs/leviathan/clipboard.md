---
title: "Clipboard Architecture"
description: "Internal design of the Leviathan clipboard-helper sidecar and message routing."
---

Leviathan uses a sidecar architecture for clipboard synchronization. Instead of handling platform-specific clipboard APIs (like macOS `NSPasteboard` or Windows OLE) directly inside the main Go process, it offloads these tasks to a dedicated `clipboard-helper` subprocess.

This architecture ensures stability, handles complex "delayed rendering" (lazy loading) scenarios, and allows the main server to remain responsive even during large file transfers.

## Process Model

### macOS: Singleton Helper

On macOS, Leviathan employs a **process-wide singleton** helper manager.

*   **One Helper per Server:** Only one `clipboard-helper` process is spawned for the entire `leviathan` process lifecycle.
*   **Shared Ownership:** macOS only allows one "owner" of the pasteboard at a time. Using a singleton prevents multiple sessions from racing for ownership, which would otherwise break pending data requests.
*   **Multiplexing:** Multiple concurrent WebRTC sessions (subscribers) all connect to the same singleton manager.

### Windows: Per-Session Helper

On Windows, the architecture currently utilizes one `clipboard-helper.exe` per session. While similar in IPC structure to macOS, it does not yet use the singleton multiplexer, as the Windows clipboard API behaves differently regarding ownership and global state.

### Linux: Stub

Linux support is currently a stub and does not yet implement the helper-sidecar model.

## Lifecycle & Watchdog

The `clipboard-helper` is managed automatically by the server:

1.  **Lazy Initialization:** The helper starts on the first session request (using `sync.Once` on macOS).
2.  **Auto-Restart:** If the helper crashes, the server detects the exit and automatically restarts it.
3.  **Parent Watchdog:** The server passes its own PID to the helper via `--parent-pid`. The helper uses a platform-native watchdog (e.g., `kqueue` `NOTE_EXIT` on macOS) to ensure it exits immediately if the `leviathan` process dies, preventing "zombie" helpers.

## Routing Logic (macOS)

The `helperManager` acts as a router for messages coming from the singleton helper:

| Message Type | Routing Rule | Purpose |
| :--- | :--- | :--- |
| `CLIPBOARD_CHANGED` | **Fan-out** | Notifies all active sessions that the local clipboard has changed so they can update their remote clients. |
| `DATA_REQUEST` | **Last-Writer-Wins** | Routes to the session that most recently "announced" content. Matches the OS's expectation that only the last application to write to the clipboard provides the data. |
| `FILE_CHUNK_DATA` | **Waiter Map** | Routes specific file chunks back to the exact goroutine requesting them, keyed by `transferID`, `fileID`, and `offset`. |

## Echo-Loop Suppression

To prevent infinite loops where a remote update is applied locally and then immediately broadcast back to the same remote, each subscriber tracks the hash of the last content it applied. 

If a `CLIPBOARD_CHANGED` event matches the last-applied hash for a specific session, that session suppresses the broadcast to its remote client. However, other concurrent sessions *will* still broadcast the change to their respective clients, ensuring multi-client consistency.

## Message Flows

### Delayed Rendering (Lazy Loading)

When a remote client "copies" something, Leviathan doesn't immediately put the bytes on the local host clipboard. Instead, it "announces" the content:

1.  **Announce:** Leviathan tells the helper to announce specific types (text, image, files) and a hash.
2.  **Request:** When a local app (e.g., Finder or TextEdit) tries to "paste," the macOS helper receives a callback and sends a `DATA_REQUEST` to the Go server.
3.  **Provide:** The Go server invokes the session's render callback, retrieves the bytes from the remote client (if necessary), and sends `PROVIDE_DATA` back to the helper.
4.  **Fulfill:** The helper fulfills the OS pasteboard request.

### File Transfers

For file copies, the helper serves as a local file server for the remote client:
- The helper advertises file paths to the OS.
- When the server needs to send file data to a remote client, it sends a `FILE_CHUNK_REQUEST` to the helper.
- The helper reads the local file chunk and returns `FILE_CHUNK_DATA`.
- This ensures that Leviathan doesn't need high-level file system permissions itself; it just talks to its own helper.
