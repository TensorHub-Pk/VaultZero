<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — REPRODUCIBLE BUILDS</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Cryptographic transparency from source to release.</em>
</p>

---

## 🏗️ [ENVIRONMENT] BUILD REQUIREMENTS
To ensure a consistent, reproducible build:

| Requirement | Specification |
|-----------|-------------|
| **OS** | Ubuntu 22.04 LTS (or equivalent via Docker) |
| **Node.js** | v18.x LTS |
| **Shell** | PowerShell 7+ (for `publish.ps1`) |
| **GPG** | GnuPG with key `4C5158A46046CE4C` configured |

---

## 🛠️ [PROCESS] REPRODUCING A RELEASE
1.  **Clone the tag**: `git checkout v[VERSION]`
2.  **Verify commit signature**: `git verify-commit HEAD`
3.  **Sign the manifest**: `node "For dev/internal-tools/sign-updates.js"`
4.  **Run the release pipeline**: `".\For dev\publish.ps1"`
5.  **Compare checksums**: The SHA256 of the resulting ZIP must match `CHECKSUMS.txt`.

---

## 📦 [VERIFY] CHECKING THE RELEASE BUNDLE
Users can independently verify the release integrity:

```bash
# Verify the ZIP checksum
certutil -hashfile VaultZero-[VERSION].zip SHA256

# Verify the GPG signature
gpg --verify CHECKSUMS.txt.asc CHECKSUMS.txt
```

The checksum output must be **identical** to the value signed by GPG key `4C5158A46046CE4C`.

---

## 🛡️ [DIGITAL FORTRESS] DEEP INTEGRITY VERIFICATION
Every official release is also protected by a cryptographically-signed `update-info.json` manifest. The application itself will verify all critical file hashes on startup using **Ed25519** signatures.

---

*Maintained with absolute transparency by the VaultZero Team*
