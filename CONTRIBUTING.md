# Contributing to VaultZero

First off, thank you for considering contributing to VaultZero! It's people like you that make VaultZero such a great tool.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Code of Conduct

This project and everyone participating in it is governed by the [VaultZero Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [PLACEHOLDER_FOR_CONDUCT_EMAIL].

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report for VaultZero. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

_If you find a closed issue that seems like it is the same thing that you're experiencing, open a new issue and include a link to the original issue._

**Do NOT report security vulnerabilities in public issues!** Please see our [Security Policy](SECURITY.md) for instructions on responsible disclosure.

When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title.
- Describe the exact steps which reproduce the problem in as many details as possible.
- Provide specific examples to demonstrate the steps.
- Describe the behavior you observed after following the steps and point out what exactly is the problem with that behavior.
- Explain which behavior you expected to see instead and why.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- Use a clear and descriptive title for the issue to identify the suggestion.
- Provide a step-by-step description of the suggested enhancement.
- Explain why this enhancement would be useful to most VaultZero users.

### Pull Requests

The process described here has several goals:

- Maintain VaultZero's quality.
- Fix problems that are important to users.
- Engage the community in working toward the best possible VaultZero.
- Enable a sustainable system for VaultZero's maintainers to review contributions.

Please follow these steps to have your contribution considered by the maintainers:

1.  **Fork the repository** and create your branch from `main`.
2.  **Ensure code quality**: Include tests if you add code that should be tested (refer to our [Testing Policy](docs/TESTING_POLICY.md)).
3.  **Document your changes**: Update the documentation in the `/docs` or `/app` directory if you change functionality.
4.  **Open an Issue**: Ensure there is an issue open that your PR addresses.
5.  **Submit the PR**: Describe what your PR changes, how to test it, and link the related issue. Wait for review. Since we target the OpenSSF Gold Badge, **at least one other person MUST review and approve your PR before it can be merged.**

**Important Note for Maintainers:** ALL pull requests must be reviewed by a developer other than the author prior to merging (OpenSSF Gold requirement). Maintainers must enforce this policy strictly.

## Setup for Local Development

To set up your local environment:

1. Clone your fork: `git clone https://github.com/[YOUR_USERNAME]/VaultZero.git`
2. We recommend serving the `app/` directory via a local HTTP server such as `npx serve app/` to avoid CORS issues with the Web Crypto API on `file://` protocols.
3. Keep your fork synced with the upstream repository.
