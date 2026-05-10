<p align="center">
  <img src="../assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — TESTING POLICY</h3>
<p align="center">
  <img src="../assets/pulse.svg" width="12" /> <em>Zero compromise on stability and security.</em>
</p>

---

## 🧪 [AUTOMATION] TEST SUITE
Every release must pass a rigorous multi-stage testing pipeline:

| Stage | Tooling | Focus |
|-----------|-------------|-------------|
| **Unit** | Jest / Vitest | Cryptographic logic in `encryption.js` |
| **Integration** | Playwright | Service Worker and UI communication |
| **Dynamic** | OWASP ZAP | Timing attacks and memory leaks |
| **Integrity** | Manual + Script | Deep Scan and Repair flow verification |

---

## 🕵️ [MANUAL] COLD-BOOT AUDIT
Before every major release, a "Clean Environment" audit is performed:

1.  **Fresh Install**: Install the app in an isolated browser profile with no cached data.
2.  **State Cycle**: Perform full `Lock → Unlock → Sync` cycles.
3.  **Integrity Check**: Manually trigger the Deep Scan sentinel to verify lockdown fires correctly.
4.  **Repair Flow Test**: Modify a file hash in `update-info.json` to confirm the Secure Sync modal appears.
5.  **Security Alert Test**: Corrupt the manifest signature to confirm the red Security Alert fires.
6.  **Isolation Mode Test**: Enable AirGap and confirm zero outbound network requests are made.

---

## 🔐 [SECURITY] INTEGRITY PIPELINE TESTS
The following scenarios must be explicitly tested before every release:

| Scenario | Expected Result |
|-----------|-------------|
| Valid signed update available | Blue "Secure Sync" modal appears |
| Files modified, signature invalid | Red "Security Alert" modal, Isolation Mode offered |
| Post-repair files still fail verification | Security Alert fires instead of another Repair prompt |
| AirGap enabled + update check triggered | Update check exits immediately, zero network calls |

---

*Verified with rigorous security testing by the VaultZero Team*
