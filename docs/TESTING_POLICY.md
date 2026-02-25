# Testing Policy

A rigorous testing regimen is mandatory to achieve and maintain our OpenSSF Gold Badge and ensure the functional security of VaultZero.

## Automated Testing Suite

All modifications to VaultZero's logic, particularly in `/app/encryption.js` and `/app/app.js`, must be accompanied by corresponding automated tests.

### Coverage Requirements

To comply with OpenSSF Gold practices, the project enforces strict coverage minimums:

- **Statement Coverage:** At least **90%** of all statements in the application must be covered by automated tests.
- **Branch Coverage:** At least **80%** of all logical branches must be covered by automated tests.

### Testing Framework

_(Placeholder for Framework: e.g., Jest, Mocha/Chai, or Playwright for E2E)._

Tests are organized into directories mapping to the code they verify.

1. **Unit Tests:** Verify individual functions (like crypto wrappers or UI formatters).
2. **Integration Tests:** Verify how components interact (e.g., clicking the Encrypt button and validating the output).
3. **End-to-End (E2E) Tests:** Verify the complete offline installation flow and UI integration, typically executed in a headless browser via CI.

## Enforcing Tests

Our CI pipeline (see [CI CD Documentation](CI_CD_DOCUMENTATION.md)) is configured to reject any Pull Request that:

1. Lowers the overall code coverage below the required thresholds.
2. Contains failing tests.

There are **NO exceptions** for bypassing tests, especially for security or cryptographic logic.

## Manual Testing

While automated testing is robust, changes impacting the User Experience, Progressive Web App installability on physical devices, and Service Worker caching must also be manually tested across major browsers (Chrome, Safari, Firefox) on desktop and mobile prior to release.
