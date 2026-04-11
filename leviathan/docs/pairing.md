---
sidebar_position: 6
---

# Pairing

Pairing establishes a trusted relationship between a Leviathan instance and a Shen client. It is a one-time process per client; subsequent connections from the same client are authenticated automatically by their DTLS fingerprint.

## How Pairing Works

Pairing in Leviathan is **password-based**, not PIN-based. There is no time-limited 6-digit code; instead the operator sets a long-lived server username/password and shares it with each client they want to authorize.

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

## Storage Layout

| File | Purpose |
|------|---------|
| `credentials.json` | Server username + Argon2id password hash + salt |
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

## Rotating the Server Password

Re-running `leviathan set-credentials` overwrites `credentials.json`. Existing paired clients are **not** invalidated — they still authenticate via their stored DTLS fingerprint. Rotating the password only affects the ability of *new* clients to pair.

To force a full re-pair of every client, delete `trusted_clients.json` (or selectively unpair entries) before rotating the password.
