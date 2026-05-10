<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — RELEASE PROCESS</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Every release is a promise, sealed in cryptography.</em>
</p>

---

## ✅ [CHECKLIST] PRE-RELEASE REQUIREMENTS
Before any release can be finalized, **all** of the following must be satisfied:

- [ ] All CI/CD checks are green (linting, SAST, integrity)
- [ ] Manual "Cold-Boot" audit completed successfully
- [ ] No `High` or `Critical` CVEs found in dependencies in the last 60 days
- [ ] `update-info.json` version field synchronized with the intended release tag
- [ ] Deep Integrity Scan passes with zero mismatches
- [ ] Repair flow and Security Alert flow tested in a clean browser profile

---

## 🔐 [SIGNING] CRYPTOGRAPHIC FINALIZATION
The release is sealed by the lead maintainer using a two-layer signing process:

### Layer 1 — Internal Manifest (Ed25519)
```powershell
node "For dev/internal-tools/sign-updates.js"
```
This hashes all critical assets and signs the manifest with our **Ed25519** private key. The public key is pinned in `app.js`.

### Layer 2 — Release Bundle (GPG)
1.  Generate SHA256 checksums for all release files.
2.  Apply a **Cleartext GPG Signature** to `CHECKSUMS.txt` using key `4C5158A46046CE4C`.
3.  Upload the `.zip` and `CHECKSUMS.txt.asc` as GitHub Release Assets.

---

## 🚀 [AUTOMATION] ONE-CLICK RELEASE ENGINE
The `publish.ps1` script automates the entire lifecycle:
```powershell
".\For dev\publish.ps1"
```
**What it does automatically:**
1. Prompts for the new version number and updates `update-info.json`
2. Runs `sign-updates.js` to refresh the internal integrity manifest
3. Packages production files into a release `.zip` (excluding dev tools)
4. Generates SHA256 checksums for all assets
5. Applies the GPG cleartext signature
6. Offers to commit the version bump and create the signed Git tag

---

## 📢 [PUBLISH] GITHUB RELEASE WORKFLOW
1.  Push the signed tag: `git push origin v[VERSION]`
2.  Go to **GitHub → Releases → Draft a new release**
3.  Select the `v[VERSION]` tag
4.  Paste the release notes from `CHANGELOG.md`
5.  Upload `VaultZero-[VERSION].zip` and `CHECKSUMS.txt.asc`
6.  Check **"Set as latest release"** and click **Publish**

---

*Maintained with absolute integrity by the VaultZero Security Team*
