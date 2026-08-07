---
title: "Forward Error Correction (FEC)"
description: "Implementation details for Aethersea Reed-Solomon forward error correction."
---

Shen implements forward error correction using **Reed-Solomon (RS) erasure codes** over GF(2^8) to recover lost RTP video packets without retransmission. The server generates RS parity shards for each frame's RTP packets and sends them as additional RTP packets; the client collects data and parity packets and reconstructs any missing packets via RS decoding.

## Design Goals

- **Zero retransmission**: No NACK/ARQ mechanism — packet loss is recovered entirely through FEC, avoiding additional RTT latency
- **Transparent transport**: FEC metadata is carried in RTP header extensions without modifying the H.265/AV1 payload format
- **Configurable overhead**: The server controls the redundancy ratio via the `fec_percentage` parameter (e.g., 20 means 20% additional bandwidth)

## RTP Header Extension Format

FEC metadata is embedded in a **6-byte RFC 8285 one-byte header extension**:

```
Byte 0:     flags             (bit 7 = isParity, bits 6-0 reserved)
Byte 1:     fecPercentage     (0-100, redundancy percentage)
Byte 2-3:   dataShardCount    (u16 BE, number of data packets in this FEC block)
Byte 4-5:   baseSequenceNumber(u16 BE, first RTP sequence number of this FEC block)
```

- **Extension URI**: `urn:leviathan:fec` (RFC 8285 one-byte format, ID range 1-14)
- **Extension ID**: negotiated via SDP (`a=extmap:N urn:leviathan:fec`). pion assigns extension IDs itself during registration — TWCC usually claims 1, so FEC typically lands on **2**. The server resolves the negotiated ID from its video sender's parameters and writes *that* ID into packets (`DefaultFecExtensionID = 9` remains only as a fallback when resolution fails). All three clients (desktop, Android, iOS) parse the negotiated ID from the server's SDP offer; a fallback scan over all 6-byte extensions is retained as a safety net

## RS Parameter Calculation

Reed-Solomon parameters for each FEC block:

| Parameter | Calculation |
|-----------|-------------|
| `data_shards` | `dataShardCount` (number of RTP data packets for the frame), **minimum 1** — single-packet frames (common for static-scene P-frames) are protected too (RS(1, 2)) |
| `parity_shards` | `max(2, ceil(dataShardCount × fecPercentage / 100))`, minimum 2 parity shards |
| `shard_size` | Maximum payload length among all data packets in the block (shorter packets are zero-padded) |
| Total shard limit | `data_shards + parity_shards ≤ 256` (GF(2^8) constraint) |

These derivation rules are mirrored on both sides of the wire: the client computes `parity_shards` from the header-extension fields alone, so the formula (including the minimum of 2 and the 256-shard cap) must never change unilaterally.

## Shard Length Prefix

Each shard is prefixed with a **2-byte big-endian length** (recording the original payload length) during server-side encoding. Since RS encoding requires all shards to be equal length, shorter payloads are zero-padded. After decoding, the client uses the length prefix to strip the original payload and remove trailing zeros — this is critical for H.265 FU fragment reassembly.

```
[2-byte BE original_length] [original payload] [zero padding...]
```

## Core Data Structures

### FecInfo

Metadata parsed from the RTP header extension:

```rust
struct FecInfo {
    is_parity: bool,         // whether this is a parity packet
    fec_percentage: u8,      // redundancy percentage (1-100)
    data_shard_count: u16,   // number of data shards
    base_sequence: u16,      // starting sequence number of the FEC block
}
```

### FecBlock

Collects all data and parity packets belonging to the same FEC block:

```rust
struct FecBlock {
    fec_info: FecInfo,
    packets: HashMap<u16, FecPacket>,  // indexed by shard_index
    max_payload_len: usize,            // max payload length (determines RS shard size)
}
```

### FecBlockKey

Uniquely identifies a FEC block (used on Android/iOS):

```rust
struct FecBlockKey {
    timestamp: u32,          // RTP timestamp
    base_sequence: u16,      // starting sequence number of the FEC block
}
```

## Encoding (Server-Side)

1. Prepend a 2-byte length prefix to each RTP data packet payload for the frame
2. Zero-pad all payloads to a uniform `shard_size`
3. Calculate parity shard count: `parity = max(2, ceil(data_count × fec_percentage / 100))`
4. Create RS codec: `ReedSolomon::new(data_count, parity_count)`
5. Encode to generate parity shards
6. Wrap parity shards as RTP packets with FEC header extension (`isParity = true`) and send

The whole send path (leviathan `internal/streaming/fec_send.go`) is shared across platforms (Windows/macOS) and codecs (H.265/AV1). Two invariants it maintains:

- **Extension present ⇒ parity was sent.** If parity generation fails for a block, its data packets are still sent — *without* the FEC extension — so clients treat them as plain data instead of arming an FEC block whose parity never arrives. (Previously a parity failure silently dropped the block's data packets entirely.)
- A `WriteRTP` failure aborts the rest of the frame send on every platform (the track is dead; pushing more packets is pointless).

## Decoding (Client-Side)

### Fast Path

All data packets received → skip RS decoding, strip length prefixes and return original payloads directly.

### RS Recovery Path

1. Confirm ≥ `data_shard_count` shards are available (combining data and parity)
2. Build shard matrix: zero-pad received packets, mark missing as `None`
3. Call `rs.reconstruct()` to rebuild missing shards
4. Strip the 2-byte length prefix from each reconstructed data shard to recover original payloads
5. Return all data packets in sequence number order

A recovered packet may carry the RTP marker bit **only when it is the last shard of the frame's last FEC block** (largest `base_sequence`, wrap-aware). On the wire only the frame's final data packet has the marker; fabricating one on inner blocks would mask a truly lost frame tail from the frame-completeness check.

### Flush Gating (Desktop)

The desktop receiver's frame assembly (`shen/native/src/leviathan/frame_assembler.rs`) applies one unified rule: *a frame whose marker has been observed is flushed iff every one of its FEC blocks is complete or recoverable*, and the gate is re-evaluated after **every** insert into that frame — data or parity.

This matters because the server always sends a block's parity *after* its data (the marker rides the last data packet). At marker time the parity is necessarily still in flight; flushing immediately would run recovery with zero parity shards, declare the frame corrupt, and request an IDR — the "IDR storm" failure mode. Under the gate the frame is held until parity (or reordered late data) makes it recoverable.

### Timeout Cleanup

FEC blocks that cannot be recovered are discarded after **150ms** (the jitter-buffer timeout, which also backstops the flush gate above) to prevent unbounded memory growth. Discarding an unrecoverable block marks the frame corrupt and triggers an IDR keyframe request.

## Multi-Block FEC

Large frames may be split into **multiple independent FEC blocks**, each with its own `base_sequence` and shard count. The client uses a `HashMap<base_sequence, FecBlock>` (Desktop) or `HashMap<FecBlockKey, FecBlock>` (Android/iOS) to manage multiple concurrent blocks.

## Packet Loss Recovery Strategy

| Level | Mechanism | Description |
|-------|-----------|-------------|
| Primary | FEC | Recovers packet loss below `fec_percentage`, zero latency |
| Secondary | IDR request | Requests a keyframe when FEC cannot recover |
| Disabled | NACK/retransmission | Explicitly disabled to avoid retransmission packet floods |

## Platform Implementations

### Desktop (shen)

- **Language**: Rust
- **RS library**: `reed-solomon-erasure` crate v6.0 (SIMD-accelerated)
- **Integration**: Processed directly in the video packet handling loop, not as a WebRTC Interceptor
- **Core files**:
  - `shen/native/src/leviathan/fec.rs` — FecInfo / FecBlock / RS recovery
  - `shen/native/src/leviathan/frame_assembler.rs` — frame assembly state machine: per-frame buffering, one-frame lookback, FEC block routing, stale rejection and the unified flush gate (pure logic, unit-tested; shared by the H.265 and AV1 reader loops)
- **Integration point**: `shen/native/src/leviathan/media.rs` (both reader loops drive a `FrameAssembler`; depacketization and frame finalization stay codec-specific)
- Data packets are forwarded to the depacketizer and simultaneously inserted into the frame's FEC blocks
- Parity packets are routed to FEC blocks only (never reach the depacketizer)
- `attempt_fec_recovery()` runs when an assembled frame is flushed

### Android (shen-android)

- **Language**: Rust (JNI)
- **RS library**: `reed-solomon-erasure` crate v6.0
- **Integration**: WebRTC Interceptor (async, tokio-based)
- **Core files**:
  - `shen-android/app/src/main/jni/shen-core/src/fec/receiver.rs` — FEC receiver
  - `shen-android/app/src/main/jni/shen-core/src/fec/interceptor.rs` — WebRTC interceptor
  - `shen-android/app/src/main/jni/shen-core/src/fec/reed_solomon.rs` — RS codec wrapper
  - `shen-android/app/src/main/jni/shen-core/src/fec/stats.rs` — statistics
- Data packets are **passed through** to the depacketizer and simultaneously registered with the FecReceiver
- Parity packets are consumed (not forwarded downstream) and registered with the FecReceiver
- Recovered packets are buffered and returned on subsequent `read()` calls
- Expired blocks are cleaned up periodically every 200ms
- Extension ID is parsed dynamically from the server's SDP offer

### iOS (shen-ios)

- **Language**: Rust (shared design with shen desktop, exposed to Swift via FFI)
- **RS library**: `reed-solomon-erasure` crate v6.0
- **Integration**: Processed directly in the H.265 / AV1 RTP reader loops, not as a WebRTC Interceptor
- **Core files**:
  - `shen-ios/native/src/fec.rs` — FecInfo / FecBlock / RS recover (ported from `shen/native/src/leviathan/fec.rs`)
  - `shen-ios/native/src/media.rs` — RTP loop integration (`read_h265_rtp` and `read_av1_rtp` both call `extract_fec_info_from_rtp`)
- Extension ID is parsed dynamically from the server's SDP offer (shared `parse_fec_extension_id_from_sdp` helper, mirrors the desktop implementation)
- The legacy `shen-ios/Shen/Services/FEC/*.swift` files (pure Swift `ReedSolomon` / `FECReceiver` / `FECBlock` / `FECStats`) are **dead code** — superseded by the Rust backend and no longer referenced by any caller

## Statistics and Monitoring

### Desktop

Global atomic counters:

- `STATS_FEC_RECOVERED` — number of successfully recovered FEC blocks
- `STATS_FEC_FAILED` — number of blocks that failed or timed out

### Android

`FecStats` struct (atomic operations, lock-free):

| Field | Description |
|-------|-------------|
| `recovered_frames` | Frames where at least one packet was recovered |
| `failed_frames` | Frames that could not be recovered |
| `recovered_packets` | Total number of recovered packets |
| `total_data_packets` | Total data packets received |
| `total_parity_packets` | Total parity packets received |

Exported as JSON via `to_json()` for real-time monitoring.

### iOS

Same global atomics as desktop (`STATS_FEC_RECOVERED` / `STATS_FEC_FAILED`), surfaced to the Swift UI through `MediaStatsEvent` once per second. The `PerformanceOverlay` shows `FEC recovery: X.XX% (N OK / M fail)`.
