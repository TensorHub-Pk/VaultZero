# ![Logo](../app/assets/logo.png) Release Process

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)

This document outlines the standard operating procedure for releasing a new version of VaultZero. Adhering to this process ensures consistency, traceability, and compliance with OpenSSF Best Practices.

## 1. Pre-Release Checklist

Before cutting a new release, the releasing maintainer must verify the following:

- [ ] All automated tests (CI) are passing on the `main` branch.
- [ ] Code coverage metrics are maintained (Statement > 90%, Branch > 80%).
- [ ] The `update-info.json` (if applicable) is prepared to reflect the new version.
- [ ] Any known high-severity or critical security vulnerabilities have been addressed.

## 2. Drafting the Release Notes (Changelog)

Release notes provide a comprehensive summary of what has changed. The release notes must distinguish between:

- **New Features**
- **Bug Fixes**
- **Security Updates**
- **Breaking Changes**

### Addressing Vulnerabilities in Release Notes

To comply with OpenSSF Gold practices, **we MUST mention in the release notes if the release fixes any security vulnerabilities.**
If a release includes security fixes, the notes should include a "Security Updates" section referencing the disclosed vulnerability (e.g., CVE ID or GitHub Security Advisory ID), providing enough detail for users to understand the risk of not upgrading, without providing exploit material.

_Example:_

> **Security Updates**
>
> - Fixed a cryptographic timing issue in key generation (GHSA-xxxx-xxxx-xxxx). All users are strongly advised to upgrade.

## 3. Creating the Release

Releases are triggered by pushing a SemVer tag to the repository.

1. Update version numbers in relevant application files (e.g., `package.json` if used, or `update-info.json`). Commit this change.
2. Create an annotated Git tag matching the version (e.g., `git tag -a v1.2.3 -m "Release v1.2.3"`).
3. Push the tag: `git push origin v1.2.3`.
4. Navigate to the GitHub Releases page and draft a new release from the pushed tag.
5. Copy the drafted release notes into the description field.
6. Publish the release.

## 4. Post-Release

- Ensure the deployment pipelines (e.g., GitHub Pages) have successfully deployed the new version.
- Verify that users receiving the Next-PWA Service Worker updates are prompted with the "Install Update" notification correctly.
- Announce the release in relevant community channels.
