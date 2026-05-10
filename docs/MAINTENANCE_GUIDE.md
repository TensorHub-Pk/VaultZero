# VaultZero: Maintenance & Update Guide

Follow these instructions whenever you want to change the code, add features, or update the version of VaultZero.

## 🛠️ Step-by-Step Update Process

### 1. Make your Changes

Edit your files (e.g., `index.html`, `encryption.js`, or the CSS files) as usual in your code editor.

### 2. Open the Terminal

Open your terminal in the root folder (`d:\My IT Project\Secure WEB`).

- _Tip: In VS Code, press `Ctrl + ` `_

### 3. Sign the Changes (CRITICAL)

Every time you change a file, you must regenerate the security signature. If you forget this step, the app will think it has been hacked and refuse to run.

**Run this command:**

```powershell
node "For dev/internal-tools/sign-updates.js"
```

### 4. Verify the Output

You should see a message in the terminal saying:
`✓ Signed manifest written to update-info.json`

### 5. Deploy / Upload

Upload your files to GitHub. Make sure you include the updated `update-info.json` file, as that is what the user's browser will check.

---

## 🔐 Security Reminders

- **Private Keys**: Never share or upload `internal-tools/private-keys.json`. If you lose this file, you can never update your app again. If a hacker gets it, they can hijack your app.
- **Version Numbers**: If you want to force all users to download a fresh update, change the `"version": "3.0.0"` number inside `update-info.json` to something higher (like `3.0.1`) **before** running the sign command.

## 🔄 Maintenance and Upgrade Path

To ensure long-term usability and security, VaultZero prioritizes a seamless upgrade path:

1. **Version Support:** We primarily maintain the latest stable version of the software. All security patches and critical bug fixes are applied to the `main` branch.
2. **Automatic Upgrades:** The application is designed as a Progressive Web App (PWA). When a new version is signed and deployed, users are automatically prompted to refresh and apply the update via the Service Worker.
3. **Data Compatibility:** VaultZero guarantees backward compatibility for encrypted data. New versions of the software must always be able to decrypt payloads created by at least the last two major versions.
4. **Upgrade Documentation:** If a future version requires a manual migration or contains breaking changes to the user experience, detailed instructions will be provided in the [Release Notes](RELEASE_PROCESS.md) and highlighted within the application's "Check for Updates" interface.

## 📋 Common Commands

- **Sign Updates:** `node "For dev/internal-tools/sign-updates.js"`
- **Start Local Test:** Use an extension like "Live Server" in VS Code to see your changes before uploading.
