<p align="center">
  <img src="../app/assets/logo.png" alt="VaultZero Logo" width="100">
  <h1 align="center">OpenSSF Gold Badge Checklist</h1>
  <p align="center">
    <strong>Criteria Mapping & Compliance Tracking</strong><br>
    <a href="https://www.bestpractices.dev/projects/12040"><img src="https://www.bestpractices.dev/projects/12040/badge" alt="OpenSSF Best Practices"></a>
  </p>
</p>

---

## 🏛️ Strategic Alignment
This document maps VaultZero's engineering practices against the **OpenSSF Best Practices Badge (Gold Tier)** criteria. It serves as a living audit trail for project maintainers.

---

## 1. Governance & Oversight

| Criterion | Description | Evidence Location | Status |
| :--- | :--- | :--- | :--- |
| **Bus Factor >= 2** | Minimum 2 maintainers with repository access. | [GOVERNANCE.md](../docs/GOVERNANCE.md) | 🟡 Pending |
| **Independent Contributors** | Significant contributions from unassociated entities. | Project History | 🟡 Pending |
| **Two-Person Review** | 50%+ of changes must be peer-reviewed. | [CONTRIBUTING.md](../CONTRIBUTING.md) | ✅ Active |

## 2. Licensing & Copyright

| Criterion | Description | Evidence Location | Status |
| :--- | :--- | :--- | :--- |
| **License Present** | OSI-approved license must be included. | [LICENSE](../LICENSE) | ✅ MIT Applied |
| **Copyright Identifiers** | Core source files must identify the holder. | Source Headers | ✅ Applied |

## 3. Security & Change Control

| Criterion | Description | Evidence Location | Status |
| :--- | :--- | :--- | :--- |
| **Mandatory 2FA** | 2FA required for all maintainers with write access. | GitHub Settings | ✅ Enforced |
| **Vulnerability Disclosure** | Documented responsible disclosure process. | [SECURITY.md](../SECURITY.md) | ✅ Active |
| **Code Review Policy** | Documented standards for peer review. | [CONTRIBUTING.md](../CONTRIBUTING.md) | ✅ Active |
| **Security Audit** | Internal or external audit of the crypto engine. | [Audit Report] | 🟡 Scheduled |

## 4. Quality & Verification

| Criterion | Description | Evidence Location | Status |
| :--- | :--- | :--- | :--- |
| **High Test Coverage** | 90% Statement / 80% Branch coverage. | [TESTING_POLICY.md](../docs/TESTING_POLICY.md) | 🟡 Target |
| **Reproducible Build** | Verifiable, bit-for-bit identical outputs. | [REPRODUCIBLE_BUILD.md](../docs/REPRODUCIBLE_BUILD.md) | ✅ Active |
| **SAST/DAST** | Automated static & dynamic security analysis. | GitHub Workflows | ✅ Enforced |

---

## 🚀 Priority Roadmap for Gold Compliance

1.  **Engineering**: Finalize testing suite to reach 90% coverage threshold.
2.  **Governance**: Expand maintainer group to satisfy Bus Factor requirements.
3.  **Auditing**: Conduct formal internal review of the v3.0 Pulse Engine implementation.

---
<p align="center">
  <b>VaultZero: Commitment to the highest standards of open security.</b>
</p>
