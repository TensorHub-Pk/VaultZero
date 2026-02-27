# ![Logo](app/assets/logo.png) VaultZero

> **"Your Privacy, Sealed Permanently 😉"**

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)
[![Host Status](https://img.shields.io/website?url=https%3A%2F%2Fvaultzero.tensorhub.pk)](https://vaultzero.tensorhub.pk)

VaultZero is a professional-grade, zero-knowledge cryptographic suite designed for **everyone**. It provides a 100% offline-first environment where your data is never uploaded, never shared, and never leaves your device.

## ✨ Key Features

VaultZero is packed with advanced security features typically reserved for enterprise-grade software, all delivered in a beautiful, premium interface:

- 🔒 **Secret Vault (Symmetric)**: Lock messages and files using multi-layered encryption (**Argon2id** key derivation + **AES-GCM/ChaCha20**).
- 🤝 **Secure Share (Hybrid-PQC)**: Sending a message to a friend? We use **Post-Quantum Cryptography** (ML-KEM/Kyber-768) combined with **X25519** for future-proof key exchange.
- 🆔 **Digital Identity**: Generate your own decentralized cryptographic identity with **Quantum-Resistant signatures** (ML-DS).
- 🖼️ **Steganographic Shield**: Hide your encrypted payloads inside standard images (PNG/JPG). To any observer, it looks like a normal photo; to you, it's a hidden vault.
- 🕒 **Auto-Delete Links**: Set your shared content to automatically "expire" and become undecryptable after a set time (1m to 24h).
- 🛡️ **Native Shield (PWA)**: Install VaultZero as a native app on iOS, Android, or Desktop. Once installed, it works **100% offline** with zero dependency on the internet.
- 🧹 **Panic Wipe**: One-click total destruction. Instantly shred all local keys, identities, and session data.
- 🗒️ **Audit Logs**: A local-only, tamper-evident log of all security events so you can monitor your vault's integrity.
- ❄️ **Session Lockdown**: High-security sessions that automatically expire every 48 hours to ensure your environment is fresh and updated.

## 🚀 Experience It Now

You don't need to install anything to start securing your privacy:
**Live Environment:** [vaultzero.tensorhub.pk](https://vaultzero.tensorhub.pk)

### Running Your Own Private Instance

1.  **Clone:** `git clone https://github.com/TensorHub-Pk/VaultZero.git`
2.  **Serve:** `npx serve app` (or use any static server).
3.  **Secure:** Open `localhost:3000` in your modern browser.

_Note: For full security, VaultZero requires HTTPS or Localhost to enable the Web Crypto API._

## 🛠️ Repository Roadmap

- `/app/`: The premium frontend and cryptographic engine.
- `/docs/`: Architectural deep-dives and security audits.
- `/internal-tools/`: Specialized tools for maintainers (Update signers, etc.).
- `/compliance/`: Documentation for OpenSSF Best Practices compliance.

## 🤝 Community & Support

VaultZero is built for the community. We welcome all feedback, bug reports, and contributions.

- **Support Email:** `Vaultzero@tensorhub.pk`
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security:** See [SECURITY.md](SECURITY.md)

## License

This project is licensed under the **MIT License**.

---

_Created with ❤️ by the VaultZero Contributors._
