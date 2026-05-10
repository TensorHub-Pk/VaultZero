<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — MAINTENANCE GUIDE</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Long-term stewardship of a secure codebase.</em>
</p>

---

## 🛠️ [ERRORS] COMMON ISSUES & SOLUTIONS

| Error | Cause | Solution |
|-------|-------|----------|
| **"Integrity Check Failed"** | A security-critical file was modified without re-signing | Run `node "For dev/internal-tools/sign-updates.js"` |
| **"Sodium not loaded"** | Load order issue | Ensure `libs/sodium.js` loads before any call in `encryption.js` |
| **"Security Alert" on startup** | Hash mismatch in signed manifest | Re-run `sign-updates.js` or revert unauthorized file changes |
| **"Repair modal appears on every load"** | `update-info.json` hashes are outdated | Re-run `sign-updates.js` after every file change |
| **AirGap mode not persisting** | `localforage` not initialized | Ensure the vault is fully loaded before toggling AirGap |

---

## 🧹 [HYGIENE] CODE STANDARDS
- **Keep it Vanilla**: Avoid adding heavy frameworks or dependencies. VaultZero runs on zero build tools.
- **Privacy First**: Always use `secureZero()` or `memzero()` on sensitive buffers after use.
- **Sign Everything**: After any change to a security-critical file, always re-run `sign-updates.js` before committing.
- **No Inline Secrets**: Private keys, API tokens, and credentials must never appear in source code.

---

## 🔄 [UPDATES] DEPENDENCY MANAGEMENT
Check for updates monthly. Follow the [Dependency Policy](DEPENDENCY_POLICY.md) for vetting new libraries.
- After any dependency update, run `sign-updates.js` to regenerate all hashes.
- Major version upgrades require a full source audit before approval.

---

## 🔐 [GPG] GIT SIGNING CONFIGURATION
Every commit to `main` requires a GPG-verified signature:

```powershell
# Link your key to Git
git config --global user.signingkey 4C5158A46046CE4C
git config --global commit.gpgsign true

# Configure GPG path on Windows (Kleopatra)
git config --global gpg.program "C:\Program Files (x86)\GnuPG\bin\gpg.exe"
```

---

## 🆘 [RECOVERY] DISASTER SCENARIOS

### Scenario 1: Work disappeared during rebase
```powershell
git log -g --oneline   # Find the lost commit in reflog
git reset --hard <COMMIT_ID>   # Restore to that exact point
```

### Scenario 2: GitHub push rejected (histories diverged)
```powershell
git push origin main --force   # Only if local code is confirmed correct
```

> [!IMPORTANT]
> After any force push or recovery, always re-run `".\For dev\publish.ps1"` to ensure all hashes and signatures are aligned with the restored code.

---

*Maintained with precision by the VaultZero Team*
