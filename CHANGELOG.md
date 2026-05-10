<p align="center">
  <img src="assets/logo.png" alt="VaultZero Logo" width="180" />
</p>
<h3 align="center">VAULTZERO — CHANGELOG</h3>
<p align="center">
  <img src="assets/pulse.svg" width="12" /> <em>All notable changes to the VaultZero ecosystem</em>
</p>

---

## [3.1.0] — 2026-05-12

### 🏔️ THE DIGITAL FORTRESS HARDENING
> *"Unseen. Unreachable. Unbreakable."*

This update solidifies VaultZero's position as a self-protecting fortress. We've implemented a production-grade integrity pipeline that ensures the code you run is exactly the code we signed, with absolute "Air-Gap" capabilities for the most sensitive sessions.

#### ✨ Security & Integrity
- **Deep Integrity Pipeline**: Implementation of a startup-phase "Deep Scan" that cryptographically verifies all critical assets (`app.js`, `encryption.js`, `service-worker.js`) against a signed server-side manifest.
- **Isolation Mode (AirGap)**: A total digital blackout system. When active, it globally overrides browser networking (`fetch`, `XHR`, `WebSockets`) and halts all update/sync polling to ensure 100% offline security.
- **Post-Repair Security Checks**: Added a "Double-Verification" step after repairs to prevent recursive update loops on compromised or misconfigured servers.
- **TUF Security Compliance**: Hardened timestamp and expiration logic to protect against "Freeze Attacks" where an attacker serves an older, signed version of the manifest.

#### 💎 UI & UX Refinements
- **Premium "Secure Sync" UI**: Redesigned the update/repair flow with a high-end Liquid Titanium aesthetic, pulsing security indicators, and simplified, reassuring language.
- **Sync Status Telemetry**: Integrated real-time "Heartbeat" indicators in the Audit Log and Header to visualize security verification states.

#### ⚙️ Architecture & DevOps
- **Root-Level Convergence**: Refactored the project structure to a unified root-level architecture, eliminating legacy directory dependencies and streamlining the Service Worker scope.
- **Hardened Publish Engine**: Updated the `publish.ps1` script to automate manifest signing, file exclusion, and checksum generation in a single, secure workflow.

---

## [3.0.0] — 2026-05-10

### 🛡️ THE REBIRTH & HARDENING UPDATE

> *"Resilience by design. Security by force."*

This release marks a complete architectural renaissance of VaultZero. Following a proactive security decision to retire the legacy codebase entirely, we have rebuilt from the ground up — establishing a new benchmark for zero-knowledge privacy tools.

#### ⚠️ Security Notice

During a routine update cycle, an internal configuration file was inadvertently exposed in the public repository history. Though the exposure was momentary and the file was immediately revoked, the VaultZero team upheld a zero-compromise policy: *"good enough" is never acceptable for security.*

#### 🚀 Strategic Response

To guarantee absolute user security, we **fully deleted the legacy codebase and initiated a clean-slate rebuild**. Version 3.0.0 is the culmination of that effort — an entirely fresh engine, interface, and cryptographic foundation.

#### 🔄 Transition: v2.2 → v3.0.0

Given the scale of this rewrite, we have leapfrogged versions 2.3 and 2.4, consolidating all planned enhancements into this single major release. **This version is the definitive baseline for all future VaultZero development.**

---

### ✨ Major Features

| Component | Description |
|-----------|-------------|
| **Pulse Engine** | Zero-knowledge real-time sync across devices via anonymous `ntfy.sh` relay |
| **Liquid Titanium UI** | Professional-grade "Titanium Noir" design system with glassmorphic depth |
| **Security Dashboard** | Real-time telemetry, hash-chained audit logs, and anomaly detection |
| **Live Guard Sentinel** | Background integrity scanning every 60 seconds for code and file changes |
| **Cloud Tombstones** | Permanent Vault ID retirement with global cross-device wipe capability |
| **Post-Quantum Layer** | Ed25519 + ML-KEM-768 for quantum-resistant signatures and secure sharing |

---

### 🛠️ Technical Improvements

- **Update Framework**: Full TUF (The Update Framework) compliance including freeze and expiration protection
- **Code Signing**: All releases and commits now signed with Authority Key `4C5158A46046CE4C`
- **Integrity Sealing**: Mandatory cryptographic manifest verification for all application assets

---

## [2.2] — 2026-03-31

### ✨ Cyber-Neon Grand Release

#### Added

- **Cinematic Cyber-Neon theme** — Crimson (`#ff2e55`) and Emerald (`#00e373`) accent lighting
- **Typography unification** — `Outfit` for headers/buttons, `Inter` for body text
- **Cinematic modal transitions** — App-shell blur and scale effects
- **Glassmorphic toast notifications** — Backdrop-blur with colored glow shadows

#### Fixed

- **PWA shortcut crash** — Resolved `ERR_FAILED` on OS-level launch by fixing query parameter matching
- **Cloudflare redirect rejection** — Custom response reconstruction bypassing Chrome's 301/308 caching restrictions, enabling 100% offline support
- **Service worker deadlocks** — Hardened update lifecycle with proactive `skipWaiting` and `clients.claim()`

#### Changed

- **Lazy verification model** — Ed25519 manifest signing with SHA-256 background hashing, reducing bandwidth and load times
- **Private key safeguards** — Enhanced download workflow with proactive security intercepts
- **Cache baseline** — Incremented to `vault-v5` for clean legacy transition

---

## [2.1] — 2026-03-23

### UX & SEO Optimization

#### Added

- **SEO suite** — Fine-tuned meta tags, `robots.txt`, and canonical mapping
- **Feature elevation effects** — Realistic lighting and `translateY` lift on homepage cards

#### Changed

- **Mobile navigation** — Increased hit targets and spacing on bottom navigation bar
- **CDN caching** — Opaque response caching for third-party assets, ensuring offline icon/font reliability

---

## [2.0] — 2026-03-15

### Maintenance & Compliance

#### Changed

- **Icon unification** — System-wide migration to **Phosphor Bold** for consistent visual weight
- **OpenSSF compliance** — Refined badge integration and placement across hero and app sections

---

## [1.0] — 2026-02-27

### Post-Quantum Launch

#### Added

| Component | Description |
|-----------|-------------|
| **Post-Quantum Cryptography** | ML-KEM-768 (Kyber) + ML-DS for quantum-resistant sharing and signatures |
| **Hybrid Key Exchange** | X25519 + ML-KEM-768 for future-proof security |
| **Steganographic Shield** | Threshold steganography for hiding data in PNG/JPG carriers |
| **Native Shield (PWA)** | Desktop/mobile installation with 100% offline autonomy |
| **Audit Logs** | Tamper-evident local logging and anomaly detection |
| **Panic Wipe** | Immediate local data destruction |
| **Session Lockdown** | 48-hour session expiration for browser environment |

#### Fixed

- **Mobile loading hang** — Resolved vendor-specific browser stuck loader
- **Branding** — Refined tagline to *"Your Privacy, Sealed Permanently 😉"*

---

*Maintained with transparency by the VaultZero Team*
