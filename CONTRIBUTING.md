# ![Logo](app/assets/logo.png) Contributing to VaultZero

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)

First off, thank you for considering contributing to VaultZero! It's people like you that make VaultZero such a great tool.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Code of Conduct

This project and everyone participating in it is governed by the [VaultZero Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [PLACEHOLDER_FOR_CONDUCT_EMAIL].

## How Can I Contribute?

### Finding Tasks for New Contributors

We welcome new contributors! To find small, manageable tasks to get started with, look for issues labeled [`good-first-issue`](https://github.com/TensorHub-Pk/VaultZero/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22). These tasks are designed to be completed with minimal context and serve as a great introduction to the codebase.

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

### Contribution Standards

- **Accessibility:** Ensure UI contributions follow semantic HTML guidelines and WCAG 2.1 Level AA standards where possible. All interactive elements must be keyboard-navigable and compatible with screen readers.
- **Internationalization:** While the project is currently in English, we aim for easy localization. Avoid hardcoding text strings in the functional logic; prefer a centralized dictionary approach if adding user-facing text.
- **Code Style:** Follow the established patterns in the repository. Use clear, descriptive variable names and provide comments for complex cryptographic logic.

**Important Note for Maintainers:** ALL pull requests must be reviewed by a developer other than the author prior to merging (OpenSSF Gold requirement). Please refer to our documented [Code Review Standards](docs/CODE_REVIEW_STANDARDS.md) for detailed requirements and checklists. Maintainers must enforce this policy strictly.

### Developer Certificate of Origin (DCO)

To improve the tracking of contributions and ensure legal clarity, VaultZero requires that all contributions be accompanied by a "Sign-off" statement. By adding `Signed-off-by: Real Name <email@address.com>` to your commit messages, you certify that you have the right to submit the code under the project's license.

For more information, visit [developercertificate.org](https://developercertificate.org/).

## Setup for Local Development

To set up your local environment:

1. Clone your fork: `git clone https://github.com/[YOUR_USERNAME]/VaultZero.git`
2. We recommend serving the `app/` directory via a local HTTP server such as `npx serve app/` to avoid CORS issues with the Web Crypto API on `file://` protocols.
3. Keep your fork synced with the upstream repository.
