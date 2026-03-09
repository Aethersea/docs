---
sidebar_position: 2
---

# Getting Started

## Prerequisites

- A host machine running Windows 10/11 or macOS 12+
- For NVIDIA GPU encoding: NVIDIA driver 522.25 or later
- For AMD GPU encoding: Adrenalin 22.11 or later
- Ports `47990` (TCP) and `47998–48010` (UDP) accessible from the client

## Installation

### Windows

1. Download the latest `leviathan-windows-x64.zip` from [GitHub Releases](https://github.com/aethersea/aethersea/releases).
2. Extract the archive to a folder of your choice (e.g. `C:\Leviathan`).
3. Run `leviathan.exe` as Administrator on first run to allow firewall rules to be created.

**Run as a service (recommended)**

```bash
leviathan.exe install
leviathan.exe start
```

### macOS

1. Download the latest `leviathan-macos-arm64.tar.gz` (Apple Silicon) or `leviathan-macos-x64.tar.gz` (Intel) from [GitHub Releases](https://github.com/aethersea/aethersea/releases).
2. Extract and move the binary:

```bash
tar -xzf leviathan-macos-arm64.tar.gz
sudo mv leviathan /usr/local/bin/
```

3. Grant Screen Recording permission: **System Settings → Privacy & Security → Screen Recording** → add Leviathan.
4. Start Leviathan:

```bash
leviathan
```

**Run as a Launch Agent (recommended)**

```bash
leviathan install-service
```

### Linux

```bash
tar -xzf leviathan-linux-x64.tar.gz
sudo mv leviathan /usr/local/bin/
sudo leviathan install-service
sudo systemctl enable --now leviathan
```

## First Run

On first run, Leviathan generates a configuration file at:

| Platform | Path |
|----------|------|
| Windows | `%ProgramData%\Leviathan\config.toml` |
| macOS | `~/.config/leviathan/config.toml` |
| Linux | `~/.config/leviathan/config.toml` |

Leviathan will then listen for incoming Shen connections. Open [Shen](https://shen.theaethersea.com/docs/getting-started) on your client machine and follow the pairing instructions.

## Verifying the Installation

```bash
leviathan --version
leviathan status
```
