---
title: "Networking"
description: "Configure signaling and WebRTC connectivity for local and remote access."
---

Leviathan exposes a single TCP signaling port and uses WebRTC over UDP for media. There is no STUN/TURN/relay infrastructure on the server side — Leviathan runs in **ICE-Lite** mode and the client is responsible for ICE candidate gathering.

## Ports

| Port | Protocol | Purpose |
|------|----------|---------|
| `21218` | TCP (TLS) | gRPC signaling: pairing, session setup, management RPCs |
| Ephemeral UDP (`49152–65535`) | UDP (DTLS-SRTP) | WebRTC media (video, audio) and DataChannels (control, telemetry, clipboard, file transfer) |

The gRPC port is configurable via `network.manual.grpc_port` or the `--grpc-port` CLI flag (default `21218`).

The UDP port range is what Pion's `SetEphemeralUDPPortRange` requests from the OS in both `lan` mode and dynamic-port `manual` mode. In manual mode you can pin a fixed UDP port via `network.manual.webrtc_port` instead.

## Network Modes

Leviathan has two network modes, selected via `network.mode` in `config.toml`.

### `lan` (default)

Suited to local-network use over a single subnet (or a VPN like WireGuard / Tailscale). The OS assigns ephemeral UDP ports for each WebRTC session, and ICE candidates are filtered to the same local IP that received the gRPC signaling connection so media follows the same network path as signaling.

```toml
[network]
mode = "lan"
bind_address = "0.0.0.0"
```

### `manual`

For deployments where the server sits behind NAT and you want to port-forward a known UDP port and/or advertise a public IP. Set the public IP and any fixed ports under `[network.manual]`:

```toml
[network]
mode = "manual"
bind_address = "0.0.0.0"

  [network.manual]
  external_ip = "203.0.113.10"   # Public IP advertised as host candidate
  grpc_port = 21218
  webrtc_port = 53000            # Fixed UDP port (forward this on your router)
```

When `webrtc_port` is non-zero, Leviathan binds a single shared ICE UDP mux on that port and reuses it across all sessions. When `external_ip` is set, the server adds it as a NAT1To1 host candidate so clients dial it directly.

## Binding to a Specific Interface

To restrict Leviathan to one network interface (e.g. a VPN), set `bind_address` to that interface's IP:

```toml
[network]
bind_address = "10.0.0.1"
```

The signaling listener and the WebRTC ICE candidate filter both honor this value.

## Remote Access (Internet)

For connections from outside the LAN, choose one of:

1. **VPN (recommended).** Run WireGuard / Tailscale / ZeroTier between client and host and connect over the VPN IP. No port forwarding, no public exposure, and `lan` mode works as-is.
2. **Port forward `manual` mode.** Forward both the gRPC TCP port and a fixed WebRTC UDP port (`network.manual.webrtc_port`) on your router, set `network.manual.external_ip` to your public address, and use a DDNS hostname or static IP for the client connection target.

## Service Discovery

Leviathan does **not** broadcast itself via mDNS / Bonjour / Zeroconf. Clients must be told the server address (hostname or IP) explicitly.

> Note: `pion/mdns` shows up as an indirect dependency in `go.mod` because pion/ice supports `.local` mDNS host candidates inside its ICE stack — Leviathan itself does not advertise any mDNS service records.
