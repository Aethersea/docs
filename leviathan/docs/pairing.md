---
sidebar_position: 6
---

# Pairing

Pairing establishes a trusted relationship between a Leviathan instance and a Shen client. It is a one-time process per client.

## How Pairing Works

1. Leviathan generates a random **6-digit PIN** and displays it in its log / status UI.
2. In Shen, add the host IP and enter the PIN when prompted.
3. Leviathan and Shen exchange public keys and store them securely on both sides.
4. Future connections from the same Shen installation are authenticated automatically.

## Managing Paired Clients

List all paired clients:

```bash
leviathan clients list
```

Remove a client by its ID:

```bash
leviathan clients remove <client-id>
```

## PIN Timeout

The pairing PIN expires after 120 seconds by default. To change this:

```toml
[pairing]
timeout = 300   # seconds
```

## Credential Storage

| Platform | Location |
|----------|----------|
| Windows | `%ProgramData%\Leviathan\clients\` |
| macOS / Linux | `~/.config/leviathan/clients/` |

Client credentials are stored as individual JSON files. Each file contains the client's public key and a friendly name.
