---
sidebar_position: 8
---

# Security

## Authentication

All Shen clients must complete the [pairing](./pairing) process before they can connect. Unpaired clients are rejected. There is no password-based authentication — security relies on the public-key exchange performed during pairing.

## Encryption

All traffic between Leviathan and Shen is encrypted. The media transport uses DTLS 1.3 for UDP streams, and the control channel uses TLS 1.3.

## Principle of Least Privilege

- On **Windows**, Leviathan runs as `LOCAL SERVICE` when installed as a system service, limiting its access to sensitive resources.
- On **macOS**, Leviathan requests only the permissions it needs: Screen Recording and (optionally) Accessibility for input injection.

## Exposing Leviathan to the Internet

If you need remote access from outside your local network, the recommended approach is to use a **VPN** rather than exposing Leviathan's port directly. WireGuard and Tailscale are both good options.

If you must port-forward, ensure:

- The pairing PIN has a short timeout (`pairing.timeout = 60`)
- You promptly remove paired clients that are no longer in use (`leviathan clients remove`)
- Your router/firewall limits the source IPs that can reach Leviathan where possible

## Reporting Vulnerabilities

Please report security issues privately via the [GitHub Security Advisories](https://github.com/aethersea/aethersea/security/advisories) page.
