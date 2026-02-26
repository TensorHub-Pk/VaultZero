# ![Logo](../app/assets/logo.png) Reproducible Build Justification

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)

A reproducible build ensures that compiled or generated artifacts are a perfect, bit-for-bit duplicate of previous builds given the exact same source code and environment. This practice ensures that no malicious code was injected during the build process, fulfilling an essential OpenSSF Gold requirement.

## VaultZero's Build Ecosystem

VaultZero is a static web application built using standard HTML, CSS, and Vanilla JS, optionally minified and bundled for production. The application leverages the browser's native capabilities (such as the Web Crypto API) and does not rely on complex compilation infrastructure like C++ compilers.

### How Our Build is Reproducible

1. **Deterministic Dependency Resolution:** We enforce the use of strict lockfiles (e.g., `package-lock.json` or equivalent) which lock all dependencies to exact cryptographic checksums and versions.
2. **Deterministic Minification:** Any bundler or minifier used via our static build pipeline acts deterministically given the exact source file inputs. The resulting static assets (the `/dist` or `/out` artifact) will compute to the same SHA-256 hash across any clean environment executing the build command.
3. **Containerized CI Tooling:** To eliminate environmental differences (like Node.js versions or OS differences), our CI executes builds within pinned Docker images.

Because VaultZero's logic executes client-side and is distributed as raw JS/HTML/CSS (or deterministic bundles thereof), the concept of reproducible builds directly applies to verifying that the static assets generated in a local development environment match the exact hashing signatures of the assets deployed to production via CI.

### Verification Statement

Any developer can clone the specific target release tag, install dependencies strictly from the lockfile, execute the build step, and mathematically compare the generated artifact's hash against the published production files.
