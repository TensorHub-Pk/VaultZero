<p align="center">
  <img src="../app/assets/logo.png" alt="VaultZero Logo" width="100">
  <h1 align="center">Cryptographic & Security Architecture</h1>
  <p align="center">
    <strong>Zero-Knowledge. Post-Quantum. Distributed.</strong><br>
    <a href="https://www.bestpractices.dev/projects/12040"><img src="https://www.bestpractices.dev/projects/12040/badge" alt="OpenSSF Best Practices"></a>
  </p>
</p>

---

## 🏛️ Architectural Overview
VaultZero v3.0.0 is a **Zero-Knowledge, Offline-First** security ecosystem. It operates on the principle that the server is an untrusted host, and all cryptographic operations must occur within the user's isolated local environment.

---

## 1. 🔍 Cryptographic Primitives

### 1.1 Symmetric Encryption (Data-at-Rest)
The core vault uses **AES-256-GCM** via the Web Crypto API for hardware-accelerated, authenticated encryption.
- **KDF**: `Argon2id` (Iter: 3, Mem: 64MB, Parallel: 1) is used for all PIN and password-based key derivation.
- **Integrity**: Every payload includes a SHA-256 hash verified with **constant-time comparison** to prevent side-channel attacks.

### 1.2 Asymmetric Encryption (Secure Share)
Secure communication uses a **Hybrid-PQC** model to protect against current and future threats.
- **Classical**: `X25519` (ECDH) for high-speed classical key exchange.
- **Post-Quantum**: `ML-KEM-768` (Kyber) for quantum-resistant key encapsulation.
- **Key Blending**: BLAKE2b is used to derive a unified 256-bit symmetric key from both classical and quantum shared secrets.

### 1.3 Digital Identities & Signatures
- **Identity**: `Ed25519` provides non-repudiable digital signatures for messages and payloads.
- **WOTS+**: Winternitz One-Time Signatures (WOTS+) offer a purely hash-based signature layer as a post-quantum fallback.

---

## 2. 📡 Pulse Synchronization Mesh
A zero-knowledge coordination layer for multi-tab and multi-device state management.
- **Encrypted Pulse**: All data is AES-encrypted with the Master PIN before transmission to the anonymous relay.
- **State Merging**: Uses cryptographically signed timestamps to resolve conflicts in a "Latest Wins" strategy.
- **Isolation**: The relay never sees plaintext data or metadata; it acts solely as an ephemeral message bus.

---

## 🛡️ 3. System Integrity: Live Guard Sentinel
Continuous background monitoring ensures the environment has not been tampered with.
- **Deep Scanning**: The app physically downloads and re-hashes core files (`app.js`, `encryption.js`) every 60 seconds.
- **TUF Compliance**: Every update manifest is signed with a private maintainer key and verified against a hardcoded public key pinning.
- **Freeze/Rollback Shield**: The system rejects manifests with stale timestamps or version numbers lower than the `max_seen_version`.

---

## 🧪 4. Memory & Buffer Hardening
- **Transient Memory**: Unlocked private keys are held in volatile memory and purged via `crypto.getRandomValues()` after 120 seconds.
- **WASM Isolation**: Cryptographic primitives execute in isolated WASM linear memory, preventing JavaScript-based buffer introspection.
- **Secure Zeroing**: Sensitive buffers are manually zeroed immediately after use to prevent memory-scraping artifacts.

---

## 🖼️ 5. Steganographic Shield
A 3-bit threshold encoding engine for concealing encrypted payloads within image carriers.
- **Format**: PNG-only with forced alpha stability.
- **Magic Headers**: Payloads are prefixed with `VZSG` and a CRC32 checksum for deterministic, tamper-evident extraction.

---
<p align="center">
  <b>VaultZero: Security through mathematical certainty.</b>
</p>
