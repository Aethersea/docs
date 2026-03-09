---
sidebar_position: 2
---

# Getting Started

## Prerequisites

- A machine running [Leviathan](https://leviathan.theaethersea.com/docs/getting-started) (the host)
- Network connectivity between the host and client machines

## Installation

### Windows

Download the latest `Shen-Setup-x.x.x.exe` from the [GitHub Releases](https://github.com/aethersea/aethersea/releases) page and run the installer.

### macOS

Download the latest `Shen-x.x.x.dmg` (Apple Silicon) or `Shen-x.x.x-x64.dmg` (Intel) from the [GitHub Releases](https://github.com/aethersea/aethersea/releases) page.

Open the DMG, drag **Shen** to your Applications folder, and launch it.

> **macOS note:** You may need to allow Shen in **System Settings → Privacy & Security** on first launch.

## Connecting

1. Launch Shen.
2. Click **Add Host** and enter the IP address or hostname of the machine running Leviathan.
3. Leviathan will display a **pairing PIN** — enter it in Shen to complete pairing.
4. Select the paired host from the list and click **Connect**.

## Pairing

Pairing is a one-time step that establishes a trusted relationship between Shen and a Leviathan instance. Once paired, subsequent connections do not require a PIN.

To remove a pairing, right-click the host in the list and choose **Remove**.

## First Connection Checklist

- [ ] Leviathan is running on the host machine
- [ ] Firewall on the host allows the Leviathan port (default: `47990`)
- [ ] You have the host IP address or hostname
