<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — CI/CD PIPELINE</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Automated quality gates for every commit.</em>
</p>

---

## ⚙️ [OVERVIEW] PIPELINE STAGES
Our CI/CD pipeline runs automatically on every push and pull request to `main`. It enforces three primary quality gates:

### 1. Linting & Formatting
- **ESLint**: Strict mode — any warning on unsafe JS patterns or unused variables fails the build.
- **Prettier**: Enforces consistent code formatting across all files.

### 2. Static Application Security Testing (SAST)
- **CodeQL**: Deep static analysis for known vulnerability patterns.
- **Secret Scanning**: Prevents accidental commits of private keys or API credentials.
- **Vulnerability Scanning**: Targeted checks against `encryption.js` and cryptographic primitives.

### 3. Build & Integrity Verification
The pipeline runs `sign-updates.js` to regenerate the cryptographic manifest and verifies that all critical asset hashes are consistent. This gate will **fail** if any file has been modified without re-signing.

---

## 📋 [REQUIREMENTS] BRANCH PROTECTION
The `main` branch has the following protections enabled:
- **Required Status Checks**: All three pipeline stages must pass.
- **Signed Commits**: Every commit must be GPG-signed with key `4C5158A46046CE4C`.
- **No Force Pushes**: Rewriting history on `main` is disabled.

---

## 🔗 [MONITORING] VIEWING RESULTS
All pipeline results are public and auditable:
- **Actions Tab**: [github.com/TensorHub-Pk/VaultZero/actions](https://github.com/TensorHub-Pk/VaultZero/actions)
- **Security Tab**: Dependency vulnerability alerts and secret scanning results.

---

*Automated with zero-trust rigor by the VaultZero Team*
