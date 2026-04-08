# Forward Error Correction (FEC)

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

- **Extension ID**: 9 (RFC 8285 one-byte format, ID range 1-14)
- **Extension URI**: `urn:leviathan:fec` (negotiated via SDP `a=extmap`)

## RS Parameter Calculation

Reed-Solomon parameters for each FEC block:

| Parameter | Calculation |
|-----------|-------------|
| `data_shards` | `dataShardCount` (number of RTP data packets for the frame) |
| `parity_shards` | `max(2, ceil(dataShardCount × fecPercentage / 100))`, minimum 2 parity shards |
| `shard_size` | Maximum payload length among all data packets in the block (shorter packets are zero-padded) |
| Total shard limit | `data_shards + parity_shards ≤ 256` (GF(2^8) constraint) |

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

## Decoding (Client-Side)

### Fast Path

All data packets received → skip RS decoding, strip length prefixes and return original payloads directly.

### RS Recovery Path

1. Confirm ≥ `data_shard_count` shards are available (combining data and parity)
2. Build shard matrix: zero-pad received packets, mark missing as `None`
3. Call `rs.reconstruct()` to rebuild missing shards
4. Strip the 2-byte length prefix from each reconstructed data shard to recover original payloads
5. Return all data packets in sequence number order

### Timeout Cleanup

FEC blocks that cannot be recovered are discarded after **150ms** to prevent unbounded memory growth. Discarding a block triggers an IDR keyframe request.

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
- **Core file**: `shen/native/src/leviathan/fec.rs`
- **Integration point**: `shen/native/src/leviathan/media.rs`
- Data packets are always received and forwarded to the depacketizer
- Parity packets are stored in the `current_fec_blocks` HashMap
- `attempt_fec_recovery()` is called when a frame is flushed

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
- Extension ID is parsed dynamically from SDP

### iOS (shen-ios)

- **Language**: Swift (pure Swift GF(2^8) implementation) + Rust backend
- **RS library**: Pure Swift `ReedSolomon` struct using Vandermonde matrix + GF(2^8) Gaussian elimination
- **Integration**: Swift Actor model (thread-safe)
- **Core files**:
  - `shen-ios/Shen/Services/FEC/FECReceiver.swift` — FEC receiver (Actor)
  - `shen-ios/Shen/Services/FEC/ReedSolomon.swift` — pure Swift RS implementation
  - `shen-ios/Shen/Services/FEC/FECBlock.swift` — block management
  - `shen-ios/Shen/Services/FEC/FECStats.swift` — statistics
- GF(2^8) uses primitive polynomial `0x11D` (x^8 + x^4 + x^3 + x^2 + 1)
- Finite field arithmetic accelerated via lookup tables (`expTable`/`logTable`)

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

`FECStats` struct (`Sendable`):

| Field | Description |
|-------|-------------|
| `completedFrames` | Frames received complete (no recovery needed) |
| `recoveredFrames` | Frames recovered via RS |
| `failedFrames` | Frames that failed recovery |
| `recoveredPackets` | Total number of recovered packets |

Provides a `recoveryRate` computed property (recovery success rate).
