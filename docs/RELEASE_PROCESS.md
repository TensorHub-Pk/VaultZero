# Release Process

VaultZero follows a strict "Trust-but-Verify" release lifecycle.

## 1. Pre-Release Checklist
Before any release can be finalized:
- [ ] All CI/CD checks must be green.
- [ ] Manual "Cold-Boot" audit passed.
- [ ] No critical vulnerabilities found in dependencies within the last 60 days.
- [ ] `update-info.json` version synchronized.

## 2. Cryptographic Finalization
The release is signed by the lead maintainer using GPG:
1.  Generate SHA256 checksums for the entire bundle.
2.  Apply a **Cleartext Signature** to `CHECKSUMS.txt`.
3.  Upload the `.zip` and `.asc` files as GitHub Release Assets.

## 3. Post-Quantum Integrity
For v3.0+, every release includes a post-quantum signature verifyable via `kyber.js` tools located in the internal tools directory.
