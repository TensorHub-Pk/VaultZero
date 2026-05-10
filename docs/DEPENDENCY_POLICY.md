# Dependency Policy

To minimize the attack surface, VaultZero maintains a very strict policy on third-party libraries.

## 🕵️ Vetting Process
Before adding any new dependency:
1.  **Audit**: The source code must be audited for backdoors or insecure patterns.
2.  **Size**: It must be minimal (no "kitchen sink" libraries).
3.  **Maturity**: Must be well-maintained and widely used in the security community (e.g., Libsodium).

## 🛡️ Monitoring and Updating
- **Weekly Scans**: Dependencies are scanned for CVEs using `npm audit` and Snyk.
- **Critical Fixes**: Any dependency with a "High" or "Critical" vulnerability must be updated or removed within 48 hours.
- **Freeze**: Major versions are frozen until a full review is performed.
