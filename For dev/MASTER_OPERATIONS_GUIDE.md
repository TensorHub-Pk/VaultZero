# 🏛️ VaultZero: Master Development & Release Guide
**Version 3.0.0 — Titanium Pulse Standard**

This consolidated guide provides everything you need for the ongoing maintenance and official release of VaultZero. Follow these steps to ensure cryptographic integrity and a professional deployment.

---

## 🛠️ Section 1: Maintenance & Daily Updates
Follow these steps whenever you modify the code, add features, or update styles.

### 1. Make your Changes
Edit your files (e.g., `app/index.html`, `app/app.js`, or the CSS files) as usual in your code editor.

### 2. Sign the Changes (CRITICAL)
Every time you change a file in the `/app` directory, you must regenerate the security manifest. If you forget this, the "Live Guard" system will think the app has been tampered with.

**Run this command in your terminal:**
```powershell
node "For dev/internal-tools/sign-updates.js"
```
*Tip: Ensure you see the message: `✓ Signed manifest written to update-info.json`*

### 🔐 Security Reminders
- **Private Keys**: Never share or upload `internal-tools/private-keys.json`.
- **Version Numbers**: Before running the sign command, ensure the `"version"` field in `app/update-info.json` matches your intended release (e.g., `3.0.0 Stable`).

---

## 📦 Section 2: Official Release Operations
Use these steps when you are ready to publish a major version (like v3.0.0) to GitHub.

### Step 1: Package the Application
The release bundle should only contain the production-ready files.

**Run this command in the root directory:**
```powershell
Compress-Archive -Path .\app\* -DestinationPath .\VaultZero-3.0.0.zip -Force
```
*Note: This ensures only the app contents are included, excluding root dev files and git history.*

### Step 2: Generate Checksums
Generate a hash list so users can verify the zip or individual files haven't been corrupted.

**For all files in the app folder (Individual Audit):**
```powershell
Get-FileHash -Path .\app\* -Algorithm SHA256 | Out-File -FilePath .\CHECKSUMS.txt -Encoding utf8
```

**For the Release Archive (GitHub Asset):**
```powershell
# Run this in the root directory
Get-ChildItem -Path .\VaultZero-3.0.0.zip | Get-FileHash -Algorithm SHA256 | Select-Object Hash, @{Name="File";Expression={$_.Path.Replace((Get-Location).Path + "\", "")}} | Out-File -FilePath .\CHECKSUMS.txt
```

### Step 3: GPG Signing (Kleopatra)
1.  Open **Kleopatra**.
2.  Click **Sign/Encrypt** and select **`CHECKSUMS.txt`**.
3.  **UNCHECK** all "Encrypt" options.
4.  **CHECK** "Sign as:" and select your key `6CE30CC69DC346F5`.
5.  Select **"Cleartext Signature"** in advanced options.
6.  Click **Sign** to create **`CHECKSUMS.txt.asc`**.

> [!TIP]
> **Preferred Format:** Always use the **`.asc`** (Cleartext Signature) format for public releases rather than `.sig`. The `.asc` format is human-readable and much easier for users to verify using standard GPG commands. If you accidentally upload a `.sig` file, you can remove it by clicking the "X" on the GitHub release edit page and uploading the `.asc` version instead.

*New Key ID: 6CE30CC69DC346F5*

### Step 4: GitHub Release Workflow
1.  **Push the Signed Tag**:
    ```powershell
    git tag -s v3.0.0 -m "Release v3.0.0 Titanium Pulse"
    git push origin v3.0.0
    ```
2.  **Create Release on Web**:
    - Go to GitHub -> Releases -> Draft a new release.
    - Select the **`v3.0.0`** tag.
3.  **Upload Assets**:
    Drag and drop these two files:
    - ✅ `VaultZero-3.0.0.zip`
    - ✅ `CHECKSUMS.txt.asc`
4.  **Publish**: Check "Set as latest release" and click **Publish**.

---

## 🔄 Section 3: Long-Term Maintenance & Upgrade Path
To ensure VaultZero remains secure and usable for years, follow these architectural maintenance rules:

### 1. Data Compatibility Guarantee
VaultZero guarantees backward compatibility for encrypted data. New versions must always be able to decrypt payloads created by at least the last two major versions. Never change the core AES-GCM or Argon2id parameters without a formal migration plan.

### 2. PWA Upgrade Logic
The application uses a "Notify-then-Apply" Service Worker. When you push a signed update:
1. Users see a "Secure Update Available" banner.
2. Clicking "Update" reloads the app and applies the new signed manifest.
3. The system verifies the `update-info.json` signature before allowing the update to stay.

### 3. Versioning Strategy
We follow [SemVer 2.0.0](https://semver.org/):
- **MAJOR (3.0.0)**: Breaking changes or major security shifts (e.g., PQC implementation).
- **MINOR (3.1.0)**: New features (e.g., adding a new tool to the vault).
- **PATCH (3.0.1)**: Bug fixes and UI refinements.


---

## 🔍 Section 4: Verification & Integrity Check
Before publishing, always verify that your Zip archive matches your Checksum file. This prevents "Bad Signature" errors and ensures users get the correct code.

### 1. Perform a Local Hash Check
Run this command to verify your local zip file against the `CHECKSUMS.txt` list:
```powershell
$CurrentHash = (Get-FileHash .\VaultZero-3.0.0.zip).Hash
if (Select-String -Path .\CHECKSUMS.txt -Pattern $CurrentHash) {
    Write-Host "✅ VERIFIED: The Zip file matches the saved checksum!" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Hash mismatch! Regenerate your CHECKSUMS.txt." -ForegroundColor Red
}
```

### 2. Verify the GPG Signature (The Final Step)
After signing in Kleopatra, test the signature to ensure it is valid:
```bash
gpg --verify CHECKSUMS.txt.asc
```

---

## 📋 Summary of Common Commands

| Task | Command |
| :--- | :--- |
| **Sign App Manifest** | `node "For dev/internal-tools/sign-updates.js"` |
| **Package Release** | `Compress-Archive -Path .\app\*, .\docs -DestinationPath .\VaultZero-3.0.0.zip -Force` |
| **Hash Archive** | `Get-FileHash -Path .\VaultZero-3.0.0.zip -Algorithm SHA256` |
| **Append Zip Hash** | `Get-ChildItem -Path .\VaultZero-3.0.0.zip \| Get-FileHash -Algorithm SHA256 \| Out-File -FilePath .\CHECKSUMS.txt -Append` |
| **Verify Integrity** | `gpg --verify CHECKSUMS.txt.asc` |

*Built for Privacy. Hardened for the Future. TensorHub Inc.*
