---
sidebar_position: 8
---

# Security

## Authentication

All Shen clients must complete the [pairing](./pairing) flow before they can open a streaming session. An operator sets a server-wide username and password via `leviathan set-credentials`, and clients submit those credentials once over the gRPC `PairingService.Pair` RPC together with the SHA-256 fingerprint of their WebRTC DTLS certificate. Clients may instead pair with an enrolled **TOTP (2FA)** code, which requires only the rolling 6-digit code — see [pairing](./pairing) for details.

Subsequent sessions are authenticated by checking the incoming DTLS fingerprint against the trust store — the password is no longer needed once a client is paired. Unpaired fingerprints are rejected before the streaming pipeline starts.

The server password is hashed with **Argon2id** (`time=1, memory=64 MiB, parallelism=4, key=32 bytes`) and verified in constant time on each pair attempt.

## Encryption

| Channel | Transport | Notes |
|---|---|---|
| gRPC signaling, pairing, management | TLS over TCP | `tls.Config{MinVersion: TLS 1.2}` — negotiates TLS 1.3 when the client supports it |
| WebRTC media (video, audio) | DTLS-SRTP over UDP | Pion default DTLS suites (`SRTP_AEAD_AES_128_GCM`, `SRTP_AES128_CM_HMAC_SHA1_80`) |
| WebRTC DataChannels (control, telemetry, clipboard, file transfer) | DTLS over SCTP over UDP | Same DTLS session as the media PeerConnection's control channel |

The TLS certificate is generated on first run and stored under the per-platform config directory. Its SHA-256 fingerprint is logged at startup so you can pin it in clients.

## Rate Limiting

The signaling server applies a per-source-IP rate limit on failed pairing attempts (in-memory, with a 10-minute TTL on stale entries). Repeated bad-password attempts from the same IP are throttled to slow down brute-force attempts.

## Principle of Least Privilege

- On **Windows**, when installed via `leviathan service install`, Leviathan registers with the Service Control Manager and runs under the **SYSTEM** account (required so the service can launch a child process into the active console session for desktop capture and input injection). The service does not run as `LOCAL SERVICE` — that account does not have the rights needed for `WTSQueryUserToken` and the cross-session launch dance.
- On **macOS**, Leviathan runs as a **launchd LaunchAgent in the user's GUI session**, not as a system daemon. It requests only Screen Recording permission (and optionally Accessibility for input injection if enabled).

## Exposing Leviathan to the Internet

Prefer running Leviathan inside a **VPN** (WireGuard, Tailscale, ZeroTier) rather than exposing it directly. With a VPN, Leviathan stays in `lan` mode and no router configuration is needed.

If you must port-forward, switch to `manual` mode and forward only the two ports Leviathan needs:

```toml
[network]
mode = "manual"

  [network.manual]
  external_ip = "203.0.113.10"
  grpc_port = 21218
  webrtc_port = 53000
```

Then on your router/firewall:

- Forward the gRPC TCP port and the fixed WebRTC UDP port to the host's local IP.
- Restrict the source IPs allowed to reach those ports where possible.
- Make sure the server password is long and high-entropy — it gates new pairings, and brute-force attempts from the open internet are inevitable.
- Periodically prune entries from `trusted_clients.json` (or call `ManagementService.Unpair` from a Shen client) to remove devices you no longer need.

## Reporting Vulnerabilities

Please report security issues privately via the [GitHub Security Advisories](https://github.com/aethersea/aethersea/security/advisories) page.
