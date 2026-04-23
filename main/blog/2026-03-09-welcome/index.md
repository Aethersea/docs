---
slug: welcome
title: Welcome to Aethersea
authors: [aethersea]
tags: [announcement]
---

We're excited to introduce **Aethersea** — an open-source, high-performance remote desktop solution.

<!-- truncate -->

## What is Aethersea?

Aethersea is a remote desktop and game streaming platform built for low latency and high fidelity. It consists of two main components:

- **[Leviathan](https://leviathan.theaethersea.com)** — the server component (Go), which captures the host desktop, encodes with hardware acceleration (NVENC / QSV / AMF / VideoToolbox / SVT-AV1), and streams over WebRTC.
- **[Shen](https://shen.theaethersea.com)** — the cross-platform client family. The desktop client is Electron + Rust; separate iOS and Android clients share the same WebRTC/FEC protocol.

## Why Aethersea?

We built Aethersea because we wanted a remote desktop solution that prioritizes performance without sacrificing ease of use. The project is fully open-source and designed with modern hardware in mind.

## Getting Started

Head over to the [Leviathan docs](https://leviathan.theaethersea.com/docs/getting-started) to set up the server, then install [Shen](https://shen.theaethersea.com/docs/getting-started) to connect.

Stay tuned for more updates!
