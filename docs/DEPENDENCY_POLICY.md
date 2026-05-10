<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — DEPENDENCY POLICY</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Every dependency is a trust decision.</em>
</p>

---

## 🕵️ [VETTING] ADDING A NEW DEPENDENCY
Before adding any new library, all of the following criteria must be satisfied:

1.  **Source Audit**: The full source code must be reviewed for backdoors, insecure patterns, or telemetry.
2.  **Minimalism**: Must be a focused, minimal library — no "kitchen sink" frameworks.
3.  **Maturity**: Must be actively maintained and widely trusted in the security community (e.g., Libsodium).
4.  **Integrity**: The library must be hashable and includable in the signed manifest via `sign-updates.js`.
5.  **Offline-Compatible**: Must function entirely without a network connection once loaded.

---

## 📦 [APPROVED] CURRENT DEPENDENCY MANIFEST
All approved dependencies are cryptographically signed in `update-info.json`:

| Library | Purpose | Signed |
|-----------|-------------|-------|
| `libs/sodium.js` | ChaCha20-Poly1305 / Ed25519 via WASM | ✅ |
| `libs/argon2-bundled.min.js` | Memory-hard key derivation | ✅ |
| `libs/argon2.wasm` | Argon2id WASM binary | ✅ |
| `libs/kyber.js` | ML-KEM-768 post-quantum key exchange | ✅ |
| `libs/localforage.min.js` | Encrypted local storage abstraction | ✅ |

---

## 🛡️ [MONITORING] ONGOING SECURITY
- **Weekly CVE Scans**: All dependencies are scanned via `npm audit` and Snyk.
- **48-Hour SLA**: Any `High` or `Critical` vulnerability must be patched or removed within 48 hours.
- **Re-signing Required**: After any dependency update, `sign-updates.js` must be re-run to regenerate the manifest.
- **Major Version Freeze**: Major version upgrades are frozen until a full source re-audit is completed.

---

*Maintained with zero-trust principles by the VaultZero Team*
