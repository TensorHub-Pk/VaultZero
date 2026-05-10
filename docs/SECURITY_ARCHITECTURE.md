<p align="center">
  <img src="app/assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — ARCHITECTURE</h3>
<p align="center">
  <img src="app/assets/pulse.svg" width="12" /> <em>Cryptographic excellence at every layer.</em>
</p>

---

## 🛡️ [CRYPTO] CORE PRIMITIVES
VaultZero uses industry-standard, high-performance, and peer-reviewed primitives:

| Layer | Algorithm | Feature |
|-----------|-------------|-------------|
| **Symmetric** | ChaCha20-Poly1305 | IETF Standard, high performance on mobile |
| **KDF** | Argon2id | Memory-hard, resistant to GPU attacks |
| **Asymmetric** | ML-KEM-768 (Kyber) | NIST Post-Quantum Standard |
| **Signatures** | Ed25519 / ML-DSA | High-speed and quantum-resistant |

---

## 🚀 [DESIGN] ZERO-KNOWLEDGE
> *"Your password is the only key—and only you hold it."*

The master password is never sent to any server. All encryption and decryption happen exclusively in the browser's memory using `WebCrypto` and `libsodium.js`.

### ⚡ Signed Update Verification
The Service Worker acts as a gatekeeper, verifying the cryptographic signature of the `update-info.json` manifest before allowing any code update to execute.

---

*Verified by the VaultZero Security Intelligence Team*
