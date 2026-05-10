# Code Review Standards

VaultZero enforces rigorous code review for all modifications to the codebase to ensure security, performance, and reliability. This document outlines the requirements and processes for conducting code reviews, as mandated for the **OpenSSF Gold Badge**. [code_review_standards]

## Review Requirements

Every change to the repository MUST undergo review before being merged into the `main` branch.

1.  **Mandatory Two-Person Review:** At least 50% of all proposed modifications MUST be reviewed and approved by at least one person other than the author. In practice, VaultZero aims for 100% review coverage for all security-critical and core logic changes. [two_person_review]
2.  **Independence:** For Gold status compliance, reviews should ideally be performed by an independent contributor or maintainer unassociated with the author's organization.
3.  **Review Completion:** No Pull Request (PR) can be merged without at least one approval that satisfies the review policy.

## What is Checked During Review

Reviewers are expected to verify the following criteria:

### 🛡️ Security & Cryptography

- **Primitive Usage:** Are cryptographic primitives used according to the [Security Architecture](SECURITY_ARCHITECTURE.md)?
- **Memory Safety:** While using JS, are we ensuring no sensitive data is leaked or exposed?
- **Input Validation:** Are all user-provided inputs sanitized and validated against allowlists?
- **Side-Channel Resistance:** Does the change maintain constant-time execution for sensitive operations?

### ⚙️ Logic & Quality

- **Correctness:** Does the code achieve the stated goal without regressions?
- **Maintainability:** Is the code well-documented, modular, and following project style?
- **Performance:** Does the modification impact the offline performance or responsiveness of the app?

### ✅ Testing & Documentation

- **Test Coverage:** Does the PR include new tests for new features? Do existing tests still pass?
- **Docs:** Are `README.md`, `SECURITY_ARCHITECTURE.md`, or the `/docs` folder updated to reflect changes?

## Code Review Process

1.  **Submission:** Contributors submit modifications via a Pull Request on GitHub.
2.  **Automated Checks:** CI/CD pipelines (Linting, SAST, Tests) must pass before a manual review is finalized.
3.  **Manual Review:** A maintainer or designated reviewer examines the code, provides feedback, and requests changes if necessary.
4.  **Approval:** Once all concerns are addressed and the code meets the standards, the reviewer provides an "Approve" signal.
5.  **Merging:** An authorized maintainer (other than the author) merges the PR.
