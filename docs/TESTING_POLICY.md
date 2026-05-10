<p align="center">
  <img src="app/assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — TESTING POLICY</h3>
<p align="center">
  <img src="app/assets/pulse.svg" width="12" /> <em>Zero compromise on stability and security.</em>
</p>

---

## 🧪 [AUTOMATION] TEST SUITE
Every release must pass a rigorous multi-stage testing pipeline:

| Stage | Tooling | Focus |
|-----------|-------------|-------------|
| **Unit** | Jest / Vitest | Cryptographic logic in `encryption.js` |
| **Integration** | Playwright | Service Worker and UI communication |
| **Dynamic** | OWASP ZAP | Timing attacks and memory leaks |

---

## 🕵️ [MANUAL] COLD-BOOT AUDIT
Before every major release, a "Clean Environment" audit is performed:
1.  **Fresh Install**: Install app in an isolated browser profile.
2.  **State Cycle**: Perform full Lock -> Unlock -> Sync cycles.
3.  **Integrity Alert**: Manually trigger the sentinel to verify lockdown.

---

*Verified with 100% test coverage by the VaultZero Team*
