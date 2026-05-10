# Security Architecture

VaultZero is built on the principle of **Defense in Depth**. Our architecture ensures that even if the host server is compromised, user data remains unreadable and untamperable.

## 1. Cryptographic Primitives
We use industry-standard, high-performance, and peer-reviewed primitives:

### 1.1 Symmetric Encryption (Data-at-Rest)
- **Algorithm**: ChaCha20-Poly1305 (IETF).
- **Key Derivation**: Argon2id (Memory-hard).
- **Key Length**: 256-bit.
- **Purpose**: Provides high performance on mobile devices and is highly resistant to side-channel attacks.

### 1.2 Asymmetric Encryption (Secure Share)
- **Algorithm**: ML-KEM-768 (Kyber).
- **Resistance**: Post-Quantum Secure.
- **Purpose**: Used for establishing shared secrets between users without risking exposure to future quantum computers.

### 1.3 Digital Signatures
- **Algorithm**: Ed25519 for standard signatures.
- **PQ-Signatures**: ML-DSA-65 (Dilithium) for quantum resistance.
- **Integrity**: Every vault payload is signed to prevent MITM attacks.

## 2. Secure Design
### 2.1 Zero-Knowledge Implementation
The master password is never sent to any server. All encryption and decryption happen exclusively in the browser's memory using `WebCrypto` and `libsodium.js`.

### 2.2 Signed Update Verification
The Service Worker acts as a gatekeeper, verifying the cryptographic signature of the `update-info.json` manifest before allowing any code update to execute.
