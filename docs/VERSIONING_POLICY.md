# Versioning Policy

VaultZero follows [Semantic Versioning (SemVer) 2.0.0](https://semver.org/). This policy ensures predictability and backwards compatibility communication for all users and contributors.

## Version Format

Given a version number `MAJOR.MINOR.PATCH` (e.g., `1.2.4`), increment the:

1.  **MAJOR** version when you make incompatible API changes or fundamental architectural shifts (e.g., changing the default encryption algorithm to a heavily backwards-incompatible standard).
2.  **MINOR** version when you add functionality in a backwards-compatible manner (e.g., adding a new feature like Image Steganography while keeping old features intact).
3.  **PATCH** version when you make backwards-compatible bug fixes or security patches.

## Tagging and Releases

Every release of VaultZero must be explicitly tagged in the Git repository using the `vX.Y.Z` format (e.g., `v1.2.4`).

These tags are used by the CI/CD pipeline to generate automated release drafts and must be treated as immutable once published. If a mistake is made in a release, a new `PATCH` version must be issued rather than modifying or deleting the existing tag.

## Pre-releases

For major updates undergoing testing, we may issue pre-releases by appending a hyphen and a series of dot-separated identifiers to the version (e.g., `2.0.0-alpha.1` or `2.0.0-rc.1`). These builds are strictly for testing and should not be used in critical security environments.
