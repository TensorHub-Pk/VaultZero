# CI/CD Pipeline Documentation

VaultZero uses GitHub Actions for automated quality and security enforcement.

## Pipeline Overview
Our pipeline runs on every push and pull request to the `main` branch. It consists of three primary stages:

### 1. Linting and Formatting Analysis
We use ESLint and Prettier to ensure code consistency.
- **Strict Mode**: The pipeline will fail on any "Warning" related to unused variables or potentially unsafe JS patterns.

### 2. Static Application Security Testing (SAST)
We integrate **CodeQL** and specialized security scanners:
- **Vulnerability Scanning**: Checks for known weaknesses in `encryption.js`.
- **Secret Scanning**: Prevents accidental commits of private keys or credentials.

### 3. Build & Integrity Verification
The pipeline automatically runs the packaging logic to ensure the `app/` folder remains structurally sound and ready for release.

## Monitoring
All pipeline results are public and can be viewed in the [Actions tab](https://github.com/TensorHub-Pk/VaultZero/actions).
