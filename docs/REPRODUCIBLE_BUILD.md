# Reproducible Builds

Security transparency requires that any third party can reproduce the exact binary or bundle released by the maintainers.

## 🏗️ Build Environment
To ensure a consistent build:
- **OS**: Ubuntu 22.04 LTS (or equivalent via Docker).
- **Node.js**: v18.x (LTS).
- **Environment**: Clean environment with no global packages.

## 🛠️ Build Process
1.  **Clone**: `git checkout v3.0.0`
2.  **Verify Code**: Check the GPG signature of the commit.
3.  **Run Pipeline**: `.\ "For dev/publish.ps1"`
4.  **Compare**: The resulting `SHA256` hash of the ZIP file must match the one published in `CHECKSUMS.txt`.

## 📦 Verifying the ZIP
Users can verify the release bundle using:
```bash
certutil -hashfile VaultZero-3.0.0.zip SHA256
```
The output must be identical to the one signed by GPG key `4C5158A46046CE4C`.
