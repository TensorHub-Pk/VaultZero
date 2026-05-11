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
| **"Integrity Check Failed"** | A security-critical file was modified without re-signing | Run the provided integrity signing utility to update the manifest |
| **"Sodium not loaded"** | Library load order issue | Verify that cryptographic libraries initialize before main logic |
| **"Security Alert" on startup** | Hash mismatch in security manifest | Re-generate the security manifest or audit unauthorized file changes |
| **"Repair modal persists"** | Security manifest hashes are outdated | Ensure the manifest is refreshed after every codebase modification |
| **AirGap mode not persisting** | Storage layer not initialized | Verify persistence modules are fully loaded before state changes |

---

## 🧹 [HYGIENE] CODE STANDARDS
- **Minimalist Architecture**: Avoid introducing external frameworks. Maintain the zero-build-tool philosophy.
- **Privacy First**: Explicitly wipe sensitive buffers from memory immediately after use.
- **Integrity Enforcement**: Always refresh security signatures and file hashes before committing any logic changes.
- **Strict Secret Isolation**: Secrets, keys, and internal identifiers must never be committed to source control.

---

## 🔄 [UPDATES] DEPENDENCY MANAGEMENT
Perform periodic dependency audits. Adhere to the established [Dependency Policy](DEPENDENCY_POLICY.md).
- Refresh all integrity manifests whenever an external library is updated.
- Perform a manual security audit for any major version upgrades before integration.

---

## 🔐 [GPG] GIT SIGNING CONFIGURATION
All contributions to the primary branch must be cryptographically signed:

```powershell
# Associate your key with Git
git config --global user.signingkey <YOUR_SIGNING_KEY_ID>
git config --global commit.gpgsign true

# Define the GPG application path
git config --global gpg.program "<PATH_TO_GPG_EXECUTABLE>"
```

---

## 🆘 [RECOVERY] DISASTER SCENARIOS

### Scenario 1: Unintended State Loss (Rebase/Reset)
```powershell
git log -g --oneline               # Inspect the reference log for lost commits
git reset --hard <REF_ID>          # Restore the repository to a known good state
```

### Scenario 2: Remote/Local History Conflict
```powershell
git push origin <BRANCH_NAME> --force  # Caution: Only use if local state is verified
```

> [!IMPORTANT]
> Following any repository recovery or force-push, always run the standard verification and publication workflows to ensure signatures and hashes are synchronized with the active code.

---

*Maintained with precision by the VaultZero Team*
