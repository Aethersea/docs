---
sidebar_position: 9
---

# Development

This guide covers building Leviathan from source and understanding the project layout.

## Prerequisites

- **Go 1.24** or later
- **C toolchain** (for CGO)  - macOS: Xcode Command Line Tools
  - Windows: MSVC or MinGW with AVX2/SSE2 support
- **protoc** (Protocol Buffers compiler)
- **protoc-gen-go** and **protoc-gen-go-grpc** plugins

## Build Commands

```bash
make all          # proto + binary (default)
make build        # build server binary → build/leviathan(.exe)
make proto        # regenerate Go from .proto files via protoc
make run          # build + run (macOS also downloads clipboard-helper)
make debug        # build debug dashboard → build/leviathan-debug
make run-debug    # build + run debug tool
make test         # go test ./...
make clean        # remove build/ directory
make deps         # go mod tidy + install protoc-gen-go plugins
make fmt          # go fmt ./...
make lint         # golangci-lint run ./...
```

### Platform-specific Build Flags

- **macOS**: `CGO_ENABLED=1`, links `IOSurface` framework, includes `cgo/macos/`
- **Windows**: `CGO_ENABLED=1`, links D3D11, DXGI, Media Foundation, OLE, ViGEm; SIMD flags `-mavx2 -msse2 -O3`

## Project Structure

```
leviathan/
├── cmd/
│   ├── main.go             # Entry point: CLI flags, config, SessionManager, gRPC server
│   └── debug/              # Debug dashboard tool (no CGO)
├── internal/
│   ├── streaming/          # Central pipeline orchestrator, SessionManager, FEC, RTCP, telemetry
│   ├── capture/            # Screen capture (ScreenCaptureKit / DXGI via CGO)
│   ├── encoder/            # Video + audio encoding (VideoToolbox / Media Foundation via CGO)
│   ├── audio/              # Opus audio encoding via CGO
│   ├── input/              # Virtual input injection via CGO
│   ├── cursor/             # Cursor capture + WebP overlay via CGO
│   ├── clipboard/          # Clipboard sync (NSPasteboard / Win32 + helper IPC on macOS)
│   ├── filetransfer/       # File transfer over WebRTC DataChannel
│   ├── signaling/          # gRPC server (SDP/ICE exchange, display refresh rate detection)
│   ├── pairing/            # Trust store: hashed credential management
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

## CLI Flags

```bash
leviathan --grpc-port <port>     # gRPC server port
leviathan --set-credentials      # Interactive credential setup mode
```
