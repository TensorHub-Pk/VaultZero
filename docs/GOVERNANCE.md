# ![Logo](../app/assets/logo.png) Project Governance

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)

The VaultZero project is committed to open, transparent, and distributed governance. This document outlines the roles, responsibilities, and decision-making processes for the project.

This governance model is designed to support our application for the **OpenSSF Best Practices Gold Badge**, ensuring a sustainable "bus factor" and shared responsibility.

## Roles and Responsibilities

### Contributors

A Contributor is anyone who has submitted a contribution to the project (e.g., code, documentation, bug reports). Contributors are the lifeblood of VaultZero.

**Requirements:**

- Must adhere to the [Code of Conduct](../CODE_OF_CONDUCT.md).
- Must follow the [Contributing Guidelines](../CONTRIBUTING.md).

### Maintainers

Maintainers are individuals who have broad write access to the repository and are responsible for the day-to-day operations and strategic direction of the project.

**To qualify for the OpenSSF Gold Badge, the project MUST have a "bus factor" of 2 or more, meaning at least two independent people must have the necessary access, rights, and knowledge to maintain the project.** Furthermore, the project must have at least two unassociated significant contributors.

**Responsibilities:**

- Reviewing and merging Pull Requests. **(Policy: No maintainer may merge their own PR without review from another individual.)**
- Triage and response to bug reports and feature requests.
- Enforcing the Code of Conduct.
- Releasing new versions of VaultZero.
- Maintaining the project's security posture.

**Security Requirements for Maintainers:**

- **MANDATORY 2FA:** The project **MUST** require two-factor authentication (2FA) for all developers and maintainers with write access to the main repository or sensitive data (such as private vulnerability reports). [require_2FA]
- **Secure 2FA Implementation:** To satisfy the [secure_2FA] requirement, 2FA **SHOULD** use cryptographic mechanisms to prevent impersonation. The project officially mandates the use of either **authenticator apps (TOTP)** or **hardware security keys (FIDO/WebAuthn)**. SMS-based 2FA is strictly discouraged and should only be used as a temporary last resort.
- Maintainers must securely manage any signing keys or credentials.

### List of Current Maintainers

_(Note: To meet OpenSSF Gold Requirements, there must be at least two people listed here, and at least two significant contributors must be unassociated/from different organizations.)_

1. [Muhammad Owais](https://github.com/Muhammad-Owais-1947) - Lead Architect
2. [TensorHub-Pk Contributors](https://github.com/TensorHub-Pk/VaultZero/graphs/contributors) - Community Maintainers

## Decision Making Process

Decisions about the future of VaultZero are made through consensus among the Maintainers.

1. **Discussion:** Whenever possible, discussions should happen publicly via GitHub Issues or Discussions.
2. **Consensus:** The maintainers will attempt to reach a consensus on major architectural changes or feature additions.
3. **Voting:** In the rare case that consensus cannot be reached, a simple majority vote among the maintainers will decide the outcome.

## Maintainers

Current Lead Maintainers:

- **[Muhammad Owais](https://github.com/Muhammad-Owais-1947)** (Lead Architect)
- **[TensorHub-Pk Contributors](https://github.com/TensorHub-Pk/VaultZero/graphs/contributors)** (Community Maintainers)

The project requires at least two unassociated significant contributors to maintain Gold status. A "significant contributor" is defined as an individual with at least 5 substantial PRs merged or who has maintained a major subsystem for over 3 months.

## Access Continuity and Succession

To ensure the project can continue if a maintainer is incapacitated (addressing the "bus factor"), VaultZero follows an access continuity plan:

1. **Shared Access:** Key administrative rights (GitHub repository settings, DNS management, and deployment secrets) are always shared between at least two unassociated maintainers.
2. **Emergency Access:** Credentials for critical infrastructure that cannot be shared natively are stored in a secure, offline "break-glass" location (e.g., a physical safety deposit box) accessible by a designated legal representative or a trusted second maintainer, as specified in the maintainers' personal succession plans.
3. **Repository Control:** In the event that all maintainers become unavailable, the project’s open governance model and MIT license allow the community to fork the project and continue development under new leadership.
4. **Contributor Diversity:** The project actively recruits maintainers from different organizations to ensure no single entity has total control.

A full list of all project contributors can be found at: [https://github.com/TensorHub-Pk/VaultZero/graphs/contributors](https://github.com/TensorHub-Pk/VaultZero/graphs/contributors)

## Adding New Maintainers

Contributors who show consistent, high-quality contributions, deep understanding of the project's cryptography and security goals, and excellent collaboration skills may be nominated to become maintainers.
Nominees must be approved by a 2/3 majority vote of the existing maintainers.
