# OpenSSF Best Practices Badge - Gold Criteria Mapping

This checklist maps the specific requirements for the OpenSSF Best Practices Badge (extending up to the Gold tier) to the corresponding artifacts, policies, and manual configurations required within the VaultZero project.

_Maintainers must replace the `[PLACEHOLDER]` tags once the respective actions have been taken._

---

## 1. Project Oversight and Contributor Management

| Criterion                    | Description                                                                   | Documentation/Location                 | Status / Evidence                                                                                                       |
| :--------------------------- | :---------------------------------------------------------------------------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Bus factor >= 2**          | Project must have at least 2 people able to manage and access the repository. | [GOVERNANCE.md](../docs/GOVERNANCE.md) | **[MANUAL_ACTION_REQUIRED]** Need to add a second maintainer with write/manager access.                                 |
| **Independent Contributors** | Must have at least two unassociated significant contributors.                 | [GOVERNANCE.md](../docs/GOVERNANCE.md) | **[MANUAL_ACTION_REQUIRED]** Ensure diverse contribution beyond a single team.                                          |
| **Two-Person Review**        | >=50% of modifications must be reviewed by another individual before merging. | [CONTRIBUTING.md](../CONTRIBUTING.md)  | **[MANUAL_ACTION_REQUIRED]** GitHub Branch Protection must be configured to require at least 1 approving review on PRs. |

## 2. Licensing and Copyright

| Criterion                | Description                                                         | Documentation/Location | Status / Evidence                                                                            |
| :----------------------- | :------------------------------------------------------------------ | :--------------------- | :------------------------------------------------------------------------------------------- |
| **License Present**      | Source files/project must be licensed with an OSI-approved license. | [LICENSE](../LICENSE)  | **Completed**. MIT License applied.                                                          |
| **Copyright Statements** | Source files must identify the copyright holder.                    | [LICENSE](../LICENSE)  | **[MANUAL_ACTION_REQUIRED]** Need to ensure copyright headers are appended to core JS files. |

## 3. Change Control and Security

| Criterion                           | Description                                                         | Documentation/Location                 | Status / Evidence                                                                                  |
| :---------------------------------- | :------------------------------------------------------------------ | :------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **Two-Factor Authentication (2FA)** | Developers MUST use 2FA to make changes or access the central repo. | [GOVERNANCE.md](../docs/GOVERNANCE.md) | **[MANUAL_ACTION_REQUIRED]** GitHub org/repo settings must strictly require 2FA for all members.   |
| **Responsible Disclosure**          | Must publish a process for reporting vulnerabilities securely.      | [SECURITY.md](../SECURITY.md)          | **[MANUAL_ACTION_REQUIRED]** Update placeholder email and add maintainer PGP keys.                 |
| **TLS/HTTPS Enforcement**           | Website and downloads must require TLS >= 1.2.                      | Application Infrastructure             | **[MANUAL_ACTION_REQUIRED]** Ensure hosting provider enforces HSTS and modern TLS.                 |
| **Code Review Documented**          | Project documents what must be checked during code review.          | [CONTRIBUTING.md](../CONTRIBUTING.md)  | **Completed**. Guidelines documented.                                                              |
| **Security Review/Audit**           | Project needs to undergo an internal or external security audit.    | `N/A`                                  | **[MANUAL_ACTION_REQUIRED]** Request/perform an audit.                                             |
| **Hardened Infrastructure**         | Repository and site must employ hardening mechanisms.               | `N/A`                                  | **Completed**. Hosted on GitHub. App runs client-side explicitly avoiding server-side logic flaws. |

## 4. Quality and Testing

| Criterion                       | Description                                                                | Documentation/Location                                   | Status / Evidence                                                                      |
| :------------------------------ | :------------------------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Automated Testing Suite**     | Comprehensive automated tests must run for the application.                | [TESTING_POLICY.md](../docs/TESTING_POLICY.md)           | **[MANUAL_ACTION_REQUIRED]** A testing framework (e.g., Jest) needs to be implemented. |
| **Continuous Integration (CI)** | Code changes frequently integrated and automated tests are run on PRs.     | [CI_CD_DOCUMENTATION.md](../docs/CI_CD_DOCUMENTATION.md) | **[MANUAL_ACTION_REQUIRED]** Create `.yml` workflow matching the architecture doc.     |
| **High Test Coverage**          | Statements >= 90%, Branches >= 80% coverage.                               | [TESTING_POLICY.md](../docs/TESTING_POLICY.md)           | **[MANUAL_ACTION_REQUIRED]** Write tests to meet these strict thresholds.              |
| **Reproducible Build**          | The build process produces verifiable exact outputs given the same source. | [REPRODUCIBLE_BUILD.md](../docs/REPRODUCIBLE_BUILD.md)   | **Completed**. Documented how strict static assets are reproducible.                   |
| **Linter / SAST Integration**   | Code must be scanned for vulnerabilities and style statically.             | [CI_CD_DOCUMENTATION.md](../docs/CI_CD_DOCUMENTATION.md) | **[MANUAL_ACTION_REQUIRED]** Integrate ESLint and CodeQL to the CI pipeline.           |

## 5. Dependency Management

| Criterion                        | Description                                               | Documentation/Location                               | Status / Evidence                                                                  |
| :------------------------------- | :-------------------------------------------------------- | :--------------------------------------------------- | :--------------------------------------------------------------------------------- |
| **Known Vulnerability Scanning** | Monitor dependencies for known high/crit vulnerabilities. | [DEPENDENCY_POLICY.md](../docs/DEPENDENCY_POLICY.md) | **[MANUAL_ACTION_REQUIRED]** Enable GitHub Dependabot alerts and security updates. |

---

## Summary of Manual Actions Required for Gold Compliance

While the documentation framework is now complete, the following technical/administrative actions MUST be taken by the VaultZero maintainers to fully qualify for the Gold badge:

1. **GitHub Repository Settings:**
   - Enable branch protection rules on `main` requiring at least 1 approving reviewer.
   - Enforce Two-Factor Authentication (2FA) for all repository members.
   - Enable Dependabot and CodeQL Security Scanning.
2. **Community Building:**
   - Recruit a second maintainer and ensure contributions come from >1 independent entity.
3. **Engineering Implementation:**
   - Implement the actual testing framework (e.g., Jest/Cypress) and write tests until 90% statement/80% branch coverage is achieved.
   - Implement the CI/CD `.github/workflows/*.yml` files based on the architecture documentation.
   - Ensure TLS 1.2+ is strictly enforced wherever the static app is hosted.
4. **Documentation Updates:**
   - Replace the `[PLACEHOLDER]` fields in `SECURITY.md` (Contact email, PGP keys), `README.md` (Badge URLs), `CODE_OF_CONDUCT.md` (Contact email), and `GOVERNANCE.md` (Maintainer names).
