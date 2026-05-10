# Maintenance Guide

This guide covers the long-term upkeep of the VaultZero codebase and common development pitfalls.

## 🛠️ Common Errors & Solutions
- **"Integrity Check Failed"**: This usually happens when a developer modifies a file in `app/` but forgets to run the `publish.ps1` script to update the signature.
- **"Sodium not loaded"**: Ensure `libs/sodium.js` is loaded before any cryptographic call in `encryption.js`.

## 🧹 Code Hygiene
- **Keep it Vanilla**: Avoid adding heavy frameworks or dependencies.
- **Privacy First**: Always use `secureZero()` or `memzero()` on sensitive buffers after use.

## 🔄 Dependency Management
Check for updates monthly. Follow the [Dependency Policy](DEPENDENCY_POLICY.md) for vetting new libraries.
