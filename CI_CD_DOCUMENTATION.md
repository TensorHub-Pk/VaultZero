# ![Logo](../app/assets/logo.png) Continuous Integration and Delivery (CI/CD)

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)

This document describes the continuous integration strategy used to automatically test, build, and verify VaultZero. This automated process is required by the OpenSSF Gold practices to ensure that changes are frequently integrated and tested.

## CI Workflow Architecture

Our CI runs automatically on all Pull Requests targeting the `main` branch, as well as on every direct push to `main`.

### Pipeline Overview

1. **Linting and Formatting Analysis:**
   - Ensures code style conforms to community standards (e.g., ESLint, Prettier).
   - This prevents easily avoidable bugs and syntactic errors.

2. **Static Application Security Testing (SAST):**
   - Source code is automatically scanned for common vulnerability patterns (e.g., hardcoded secrets, injection flaws) using tools like CodeQL or Sonarcloud. _(Note: Maintainers must manually configure these actions)._
   - The CI will fail immediately if high-severity issues are detected.

3. **Dependency Scanning:**
   - Scans lockfiles to verify that no libraries contain known CVEs exceeding our policy threshold (see `DEPENDENCY_POLICY.md`).

4. **Automated Unit & E2E Testing:**
   - Executes the automated test suite across supported browser engines.
   - Generates coverage reports and asserts that statement coverage > 90% and branch coverage > 80%.

5. **Build Generation:**
   - Packages the static assets and service worker correctly into a production-ready artifact to test for build reproducibility.

## Managing the CI Config

Modifications to the CI pipeline configuration (located in `.github/workflows/`) are subject to the same review process as source code and must be approved by an authorized [Maintainer](GOVERNANCE.md).
