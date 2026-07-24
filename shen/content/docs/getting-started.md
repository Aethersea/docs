---
title: "Getting Started"
description: "Install Shen, add a Leviathan host, and start your first stream."
---

## Prerequisites

- A machine running [Leviathan](https://leviathan.theaethersea.com/docs/getting-started) (the host PC).
- Network connectivity between the host and this client.
- The **username and password** the Leviathan operator configured via `leviathan set-credentials`.

## Installation

### Windows

Download the latest `Shen-Setup-<version>.exe` from the [GitHub Releases](https://github.com/aethersea/aethersea/releases) page and run the NSIS installer. The installer allows per-user or per-machine install and lets you choose the install directory.

### macOS

Download the latest `Shen-<version>-arm64.dmg` (Apple Silicon) or `Shen-<version>-x64.dmg` (Intel) from the [GitHub Releases](https://github.com/aethersea/aethersea/releases) page. Open the DMG and drag **Shen** to your Applications folder.

On first launch, macOS will prompt for several permissions depending on what you use:

- **Input Monitoring** — for gamepad (SDL3)
- **Accessibility** — required by immersive mode; Shen proactively prompts at startup if any saved server has `immersive_mode = true`
- **Local Network** — required to reach the Leviathan host

### Linux

Linux builds are produced as an **AppImage** and are currently experimental. Download `Shen-<version>-x86_64.AppImage`, `chmod +x` it, and run. On distributions without a system `libfuse2`, run the AppImage with `--appimage-extract-and-run`.

For Debian or Ubuntu, download `shen_<version>_amd64.deb` and install it with `sudo apt install ./shen_<version>_amd64.deb`. Using `apt` (rather than `dpkg -i`) lets it resolve runtime dependencies automatically.

## Pairing

Pairing is a one-time step that establishes a trusted relationship between Shen and a Leviathan server. It is **username/password-based**, not PIN-based: the server operator sets long-lived credentials on Leviathan (`leviathan set-credentials`) and shares them with you out-of-band.

1. Launch Shen.
2. Click **Add Host** and enter the Leviathan server's IP address or hostname.
3. Enter the username and password the operator gave you.
4. Shen submits the credentials together with its WebRTC DTLS fingerprint; Leviathan verifies and records the fingerprint in its trust store. From this point on, the password is not needed — subsequent connections authenticate automatically via the pinned DTLS fingerprint.
5. Select the paired host from the home view and click **Connect**.

To remove a pairing, use the server card's menu and choose **Remove**. This deletes the local server entry and, if the server is reachable, calls `ManagementService.Unpair` so the host forgets your DTLS fingerprint too.

## Credentials Storage

Shen stores per-server pairing material in the **OS keyring** (Credential Manager on Windows, Keychain on macOS, Secret Service on Linux) — not in any plaintext config file. The keyring is accessed through the Rust `keyring` crate.

## First Connection Checklist

- [ ] Leviathan is running on the host machine (default port `21218/TCP`).
- [ ] The host firewall permits inbound `21218/TCP` and the WebRTC UDP range Leviathan advertises (ephemeral `49152–65535` in `lan` mode, or the fixed port you set in `manual` mode).
- [ ] You know the host address (IP, hostname, or VPN address) and the operator's username/password.

If the host sits behind NAT and you are connecting across the internet, see [Networking](https://leviathan.theaethersea.com/docs/networking) on the Leviathan side for how to set up `manual` network mode and which ports to forward.
