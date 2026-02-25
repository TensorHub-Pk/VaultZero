# 🛡️ VaultZero — Cryptographic & Security Architecture

VaultZero is a **Zero-Knowledge, Offline-First** cybersecurity platform with **Post-Quantum** resistance. All cryptographic operations execute client-side. No data ever leaves the device.

---

## 1. 🔍 Cryptographic Primitives

### 1.1 Symmetric Encryption (Data-at-Rest)

| Layer               | Implementation                                            |
| ------------------- | --------------------------------------------------------- |
| **Primary Cipher**  | ChaCha20-Poly1305-IETF (Libsodium WASM)                   |
| **Fallback Cipher** | AES-256-GCM (Web Crypto API, hardware-accelerated)        |
| **Primary KDF**     | Argon2id (time=3, memory=64MB, hashLen=32, parallelism=1) |
| **Fallback KDF**    | PBKDF2-HMAC-SHA256 (600,000 iterations)                   |

- **Algorithm Selection**: Automatic. ChaCha20-Poly1305 is used when Libsodium WASM loads; AES-256-GCM via Web Crypto API otherwise.
- **Always-Wrap Envelope**: Every payload is wrapped in a JSON structure containing content, metadata (filename, MIME type, size), SHA-256 integrity hash, and optional expiration timestamp — all encrypted inside the AEAD ciphertext.
- **Binary Format**: `[AlgoID 1B][Flags 1B][Salt 16B][IV 12B][Ciphertext+Tag]`
- **Flags**: Bit 0 = text, Bit 1 = expiration, Bit 2 = wrapped (always set)

### 1.2 Asymmetric Encryption (Secure Share)

| Layer                         | Implementation                                              |
| ----------------------------- | ----------------------------------------------------------- |
| **Classical Key Exchange**    | X25519 (ECDH) via Libsodium                                 |
| **Post-Quantum Key Exchange** | ML-KEM-768 (Kyber) via liboqs WASM                          |
| **Key Derivation**            | BLAKE2b hash of concatenated X25519 + ML-KEM shared secrets |
| **Payload Cipher**            | ChaCha20-Poly1305-IETF with AEAD                            |

- **Hybrid Mode**: When ML-KEM-768 is available, both X25519 and Kyber shared secrets are combined via `BLAKE2b(shared1 || shared2)` to derive a 256-bit symmetric key. If Kyber WASM fails to load, X25519-only mode is used.
- **Ephemeral Keys**: A fresh X25519 keypair is generated per encryption operation.
- **Binary Format**: `[Hybrid 1B][Flags 1B][EphPK 32B][KyberCT 1088B if hybrid][IV 12B][Ciphertext+Tag]`

### 1.3 Digital Signatures

| Type             | Implementation                | Details                                           |
| ---------------- | ----------------------------- | ------------------------------------------------- |
| **Classical**    | Ed25519 (Libsodium)           | Detached signatures, private key zeroed after use |
| **Post-Quantum** | WOTS+ / Merkle Tree (SHA-256) | Winternitz w=16, 67 hash chains, tree height 4    |

- **WOTS+ Signatures**: 16 one-time signatures per key before rotation is required. ~2.1KB signature size. Genuinely quantum-resistant using only hash functions.
- **Update Verification**: Manifest signatures use Ed25519 against a hardcoded trusted public key (`TRUSTED_UPDATE_PUBLIC_KEY`).

---

## 2. 🛡️ System Integrity & Safety

### 2.1 Total Offline Lockdown

After initialization (2-second delay for update checks), all network APIs are permanently disabled for the session:

| API                    | Action                                                                |
| ---------------------- | --------------------------------------------------------------------- |
| `fetch`                | Replaced with rejection function (native preserved for update checks) |
| `XMLHttpRequest`       | Constructor throws error                                              |
| `WebSocket`            | Constructor throws error                                              |
| `EventSource`          | Constructor throws error                                              |
| `navigator.sendBeacon` | Returns false                                                         |

The `_offlineLocked` flag is set and enforced on both mobile and desktop platforms.

### 2.2 Signed Update Verification

1. **Manifest Fetch**: `version.json` fetched network-first (bypasses SW cache)
2. **Signature Check**: Ed25519 signature verified against `TRUSTED_UPDATE_PUBLIC_KEY`
3. **Signer Validation**: `signerPublicKey` in manifest must match trusted key
4. **Integrity Verification**: SHA-256 hashes of critical scripts (`app.js`, `crypto-engine.js`, `service-worker.js`, `audit-logger.js`) verified against signed manifest
5. **Cache-Busting**: Script integrity checks use `?_v=<timestamp>` to bypass SW cache
6. **Anti-Downgrade**: Semantic version comparison rejects `server < installed`

If any check fails, the update is blocked and logged via the audit system.

### 2.3 WASM Memory Isolation

- Libsodium and Argon2 execute in isolated WASM linear memory
- JavaScript cannot iterate WASM memory without explicit exports
- Sensitive buffers zeroed via `sodium.memzero()` with manual `fill(0)` fallback

---

## 3. 📄 Content & Payload Security

### 3.1 Full Metadata Encryption

All payloads are wrapped in an encrypted JSON envelope:

| Field      | Content                                           |
| ---------- | ------------------------------------------------- |
| `_sv_msg`  | Encrypted content (text or Base64-encoded binary) |
| `_sv_bin`  | Boolean flag indicating binary data               |
| `_sv_name` | Sanitized original filename                       |
| `_sv_type` | MIME type                                         |
| `_sv_size` | Original file size in bytes                       |
| `_sv_hash` | SHA-256 integrity hash (Base64)                   |
| `_sv_exp`  | Optional expiration timestamp                     |

### 3.2 Self-Destructing Payloads

Messages with `_sv_exp` timestamps are cryptographically enforced — decryption is refused after expiry at the application layer.

### 3.3 File Integrity Shield

SHA-256 integrity hash verified with **constant-time comparison** (`constantTimeEqual`) — prevents both tampering detection and timing side-channel attacks.

### 3.4 Filename Sanitization

The `sanitizeFilename()` function strips:

- Path separators (`/`, `\`)
- Directory traversal (`..`)
- Null bytes and control characters (`\x00-\x1f`, `\x7f`)
- OS-reserved characters (`<`, `>`, `:`, `"`, `|`, `?`, `*`)
- Leading dots (hidden files)
- Truncates to 255 characters

---

## 4. 🧠 Memory & Buffer Hardening

| Function              | Buffers Zeroed                                             |
| --------------------- | ---------------------------------------------------------- |
| `encrypt()`           | `keyRaw`, `plaintextBytes` (via try/finally)               |
| `decrypt()`           | `keyRaw` (via try/finally on all paths)                    |
| `encryptAsymmetric()` | `symKey`, `combinedSecrets`, `shared1`, `shared2`          |
| `decryptAsymmetric()` | `symKey`, `combinedSecrets`, `shared1`, `shared2`          |
| `pqSign()`            | All WOTS+ secret keys, seed                                |
| `signData()`          | Private key buffer                                         |
| `secureZero()`        | Uses `sodium.memzero()` when available, `fill(0)` fallback |

---

## 5. 📋 Audit & Integrity Logging

Offline-only security event logger (`audit-logger.js`):

| Event               | Trigger                                            |
| ------------------- | -------------------------------------------------- |
| `KEY_GENERATED`     | New identity keypair created                       |
| `ENCRYPT_SUCCESS`   | Successful encryption (symmetric or asymmetric)    |
| `DECRYPT_SUCCESS`   | Successful decryption                              |
| `DECRYPT_FAILED`    | Failed decryption attempt                          |
| `INTEGRITY_FAIL`    | SHA-256 hash mismatch on decrypted file            |
| `UPDATE_BLOCKED`    | Update rejected due to integrity/signature failure |
| `UPDATE_APPLIED`    | Successful update applied                          |
| `WIPE_EXECUTED`     | Panic wipe triggered                               |
| `SIGNATURE_INVALID` | Manifest signature verification failed             |
| `ANOMALY_DETECTED`  | ≥5 failed decryptions within 60 seconds            |

- **Storage**: localforage (IndexedDB), max 500 entries, FIFO eviction
- **No Network**: All data stays local, never transmitted

---

## 6. 🔦 Steganography (Robust Threshold Encoding)

- Encrypted payloads hidden in image pixel data using **3-bit Threshold Encoding**.
- **Resilience**: Encodes one bit using the three least significant bits (bits 0-2) to survive browser-induced color shifts:
  - Bit `0` → `000` (value 0)
  - Bit `1` → `111` (value 7)
  - Extraction threshold: `intensity & 0x07 > 3` ? `1` : `0`.
- **Structural Robustness (V2 Format)**:
  - **Magic Header**: Every payload is prefixed with `VZSG` (4 bytes) for instant format identification.
  - **Length-Prefix**: A 32-bit big-endian integer defines the exact payload length, enabling deterministic extraction.
  - **Integrity Check**: A CRC32 checksum is appended to every payload and verified before decryption to detect bit-level corruption.
  - **Backward Compatibility**: Extraction automatically falls back to legacy delimiter-based searching (`|||END|||`) if the `VZSG` header is missing.
- **Large File Optimization**: Linear processing with index-based extraction ($O(N)$) prevents memory-intensive string searches even on megabyte-scale file payloads.
- **Alpha Stability**: Alpha channel forced to 255 to prevent premultiplication artifacts.
- **Format**: PNG output only.

---

## 7. 🌐 Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob:;
connect-src 'self';
worker-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
```

---

## 8. 📱 Progressive Web App

- **Service Worker** (`service-worker.js`): Cache-first for app shell, network-first for `version.json`
- **Offline-First**: Full functionality after initial load with no network required
- **Installable**: PWA manifest with platform-specific install guidance (iOS, Android, Desktop)
- **Update Flow**: Cache deletion → SW unregister → version reset → hard reload

---

> **Version**: 1.0.0
> **Status**: Production Ready
> **Environment**: Client-side (Local Only)
