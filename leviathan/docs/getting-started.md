---
sidebar_position: 2
---

# Getting Started

## Prerequisites

- A host machine running Windows 10/11 or macOS 13+ (Ventura or later; `clipboard-helper` requires 13).
- For NVIDIA encoding: a recent NVIDIA driver supporting NVENC HEVC (AV1 requires Ada Lovelace or newer).
- For Intel QSV: a Tiger Lake or newer iGPU with a current Intel graphics driver.
- For AMD AMF: a recent Adrenalin driver. **Status:** the AMF path is implemented but untested — verify that a session starts before relying on it.
- Network reachability for the gRPC signaling port (default `21218/TCP`) and ephemeral WebRTC UDP ports (`49152–65535`). See [Networking](./networking) for details and how to pin a fixed UDP port.

## Installation

### Windows

1. Download the latest `leviathan-windows-x64.zip` from [GitHub Releases](https://github.com/aethersea/aethersea/releases).
2. Extract the archive to a folder of your choice (e.g. `C:\Leviathan`).
3. Run `leviathan.exe` from an elevated terminal so it can register firewall rules on first launch.

**Run as a Windows service (recommended)**

```powershell
leviathan.exe service install
```

This registers `Leviathan` with the Service Control Manager. The service runs under the SYSTEM account but launches the streaming pipeline in the active console session so it has access to the desktop and GPU. To remove it later:

```powershell
leviathan.exe service uninstall
```

### macOS

1. Download the latest `leviathan-macos-arm64.tar.gz` (Apple Silicon) or `leviathan-macos-x64.tar.gz` (Intel) from [GitHub Releases](https://github.com/aethersea/aethersea/releases).
2. Extract and move the binary:

   ```bash
   tar -xzf leviathan-macos-arm64.tar.gz
   sudo mv leviathan /usr/local/bin/
   ```

3. Start the server in the foreground for a smoke test:

   ```bash
   leviathan
   ```

4. Grant the permissions leviathan prompts for at startup: **Screen Recording** and **Accessibility** (System Settings → Privacy & Security). Leviathan detects the grant automatically:
   - **Accessibility** takes effect immediately.
   - **Screen Recording** only takes effect at process launch, so leviathan exits cleanly once the grant lands — under launchd it relaunches automatically; in a terminal, start it again. Until every permission is granted, incoming sessions are refused with a structured error the client can display (rather than streaming a frozen frame).

**Run as a launchd LaunchAgent (recommended)**

```bash
leviathan service install
```

This writes `~/Library/LaunchAgents/com.aethersea.leviathan.plist` and loads it via `launchctl`. The agent runs in your GUI user session so it has access to ScreenCaptureKit and CGEvent. Remove it with:

```bash
leviathan service uninstall
```

### Linux

Linux support is experimental — the capture, encoder, audio, and input backends are stubs. The binary will start and run the gRPC signaling layer, but no media is produced. Build from source if you need to experiment.

## Set Pairing Credentials

Before any client can connect, set a username and password. Clients use these once during pairing; afterwards their DTLS fingerprint is trusted.

```bash
leviathan set-credentials --username <user> --password <pass>
```

The credentials are stored Argon2id-hashed under the per-platform config directory (see below).

## First Run

On first start, Leviathan generates a default configuration file at:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\leviathan\config.toml` |
| macOS | `~/Library/Application Support/leviathan/config.toml` |
| Linux | `$XDG_CONFIG_HOME/leviathan/config.toml` (or `~/.config/leviathan/config.toml`) |

Trust store and credentials live next to it (`trusted_clients.json`, `credentials.json`).

Once the server is running and credentials are set, open [Shen](https://shen.theaethersea.com/docs/getting-started) on your client machine, point it at the host's IP/hostname, and pair with the username and password you just configured.

## CLI Reference

```
leviathan                                       Run the streaming server (default)
leviathan --grpc-port <port>                    Override the gRPC signaling port (default 21218)
leviathan set-credentials --username <u>        Set pairing credentials
                         --password <p>
leviathan service install [--grpc-port <port>]  Install as system service (Windows SCM / macOS launchd)
leviathan service uninstall                     Remove the system service
```
