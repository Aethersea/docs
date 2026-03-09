---
sidebar_position: 7
---

# Networking

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `47990` | TCP | Control plane (signaling, pairing) |
| `47998–48010` | UDP | Media transport (video, audio, input) |

Open these ports in your firewall / router for the host machine.

## Local Network

On a local network, Leviathan and Shen connect directly. No relay is involved.

## Remote Access (Internet)

For connections over the internet:

1. **Port forward** ports `47990` (TCP) and `47998–48010` (UDP) on your router to the host machine's local IP.
2. Use a **DDNS** service or a static IP to identify the host.
3. Alternatively, set up a **VPN** (e.g. WireGuard, Tailscale) between the two machines and connect over the VPN IP — no port forwarding required.

## Binding to a Specific Interface

To restrict Leviathan to a specific network interface (e.g. VPN):

```toml
[server]
bind = "10.0.0.1"   # Replace with your VPN interface IP
```

## mDNS / Local Discovery

Leviathan broadcasts its presence via mDNS on the local network. Shen can discover it automatically without requiring you to enter an IP address, as long as both devices are on the same subnet.
