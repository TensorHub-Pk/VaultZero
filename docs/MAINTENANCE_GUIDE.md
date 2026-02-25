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
node tools/sign-updates.js
```

### 4. Verify the Output

You should see a message in the terminal saying:
`✓ Signed manifest written to update-info.json`

### 5. Deploy / Upload

Upload your files to GitHub. Make sure you include the updated `update-info.json` file, as that is what the user's browser will check.

---

## 🔐 Security Reminders

- **Private Keys**: Never share or upload `tools/private-keys.json`. If you lose this file, you can never update your app again. If a hacker gets it, they can hijack your app.
- **Version Numbers**: If you want to force all users to download a fresh update, change the `"version": "1.0.0"` number inside `update-info.json` to something higher (like `1.0.1`) **before** running the sign command.

## 📋 Common Commands

- **Sign Updates:** `node tools/sign-updates.js`
- **Start Local Test:** Use an extension like "Live Server" in VS Code to see your changes before uploading.
