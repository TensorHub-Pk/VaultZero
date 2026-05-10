<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — SECURITY ARCHITECTURE</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Cryptographic excellence at every layer.</em>
</p>

---

## 🛡️ [CRYPTO] CORE PRIMITIVES
VaultZero uses industry-standard, peer-reviewed cryptographic primitives:

| Layer | Algorithm | Notes |
|-----------|-------------|-------------|
| **Symmetric Encryption** | ChaCha20-Poly1305 | IETF Standard via Libsodium WASM |
| **Symmetric Fallback** | AES-256-GCM | Hardware-accelerated via WebCrypto API |
| **Key Derivation** | Argon2id | Memory-hard (t=3, 64MB), resistant to GPU attacks |
| **KDF Fallback** | PBKDF2-SHA256 | 600,000 iterations |
| **Key Exchange** | X25519 + ML-KEM-768 | Hybrid classical/post-quantum |
| **Signatures (Classical)** | Ed25519 | Update manifests and identity verification |
| **Signatures (PQ)** | WOTS+ / Merkle | Hash-based, SHA-256, quantum-resistant |

---

## 🚀 [DESIGN] ZERO-KNOWLEDGE ARCHITECTURE
> *"Your password is the only key — and only you hold it."*

The master password is never sent to any server. All encryption and decryption happen exclusively in the browser's memory using `WebCrypto` and `libsodium.js`. Keys are zeroed from memory after every operation.

---

## 🏔️ [DIGITAL FORTRESS] RUNTIME INTEGRITY
The **Digital Fortress** pipeline is a multi-layered self-protection system active on every startup:

### 1. Signed Manifest Verification (TUF)
The `update-info.json` manifest is signed with **Ed25519**. The app verifies this signature against a pinned public key on every load. Expired or replayed manifests are rejected.

### 2. Deep File Integrity Scan
After signature verification, the app performs a live hash comparison of all critical assets against the signed manifest:

```
app.js · encryption.js · service-worker.js
image-hide.js · security-logs.js
libs/localforage.min.js · libs/sodium.js
libs/argon2-bundled.min.js · libs/kyber.js
```

### 3. Two-Path Response
- **Valid Signature + Hash Mismatch** → `Secure Sync` (Repair) modal shown
- **Invalid Signature + Hash Mismatch** → Immediate `Security Alert` + optional Isolation Mode

---

## 🛸 [ISOLATION] AIRGAP MODE
When active, Isolation Mode overrides all browser networking APIs:
- `fetch` / `XMLHttpRequest` / `WebSocket` / `EventSource` / `sendBeacon`
- All background syncs, cloud pulses, and update checks are halted
- State is persisted across page reloads via `localforage`

---

## 🌐 [NETWORK] PULSE SYNC
Cross-device vault synchronization uses an anonymous relay (`ntfy.sh`) with zero-knowledge payloads. The relay never sees plaintext data — only encrypted blobs.

- **Cloud Tombstones**: Permanently retire a Vault ID across all devices
- **Wipe Signals**: Trigger remote data destruction on all linked sessions

---

*Verified by the VaultZero Security Intelligence Team*
