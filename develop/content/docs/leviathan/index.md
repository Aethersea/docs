---
title: "Leviathan Development"
description: "Build Leviathan from source and understand the server project layout."
---

This guide covers building Leviathan from source and understanding the project layout.

## Prerequisites

- **Go 1.24** or later
- **C toolchain** (for CGO):
  - macOS: Xcode Command Line Tools
  - Windows: **clang (LLVM)** with the `windows-gnu` target. The Makefile sets `CC` / `CXX` accordingly. MinGW may still be present on `PATH` because it provides `ld.exe` and a few runtime libs the linker needs, but the C front-end is clang.
- **protoc** (Protocol Buffers compiler)
- **protoc-gen-go** and **protoc-gen-go-grpc** plugins (run `make deps` to install)

## Build Commands

```bash
make all          # proto + binary (default)
make build        # build server binary → build/leviathan(.exe)
make proto        # regenerate Go from .proto files via protoc
make run          # build + run (macOS/Linux also provision clipboard-helper)
make debug        # build debug dashboard → build/leviathan-debug
make run-debug    # build + run debug tool
make test         # go test ./...
make clean        # remove build/ directory
make deps         # go mod tidy + install protoc-gen-go plugins
make fmt          # go fmt ./...
make lint         # golangci-lint run ./...
```

### clipboard-helper Provisioning (macOS / Linux)

`make run` and `make bundle` pull a prebuilt `clipboard-helper` from the
clipboard-helper repo's GitHub Releases into `build/`. The download is
**version-aware**: it pins a release tag (default the rolling `latest`
prerelease, refreshed by CI on every helper `master` push), stamps the
downloaded asset's id + `updated_at` into `build/.clipboard-helper.stamp`, and
re-downloads only when that stamp changes. This means a newly-published helper
is actually picked up instead of a stale `build/clipboard-helper` being kept
forever (the previous behaviour, which shipped outdated helpers in the `.app`).

- `make clipboard-helper CLIPBOARD_HELPER_TAG=v1.2.3` — pin a fixed release.
- `make clipboard-helper CLIPBOARD_HELPER_REPO=<owner>/<repo>` — use a fork.
- If GitHub is unreachable, any existing `build/clipboard-helper` is kept; the
  build only hard-fails when there is no local binary at all.

### Platform-specific Build Flags

- **macOS**: `CGO_ENABLED=1`, links `IOSurface` framework, includes `cgo/macos/`
- **Windows**: `CGO_ENABLED=1`, links D3D11, DXGI, Media Foundation, OLE, ViGEm; SIMD flags `-mavx2 -msse2 -O3`

## Project Structure

```
leviathan/
├── cmd/
│   ├── main.go             # Entry point: cobra CLI, config, SessionManager, gRPC server
│   └── debug/              # Debug dashboard tool (no CGO)
├── internal/
│   ├── streaming/          # Central pipeline orchestrator, SessionManager, FEC, RTCP, telemetry
│   ├── capture/            # Screen capture (ScreenCaptureKit / DXGI via CGO)
│   ├── encoder/            # Video encoding (VideoToolbox / Media Foundation / SVT-AV1 via CGO)
│   ├── audio/              # Opus audio encoding via CGO
│   ├── hostaudio/          # Mute/restore the host's default render endpoint while streaming
│   ├── input/              # Virtual input injection via CGO (SendInput / ViGEm / CGEvent)
│   ├── cursor/             # Cursor capture + WebP overlay via CGO
│   ├── clipboard/          # Clipboard sync (NSPasteboard / Win32 + helper IPC on macOS)
│   ├── filetransfer/       # File transfer over WebRTC DataChannel
│   ├── signaling/          # gRPC server (SDP/ICE exchange, pairing, management RPCs)
│   ├── pairing/            # Trust store: Argon2id credentials + DTLS fingerprint store
│   ├── service/            # Windows SCM / macOS launchd service install/uninstall
│   ├── config/             # TOML config loading
│   └── crypto/             # TLS certificate management
├── proto/                  # .proto sources + generated Go files
├── cgo/
│   ├── macos/              # Objective-C + C source files
│   └── windows/            # C headers + prebuilt libs
├── build/                  # Build output
└── install/                # NSIS installer + Homebrew formula
```

## Key Dependencies

| Dependency | Purpose |
|---|---|
| `pion/webrtc` v4 | WebRTC (ICE, DTLS, SRTP, SCTP) |
| `google.golang.org/grpc` | gRPC signaling over TLS |
| `google.golang.org/protobuf` | Protocol Buffers serialization |
| `pelletier/go-toml/v2` | TOML configuration |
| `klauspost/reedsolomon` | Reed-Solomon FEC |

## CLI

The CLI is built with [cobra](https://github.com/spf13/cobra). The root command runs the streaming server; subcommands handle credentials and service installation.

```
leviathan [--grpc-port <port>]                 Run the streaming server (default port 21218)
leviathan set-credentials --username <u>       Set the server pairing credentials
                         --password <p>
leviathan service install [--grpc-port <port>] Register the system service
                                                 (Windows SCM / macOS launchd LaunchAgent)
leviathan service uninstall                    Remove the system service
```

The `--grpc-port` flag is a persistent flag on the root command, so it can be passed to `service install` to bake a custom port into the registered service.
