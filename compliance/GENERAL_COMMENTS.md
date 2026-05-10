<p align="center">
  <img src="../app/assets/logo.png" alt="VaultZero Logo" width="100">
  <h1 align="center">Project Compliance & Governance</h1>
  <p align="center">
    <strong>OpenSSF Gold Badge Alignment Report</strong><br>
    <a href="https://www.bestpractices.dev/projects/12040"><img src="https://www.bestpractices.dev/projects/12040/badge" alt="OpenSSF Best Practices"></a>
  </p>
</p>

---

## 🏛️ Foundational Security Tenets
VaultZero is built on the principle of **Zero-Knowledge, Local-First** execution. Our objective is to deliver an accessible, high-performance cryptographic suite that guarantees data sovereignty.

## 🛡️ 1. Zero-Knowledge Architecture
All cryptographic operations execute exclusively within the user's browser via the native Web Crypto API. As an installable **Progressive Web App (PWA)**, VaultZero provides an air-gapped environment that eliminates server-side risks such as SSRF, injection, and data-in-transit interception.

## 🏗️ 2. Structural Integrity & Segregation
We enforce a rigid boundary between the production runtime and development tooling:
- **Production Shell (`/app`)**: Contains only the audited HTML, CSS, JavaScript, and WASM required for client-side execution.
- **Maintenance Core (`/internal-tools`)**: Securely houses signing scripts and private keys. This directory is strictly excluded from all public distributions and version control via `.gitignore`.

## ⛓️ 3. Supply Chain Hardening
VaultZero minimizes external dependencies by prioritizing native browser APIs.
- **Audited Primitives**: Third-party libraries (Argon2id, Kyber) are locked, audited, and served as static, verifiable blobs.
- **Zero-Backend Model**: The absence of a complex server-side Node.js environment fundamentally reduces the project's supply chain attack surface.

## ⚖️ 4. Governance & Open Trust
To maintain our OpenSSF Gold status, we enforce strict engineering governance:
- **Two-Person Rule**: No code can be merged without independent peer review.
- **Multi-Factor Authentication**: Mandatory 2FA for all maintainers with write access.
- **Quality Benchmarks**: Continuous enforcement of **90% statement coverage** across the testing suite.

---
<p align="center">
  <b>VaultZero: Trust is earned through transparent engineering.</b>
</p>
