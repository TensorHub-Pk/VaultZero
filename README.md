# ![Logo](app/assets/logo.png) VaultZero

[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/12040/badge)](https://www.bestpractices.dev/projects/12040)
[![Build Status](https://github.com/TensorHub-Pk/VaultZero/actions/workflows/deploy.yml/badge.svg)](https://github.com/TensorHub-Pk/VaultZero/actions)

VaultZero is a secure, offline-first cryptographic web application designed to protect sensitive information using robust, client-side encryption. The application leverages the Web Crypto API to ensure that all encryption and decryption processes happen locally, ensuring zero-knowledge privacy.

## Features

- **Client-Side Encryption**: All data is encrypted locally; nothing is sent to a server.
- **Offline-First PWA**: Can be installed and used fully offline as a Progressive Web App.
- **Robust Algorithms**: Utilizes modern cryptographic standards.
- **Image Steganography**: Hide encrypted data securely within images.
- **Security Logs**: Transparently track cryptographic operations.

## Repository Structure

We organize our codebase to ensure clarity and adherence to OpenSSF Gold Best Practices:

- `/app/`: The core application source code, HTML, CSS, JavaScript, and service workers (Runtime only).
- `/internal-tools/`: Maintenance scripts, update signers, and private keys. (Not part of runtime application. For development and release use only.)
- `/assets/`: Static image assets and logos.
- `/docs/`: In-depth architectural documentation, maintenance guides, and governance policies.
- `/compliance/`: Documentation supporting our OpenSSF Best Practices Badge application.
- `/.github/workflows/`: CI/CD automation workflows.

## 🚀 Quick Start

Get your own secure vault running in seconds:

1.  **Clone the Repo:** `git clone https://github.com/TensorHub-Pk/VaultZero.git`
2.  **Serve Locally:** Run `npx serve app` from the root directory.
3.  **Start Encrypting:** Open `localhost:3000` (or the port provided) in your browser.

_Note: Since the app uses the Web Crypto API, it MUST be served over HTTPS or localhost to function._

## 🛠️ Usage & Installation

VaultZero is designed to run entirely in the browser. You can host it statically or run it locally during development.

### Running Locally

1. Clone the repository.
2. Serve the `/app` directory using any static web server (e.g., `npx serve app`, `python -m http.server -d app`).
3. Access the application via `localhost` in your preferred modern web browser.

## Contributing

We welcome contributions from the community! To ensure a healthy and collaborative environment, please review the following documents before participating:

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

### OpenSSF Best Practices

VaultZero strives to maintain the highest standards of security and quality. We are actively working towards the **OpenSSF Best Practices Gold Badge**. All contributors must adhere to our [Governance](docs/GOVERNANCE.md) and [Testing Policies](docs/TESTING_POLICY.md).

## License

This project is licensed under the [MIT License](LICENSE).

---

_Note: Some sections of this project require manual configuration for OpenSSF compliance, such as enabling 2FA for maintainers. Please see the [OpenSSF Compliance Checklist](compliance/OPENSSF_BADGE_CHECKLIST.md) for more details._
