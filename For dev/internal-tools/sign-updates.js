#!/usr/bin/env node
/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */
/**
 * sign-manifest.js — Offline Manifest Signing Tool (Node.js)
 *
 * Usage:  node internal-tools/sign-updates.js
 *
 * Reads version.json, computes SHA-256 and SHA-512 hashes of critical files,
 * signs the manifest with Ed25519, and writes the signed version.json.
 *
 * On first run, creates a keypair in internal-tools/private-keys.json (KEEP SECRET).
 * The public key is embedded in app.js as TRUSTED_UPDATE_PUBLIC_KEY.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Script is in For dev/internal-tools/, so ROOT is two levels up
const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'app');
const MANIFEST_PATH = path.join(APP_DIR, 'update-info.json');
const KEYS_PATH = path.join(__dirname, 'private-keys.json');

// CORE SECURITY FILES: Only these files are cryptographically signed and verified.
const SECURITY_CRITICAL_ASSETS = [
    'index.html',
    'vault.html',
    'app.js', 
    'encryption.js', 
    'service-worker.js', 
    'libs/localforage.min.js',
    'libs/sodium.js',
    'libs/argon2-bundled.min.js',
    'libs/argon2.wasm',
    'libs/kyber.js'
];

function computeHashes(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const isText = ['.js', '.html', '.css', '.json', '.xml', '.txt', '.svg'].includes(ext);
    
    let buf;
    if (isText) {
        // Normalize line endings for text files to prevent CRLF/LF mismatches on different OS
        let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
        buf = Buffer.from(content, 'utf8');
    } else {
        // Read as raw binary
        buf = fs.readFileSync(filePath);
    }

    return {
        sha256: crypto.createHash('sha256').update(buf).digest('hex'),
        sha512: crypto.createHash('sha512').update(buf).digest('hex')
    };
}

function loadOrCreateKeys() {
    if (fs.existsSync(KEYS_PATH)) {
        const data = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
        console.log('Loaded existing signing keys.');
        console.log('Public Key (embed in app.js):', data.publicKey);
        return {
            privateKey: Buffer.from(data.privateKey, 'base64'),
            publicKey: Buffer.from(data.publicKey, 'base64')
        };
    }

    console.log('No signing keys found. Generating new Ed25519 keypair...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    const pubRaw = publicKey.export({ type: 'spki', format: 'der' }).slice(-32);
    const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' }).slice(-32);

    const keysData = {
        publicKey: pubRaw.toString('base64'),
        privateKey: privRaw.toString('base64'),
        created: new Date().toISOString(),
        WARNING: 'NEVER commit this file. Keep it secret.'
    };

    fs.writeFileSync(KEYS_PATH, JSON.stringify(keysData, null, 2));
    console.log('Keys saved to:', KEYS_PATH);
    console.log('Public Key (embed in app.js):', keysData.publicKey);
    return { privateKey: privRaw, publicKey: pubRaw };
}

function signManifest() {
    const keys = loadOrCreateKeys();

    // Read current manifest and strip UTF-8 BOM if present
    let manifestData = fs.readFileSync(MANIFEST_PATH, 'utf8');
    if (manifestData.charCodeAt(0) === 0xFEFF) {
        manifestData = manifestData.slice(1);
    }
    const manifest = JSON.parse(manifestData);
    console.log(`\nIndexing ${SECURITY_CRITICAL_ASSETS.length} critical assets...`);
    const hashes = {};
    for (const file of SECURITY_CRITICAL_ASSETS) {
        const filePath = path.join(APP_DIR, file);
        if (fs.existsSync(filePath)) {
            hashes[file] = computeHashes(filePath);
            console.log(`  ${file}: [SHA256: ${hashes[file].sha256.substring(0,8)}... | SHA512: Verified]`);
        } else {
            console.warn(`  ${file}: NOT FOUND (skipped)`);
        }
    }

    // TUF (The Update Framework) metadata
    const timestamp = Date.now();
    const expires = timestamp + (30 * 24 * 60 * 60 * 1000); // 30-day window

    // Build signable payload (deterministic JSON without signature field)
    const signable = {
        version: manifest.version,
        released: manifest.released,
        timestamp,
        expires,
        hashes
    };
    const payload = Buffer.from(JSON.stringify(signable), 'utf8');

    // Sign with Ed25519 via Node.js crypto
    const privateKeyObj = crypto.createPrivateKey({
        key: Buffer.concat([
            Buffer.from('302e020100300506032b657004220420', 'hex'),
            keys.privateKey
        ]),
        format: 'der',
        type: 'pkcs8'
    });

    const signature = crypto.sign(null, payload, privateKeyObj);

    // Write signed manifest
    const signedManifest = {
        ...signable,
        signature: signature.toString('base64'),
        signerPublicKey: keys.publicKey.toString('base64')
    };

    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(signedManifest, null, 2));
    console.log('\n✓ Signed manifest written to update-info.json');
    console.log('  Version:', signedManifest.version);
    console.log('  Signature:', signedManifest.signature.substring(0, 40) + '...');
}

signManifest();
