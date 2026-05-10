<p align="center">
  <img src="../app/assets/logo.png" alt="VaultZero Logo" width="100">
  <h1 align="center">Automated Testing Policy</h1>
  <p align="center">
    <strong>Verifying Security through Continuous Validation</strong><br>
    <a href="https://www.bestpractices.dev/projects/12040"><img src="https://www.bestpractices.dev/projects/12040/badge" alt="OpenSSF Best Practices"></a>
  </p>
</p>

---

## 🏛️ Strategic Regimen
A rigorous testing Regimen is mandatory to ensure the functional security of the VaultZero engine and to maintain our **OpenSSF Best Practices Gold Badge** status.

## 📊 Coverage Requirements
The project enforces strict mathematical thresholds for all code modifications:
- **Statement Coverage**: At least **90%** of all application statements.
- **Branch Coverage**: At least **80%** of all logical branches.

Pull Requests that lower these thresholds will be automatically rejected by the CI pipeline.

## 🧪 Testing Methodology

### 1. Unit Testing
Validation of individual cryptographic functions and UI components in isolation.
- **Target**: `encryption.js`, `security-logs.js`.
- **Focus**: Algorithmic correctness and error boundary handling.

### 2. Integration Testing
Verification of component interactions within the browser environment.
- **Target**: `app.js`.
- **Focus**: State transitions and asynchronous flow coordination.

### 3. End-to-End (E2E) Testing
Full simulation of the user journey in a headless browser environment.
- **Target**: Full Application Shell.
- **Focus**: Offline installation, Service Worker lifecycle, and cross-tab synchronization.

## 🛡️ Enforcement & CI Integration
- **Zero-Bypass Policy**: No security or cryptographic logic can be merged without corresponding tests.
- **Regression Guard**: All legacy tests are executed on every commit to prevent functional regressions.
- **Automated Rejection**: The CI pipeline is the primary gatekeeper for code quality.

---
<p align="center">
  <b>VaultZero: Security is a verified property, not an assumption.</b>
</p>
