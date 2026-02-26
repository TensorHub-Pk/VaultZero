# VaultZero GitHub Workflows Architecture

This document describes how the `.github/workflows/` should be structured to support the automated testing and security practices required for the OpenSSF Best Practices Gold Badge.

_Note: This is architectural documentation. Maintainers must implement actual `.yml` workflow files matching these descriptions to actively run on GitHub Actions._

## 1. Automated Testing Workflow (`testing.yml`)

To achieve the required 90% statement / 80% branch coverage and continuously integrate changes, this workflow should execute on:

- Every Pull Request targeting `main`.
- Every push to `main`.

### Required Steps:

1. **Checkout Code:** Use `actions/checkout@v4`.
2. **Setup Node.js:** Use `actions/setup-node@v4` with a pinned LTS version.
3. **Install Dependencies:** `npm ci` (using clean install from lockfile to guarantee reproducibility).
4. **Run Linter:** Execute frontend linting (e.g., `npm run lint`).
5. **Run Unit and Integration Tests:** Execute the test suite (e.g., `npm run test:coverage`).
6. **Upload Coverage Report:** Upload the test coverage report to a service like Codecov or Coveralls, which will be configured to fail the pipeline if the coverage drops below the required 90%/80% threshold.

## 2. Security Scanning Workflow (`security.yml`)

To meet vulnerability scanning requirements, this workflow should run daily or on every push to `main`.

### Required Steps:

1. **CodeQL SAST Analysis:** Use GitHub's native `github/codeql-action` to perform Static Application Security Testing on the JavaScript logic.
2. **Dependency Scanning:** Use Dependabot or `npm audit` integrated into the CI flow to fail on any High/Critical CVEs.
3. **Secret Scanning:** Verify no cryptographic material or API keys were accidentally committed.

## 3. Release generated Workflow (`release.yml`)

To facilitate traceable, reproducible builds mapped to strict versions, this workflow should execute only when a new SemVer Tag (`vX.Y.Z`) is pushed.

### Required Steps:

1. **Verify All Tests Pass:** Depend on the `testing.yml` outcomes.
2. **Build Application:** Produce a minified, deterministic production artifact of the `/app` directory.
3. **Publish GitHub Release:** Create an automated release draft containing the hashed artifacts and changelog for maintainer review.
