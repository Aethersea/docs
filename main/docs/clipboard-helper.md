---
sidebar_position: 3
---

# Clipboard Helper

`clipboard-helper` is a macOS helper process that acts as the `NSPasteboard` owner on behalf of the Leviathan server and the Shen client. It exists because macOS's `declareTypes:owner:` (lazy/delayed clipboard rendering) requires an active `NSApplication` run loop — without one, Universal Clipboard / Handoff immediately steals pasteboard ownership and deferred data callbacks never fire.

## Architecture

```
┌──────────────────┐   Unix Socket   ┌──────────────────────────┐
│  Go server       │ ◄──────────────► │  clipboard-helper (Swift) │
│  (Leviathan)     │   protobuf IPC  │  - NSApplication run loop │
└──────────────────┘                  │  - NSPasteboard owner     │
┌──────────────────┐   Unix Socket   │  - delayed rendering      │
│  Electron client │ ◄──────────────► │  - pasteboard polling     │
│  (Shen, Rust)    │   protobuf IPC  └──────────────────────────┘
└──────────────────┘
```

The wire format is **4-byte little-endian length prefix + serialized protobuf** (`HelperMessage`).

## Tech Stack

| Component | Technology |
|---|---|
| Language | Swift 5.9 |
| UI / App lifecycle | AppKit (`NSApplication`, `NSPasteboard`) |
| CLI parsing | `apple/swift-argument-parser` 1.3–1.4 |
| Serialization | Protocol Buffers via `apple/swift-protobuf` 1.28+ |
| IPC transport | Unix domain socket (`AF_UNIX`, `SOCK_STREAM`) |
| Min OS | macOS 13 (Ventura) |
| Build system | Swift Package Manager + `make` |

## CLI Usage

```bash
clipboard-helper --socket <path> [--mode server|client] [--verbose]
```

- `--mode server` (default): polls the local pasteboard, reports changes upstream to the Leviathan server.
- `--mode client`: receives remote content from Shen, lazily renders to the macOS pasteboard.

## Build Commands

```bash
make build             # swift build (debug)
make build-release     # swift build -c release (current arch)
make build-universal   # arm64 + x86_64 lipo'd into .build/universal/ClipboardHelper
make generate-proto    # re-generate Swift from .proto files
make clean             # swift package clean && rm -rf .build
make install           # build-release then cp to /usr/local/bin/clipboard-helper
make run               # swift run ClipboardHelper --socket /tmp/clipboard-helper.sock --verbose
```

## Project Structure

```
clipboard-helper/
├── Package.swift                    # SPM manifest — one executable target
├── Makefile
├── Proto/
│   ├── clipboard.proto              # Shared clipboard data types
│   └── clipboard_helper.proto       # IPC message envelope
├── Scripts/
│   └── generate-proto.sh            # Runs protoc → Sources/ClipboardHelper/Generated/
└── Sources/ClipboardHelper/
    ├── ClipboardHelperApp.swift      # @main entry point, AppDelegate, mode enum
    ├── SocketServer.swift            # Unix domain socket server
    ├── PasteboardManager.swift       # NSPasteboard read/write/polling/delayed rendering
    ├── FileTransferCoordinator.swift # Chunked file transfer over IPC
    ├── TransferProgressPanel.swift   # macOS floating progress indicator
    ├── Log.swift                     # Simple stderr logger with verbose flag
    └── Generated/                   # Auto-generated Swift protobuf files (do not edit)
```

## Key Components

### ClipboardHelperApp

Entry point using `ArgumentParser`. Starts `NSApplication`, installs `AppDelegate`, and calls `app.run()` (never returns). The `AppDelegate` wires together all subsystems and routes incoming messages.

### SocketServer

Creates a Unix domain socket, accepts one client connection per instance. Uses `DispatchSourceRead` for async reads. Decodes a 4-byte little-endian length prefix, assembles frames, and fires the `onMessage` callback. Socket permissions are hardened to `0o600`.

### PasteboardManager

Handles three clipboard operations:

- **Direct set** (`SET_CLIPBOARD`): writes text / image / file promise directly to `NSPasteboard.general`.
- **Delayed rendering** (`ANNOUNCE_DELAYED`): calls `declareTypes:owner:`, waits for the OS data request, sends `DATA_REQUEST` to the parent process, and blocks until `PROVIDE_DATA` arrives.
- **Polling** (`CLIPBOARD_CHANGED`): a 0.5 s timer checks `NSPasteboard.changeCount`, serialises content (text, image as WebP, file URLs as `FileMetadata`).

### FileTransferCoordinator

Handles chunked file transfers in both directions. In client mode, it receives files via `NSFilePromiseProvider`; in server mode, it serves chunk responses.

### TransferProgressPanel

A floating macOS progress window driven by `FILE_TRANSFER_PROGRESS` messages from the parent process.

## Protocol Definitions

### `clipboard.proto` — Shared Data Types

| Message | Purpose |
|---|---|
| `ClipboardData` | Clipboard content: `content_type`, `payload`, `content_hash`, `files[]`, `transfer_id` |
| `ClipboardContentType` | Enum: `TEXT`, `IMAGE`, `FILES` |
| `FileMetadata` | Per-file info: `file_id`, `filename`, `relative_path`, `file_size`, `mime_type`, `checksum_sha256` |
| `ClipboardAnnouncement` | Metadata-only announcement for delayed rendering |
| `ClipboardDataRequest` | Sent by helper when OS triggers a paste |

### `clipboard_helper.proto` — IPC Envelope

| Direction | Message Types |
|---|---|
| Parent → Helper | `SET_CLIPBOARD`, `ANNOUNCE_DELAYED`, `PROVIDE_DATA`, `GET_CLIPBOARD`, `SHUTDOWN`, `FILE_TRANSFER_PROGRESS` |
| Helper → Parent | `CLIPBOARD_CHANGED`, `DATA_REQUEST`, `CLIPBOARD_CONTENT`, `ERROR`, `READY` |
| Bidirectional | `FILE_CHUNK_REQUEST`, `FILE_CHUNK_DATA` |

## Regenerating Protobuf

When `Proto/*.proto` files change, run `make generate-proto`. This requires `protoc` and the `swift-protobuf` plugin (`protoc-gen-swift`) to be installed. The generated files in `Sources/ClipboardHelper/Generated/` should be committed.

The `.proto` files in `clipboard-helper` are the source of truth — the same definitions are synced into `leviathan/proto/` for Go code generation.
