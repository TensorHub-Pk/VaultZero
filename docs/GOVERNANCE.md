# Project Governance

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

- **Two-Factor Authentication (2FA) is MANDATORY** for all maintainers to make changes to the repository or access project infrastructure. The use of cryptographic hardware tokens (like YubiKey) or authenticator apps is preferred over SMS-based 2FA.
- Maintainers must securely manage any signing keys or credentials.

### List of Current Maintainers

_(Note: To meet OpenSSF Gold Requirements, there must be at least two people listed here, and at least two significant contributors must be unassociated/from different organizations.)_

1. [PLACEHOLDER_MAINTAINER_1_NAME] - ([PLACEHOLDER_MAINTAINER_1_GITHUB_LINK])
2. [PLACEHOLDER_MAINTAINER_2_NAME] - ([PLACEHOLDER_MAINTAINER_2_GITHUB_LINK])

## Decision Making Process

Decisions about the future of VaultZero are made through consensus among the Maintainers.

1. **Discussion:** Whenever possible, discussions should happen publicly via GitHub Issues or Discussions.
2. **Consensus:** The maintainers will attempt to reach a consensus on major architectural changes or feature additions.
3. **Voting:** In the rare case that consensus cannot be reached, a simple majority vote among the maintainers will decide the outcome.

## Adding New Maintainers

Contributors who show consistent, high-quality contributions, deep understanding of the project's cryptography and security goals, and excellent collaboration skills may be nominated to become maintainers.
Nominees must be approved by a 2/3 majority vote of the existing maintainers.
