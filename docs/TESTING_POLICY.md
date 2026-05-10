# Testing Policy

To maintain the high security standards of VaultZero, every release must pass a rigorous testing suite.

## Automated Testing Suite
We use a combination of unit, integration, and end-to-end tests:
1.  **Unit Tests**: Verifying individual cryptographic functions in `encryption.js`.
2.  **Integration Tests**: Ensuring the Service Worker and the Vault UI communicate correctly.
3.  **Dynamic Analysis**: Running the app through specialized security scanners to detect memory leaks or timing attacks.

### Enforcing Tests
- No pull request is merged without 100% pass rate on CI/CD.
- Critical code paths must have >95% test coverage.

## Manual Verification
Before every major release (vX.0.0), a manual "Cold-Boot" audit is performed:
1.  Install the app from scratch in a fresh browser profile.
2.  Perform a "First-Unlock" and "Data-Restore" cycle.
3.  Verify the integrity alert triggers manually by modifying a local file.

## Test Invocation
Developers can run the test suite locally using:
```bash
npm test
```
All results are documented in the [CI/CD Documentation](CI_CD_DOCUMENTATION.md).
