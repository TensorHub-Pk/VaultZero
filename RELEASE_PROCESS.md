<p align="center">
  <img src="../app/assets/logo.png" alt="VaultZero Logo" width="100">
  <h1 align="center">Release Lifecycle Management</h1>
  <p align="center">
    <strong>Traceable. Secure. Reproducible.</strong><br>
    <a href="https://www.bestpractices.dev/projects/12040"><img src="https://www.bestpractices.dev/projects/12040/badge" alt="OpenSSF Best Practices"></a>
  </p>
</p>

---

## 🏛️ Standard Operating Procedure
This document outlines the mandatory protocol for releasing new versions of VaultZero. Adherence ensures cryptographic traceability and compliance with **OpenSSF Gold** standards.

## 📋 1. Pre-Release Verification
Before a release can be authorized, the following conditions must be met:
- **CI Status**: All automated tests must pass on the target branch.
- **Coverage Audit**: Statement coverage > 90%, Branch coverage > 80%.
- **Vulnerability Check**: Zero known high/critical CVEs in the dependency tree.
- **Manifest Preparation**: `update-info.json` must be prepared and signed.

## ✍️ 2. Technical Documentation (Changelog)
Release notes must clearly categorize changes into:
- **💎 New Features**
- **🛡️ Security Updates** (Must reference CVE/GHSA IDs if applicable)
- **🐛 Bug Fixes**
- **⚠️ Breaking Changes**

## 🏗️ 3. Execution & Signing
1. **Version Bump**: Update `app_version` in `app.js` and `update-info.json`.
2. **Tagging**: Create an annotated SemVer tag (e.g., `git tag -a v3.0.0`).
3. **Artifact Signing**: Run `node "For dev/internal-tools/sign-updates.js"` to generate the cryptographic manifest signature.
4. **Publication**: Push the tag and create the formal release artifact on the distribution platform.

## 🏁 4. Post-Release Validation
- **Deployment Audit**: Verify the static app is correctly served over TLS 1.2+.
- **Update Propagation**: Confirm the Service Worker correctly detects and notifies users of the new version.
- **Community Announcement**: Notify the user base via official channels.

---
<p align="center">
  <b>VaultZero: Every release is a new milestone in privacy.</b>
</p>
