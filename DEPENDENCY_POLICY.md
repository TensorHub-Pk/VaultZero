# Dependency Management Policy

To ensure the security, integrity, and stability of VaultZero, all dependencies (internal and external) are managed strictly according to this policy. This supports our compliance with the OpenSSF Best Practices Gold Badge requirements.

## Core Tenets

1.  **Minimize Dependencies:** VaultZero, as a security application relying on standard Web Crypto APIs, should minimize the use of third-party libraries. If functionality can be implemented securely running natively in the browser without reinventing complex crypto logic, native APIs should be strongly preferred over dependencies.
2.  **Pinned Versions:** All third-party libraries must have pinned, exact versions (e.g., in a lockfile) to maintain reproducible builds. We do not use range selectors (like `^` or `~`) for production builds.

## Monitoring and Updating

### Automated Vulnerability Scanning

All dependencies must be continuously scanned against known vulnerability databases (e.g., CVEs, NVD).

- **Tooling:** We employ tools such as `npm audit`, Dependabot (GitHub), or Snyk to alert maintainers to newly discovered vulnerabilities. _(Note: Maintainers MUST manually enable this integration in their CI system)._

### Updating Vulnerable Dependencies

1.  **Critical / High Severity:** Must be addressed (patched, updated, or temporarily disabled) within a maximum of 3 days. A rapid-patch release must be issued following the [Release Process](RELEASE_PROCESS.md).
2.  **Medium / Low Severity:** Must be addressed in the next planned release cycle.

### Evaluating New Dependencies

Before adding any new dependency to the `package.json` (or `libs/` directory if unmanaged), the requester must evaluate:

- The age and stability of the project.
- The responsiveness of the maintainers.
- The project's own security practices (does it have an OpenSSF badge?).
- The licensing compatibility (must be OSI-approved and permissive, matching MIT goals).
