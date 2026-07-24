---
title: "Pairing"
description: "Understand Leviathan credential, fingerprint, and TOTP pairing flows."
---

Pairing establishes a trusted relationship between a Leviathan instance and a Shen client. It is a one-time process per client; subsequent connections from the same client are authenticated automatically by their DTLS fingerprint.

## How Pairing Works

Leviathan supports two pairing methods, both backed by the same server-wide credential set: a long-lived **username + password**, and an optional **TOTP (2FA)** rolling code. A client picks one method when it pairs; either way the result is the same trusted DTLS fingerprint.

### Password

1. The operator sets a server username and password on Leviathan:

   ```bash
   leviathan set-credentials --username <user> --password <pass>
   ```

   The password is hashed with Argon2id (`time=1, memory=64 MiB, parallelism=4, key=32 bytes`) and stored in `credentials.json` under the config directory.

2. In Shen, add the host address and enter the same username and password when prompted.

3. Shen calls the `PairingService.Pair` gRPC RPC with:
   - the username,
   - the password,
   - a friendly client name,
   - the SHA-256 fingerprint of its WebRTC DTLS certificate.

4. Leviathan verifies the password against the stored Argon2id hash (constant-time comparison), records the client's DTLS fingerprint in `trusted_clients.json`, and returns the server's own DTLS fingerprint so the client can pin it.

5. On every subsequent session, the server matches the incoming DTLS fingerprint against the trust store. Unpaired fingerprints are rejected before the WebRTC media pipeline starts.

### TOTP (2FA)

As an alternative to the password, the operator can enroll a TOTP shared secret (RFC 6238: 6 digits, SHA-1, 30-second period) via the management service (`ManagementService.EnrollTOTP`), then scan the returned `otpauth://` URI into an authenticator app.

For out-of-band setup before any client has paired, the server CLI exposes `leviathan totp enroll`, which generates a fresh secret and prints the `otpauth://` URI as a scannable half-block QR code directly in the terminal (with the URI and base32 secret shown underneath for manual entry). `leviathan totp status` and `leviathan totp disable` report and clear the enrollment.

When pairing with TOTP, the client sends **only the current 6-digit code** — no username. The server holds a single credential set, so possession of a valid code proves possession of the shared secret; a username adds nothing and is not required (or checked) for this method. Shen's desktop, iOS, and Android clients therefore hide the username field when the TOTP method is selected.

Validation accepts ±1 period of clock skew, so a code generated near a 30-second boundary still verifies on either side. A successful TOTP pair records the client's DTLS fingerprint exactly like the password path. Rotating the password preserves the enrolled TOTP secret; call `ManagementService.DisableTOTP` to clear it.

## Storage Layout

| File | Purpose |
|------|---------|
| `credentials.json` | Server username + Argon2id password hash + salt + (optional) base32 TOTP secret and enrollment timestamp |
| `trusted_clients.json` | Array of `{client_id, client_name, dtls_fingerprint_sha256, paired_at}` records |

Both live in the per-platform config directory:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\leviathan\` |
| macOS | `~/Library/Application Support/leviathan/` |
| Linux | `$XDG_CONFIG_HOME/leviathan/` (or `~/.config/leviathan/`) |

The files are written with mode `0600`. The `client_id` field is the first 16 hex characters of the DTLS fingerprint.

## Managing Paired Clients

Trusted clients are managed over the management gRPC service from the client side, not via a Leviathan CLI subcommand:

- `ManagementService.GetServerInfo` — query the server name, platform, GPUs, supported codecs, primary display
- `ManagementService.Unpair` — remove a client by its `client_id`

Today there is no `leviathan clients` subcommand. To remove a client manually, edit `trusted_clients.json` directly and restart Leviathan, or call `Unpair` from a Shen client / the debug dashboard.

## Pre-Pair Reachability

`ManagementService.GetServerInfo` is the only unauthenticated RPC on the management service. While the gRPC listener uses TLS, it is configured for server-only authentication; the handler does not perform trust-store lookups or require client certificates for this specific call.

This is deliberate: Shen clients need to probe a host for basic metadata — such as the server name, OS platform, hardware codecs, and primary display — before the user has entered credentials. This allows the UI to render **Online** or **Offline** status chips for newly added hosts that have not yet been paired.

All Shen clients (desktop, iOS, and Android) follow a standard convention:

- The `GetServerInfo` call is always made over an anonymous TLS channel, even if the client already holds pairing credentials.
- In the Android Rust bindings, passing empty strings for `client_cert_pem` and `client_key_pem` signals the gRPC client to use `create_channel_no_client_cert`.

Because the endpoint is open, it only returns non-sensitive metadata. It does not leak the trust-store contents, paired-client lists, or any credentials. All other management-plane flows that mutate state — including pairing (via server password), unpairing, and streaming session setup (via paired DTLS fingerprint) — continue to require full authentication.

## Rotating the Server Password

Re-running `leviathan set-credentials` overwrites `credentials.json`. Existing paired clients are **not** invalidated — they still authenticate via their stored DTLS fingerprint. Rotating the password only affects the ability of *new* clients to pair.

To force a full re-pair of every client, delete `trusted_clients.json` (or selectively unpair entries) before rotating the password.
