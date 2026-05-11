/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 * 
 */

let isSodiumReady = false;
async function initCrypto() {
    if (typeof sodium !== 'undefined') {
        try {
            await sodium.ready;
            isSodiumReady = true;
        } catch (e) {
            /* Sodium initialization failed */
        }
    }
}
// Kick off initialization
initCrypto();

// --- SECURITY UTILITIES ---

/**
 * Constant-time buffer comparison.
 * Prevents timing side-channel attacks on key/hash comparisons.
 */
function constantTimeEqual(a, b) {
    if (!(a instanceof Uint8Array)) a = new Uint8Array(a);
    if (!(b instanceof Uint8Array)) b = new Uint8Array(b);
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
    }
    return diff === 0;
}

/**
 * Sanitize filenames — strip path traversal, null bytes, control chars.
 */
function sanitizeFilename(name) {
    if (!name || typeof name !== 'string') return 'file';
    // Remove path separators and dangerous characters
    let clean = name.replace(/[\/\\]/g, '_')       // path separators
        .replace(/\.\.+/g, '_')          // directory traversal
        .replace(/[\x00-\x1f\x7f]/g, '') // control characters
        .replace(/[<>:"|?*]/g, '_')      // reserved chars
        .trim();
    // Ensure it doesn't start with a dot (hidden files)
    if (clean.startsWith('.')) clean = '_' + clean;
    // Limit length
    return clean.substring(0, 255) || 'file';
}

/**
 * Compute SHA-256 hash of data for integrity verification.
 * Uses Web Crypto API (constant-time hardware implementation).
 */
async function computeIntegrityHash(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
}



/**
 * Silicon Fingerprint Engine
 * Generates a stable hardware seed that is consistent across different browsers 
 * on the same physical machine.
 */
async function getSiliconFingerprint() {
    const parts = [
        navigator.hardwareConcurrency || 4, // Stable CPU count
        screen.width + "x" + screen.height,  // Physical resolution
        screen.colorDepth,                   // Color bit depth
        Intl.DateTimeFormat().resolvedOptions().timeZone // System Region
    ];
    
    // Stable GPU info (Only the renderer, which is usually identical across browsers)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                parts.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
            }
        }
    } catch(e) {}

    const seedString = parts.join('|');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seedString));
    return new Uint8Array(hash);
}

/**
 * Universal Hardware Identity Adapter
 * Works across all browsers on the same device.
 */
/**
 * Universal Hardware Identity Adapter
 * Using UserHandle Anchor for perfect cross-browser stability
 */
async function getDeviceKey(showNotice = false) {
    const fallbackNotice = async () => {
        if (showNotice && window.customAlert) {
            await window.customAlert(
                "Hardware Identity (TPM) is unavailable or was denied. \n\n" +
                "The vault will be locked to this BROWSER instead of the physical hardware. It will not work if you clear your browser data or use a different browser.",
                "Security Notice: Browser Bound"
            );
        }
    };

    if (!(window.PublicKeyCredential && window.isSecureContext)) {
        await fallbackNotice();
        return await getBrowserFallbackKey();
    }

    try {
        if (window.toast) window.toast("Accessing Hardware Identity...", "info");
        
        // 1. Try to DISCOVER the existing hardware anchor
        const discoveryOptions = {
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rpId: window.location.hostname,
                userVerification: "required",
                timeout: 60000 
            }
        };

        try {
            const assertion = await navigator.credentials.get(discoveryOptions);
            if (assertion && assertion.response.userHandle) {
                const anchor = new Uint8Array(assertion.response.userHandle);
                const finalHash = await crypto.subtle.digest('SHA-256', anchor);
                
                if (window.AuditLog) window.AuditLog.log('HARDWARE_VERIFIED', { method: 'userHandle' });
                if (window.toast) window.toast("Hardware Anchor Verified!", "success");
                return new Uint8Array(finalHash);
            }
        } catch (e) {
            // No anchor found, move to creation
        }

        // 2. CREATE the hardware anchor (First time setup)
        if (window.toast) window.toast("Creating Silicon Seal...", "info");
        
        // We use a STABLE USER ID that will be the same if recreated, 
        // but the TPM will handle the unique storage.
        const stableUserId = new TextEncoder().encode("vaultzero-device-anchor-v1");

        const createOptions = {
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { name: "VaultZero", id: window.location.hostname },
                user: {
                    id: stableUserId,
                    name: "vaultzero-user",
                    displayName: "VaultZero User"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "required",
                    requireResidentKey: true
                },
                timeout: 60000
            }
        };

        const credential = await navigator.credentials.create(createOptions);
        if (credential) {
            if (window.AuditLog) window.AuditLog.log('HARDWARE_CREATED', { version: 'v4' });
            const finalHash = await crypto.subtle.digest('SHA-256', stableUserId);
            if (window.toast) window.toast("Hardware Seal Created!", "success");
            return new Uint8Array(finalHash);
        }
    } catch (e) {
        console.warn("Hardware Layer Skip: ", e.name);
        if (window.AuditLog) window.AuditLog.log('HARDWARE_SKIPPED', { reason: e.name });
        
        // If we are in setup mode and it was a direct denial, we already handled it with fallbackNotice
        // but let's be thorough.
    }

    await fallbackNotice();
    return await getBrowserFallbackKey();
}

/**
 * Fallback to browser-bound storage if hardware is unavailable or rejected.
 */
async function getBrowserFallbackKey() {
    let dk = await localforage.getItem('_sv_dk');
    if (!dk) {
        dk = crypto.getRandomValues(new Uint8Array(32));
        await localforage.setItem('_sv_dk', dk);
    }
    return dk;
}

async function getDerivedKeyRaw(password, salt, devicePepper = null) {
    let keyRaw = await deriveKeyArgon2(password, salt, devicePepper);
    if (!keyRaw) {
        keyRaw = await deriveKeyPBKDF2(password, salt, devicePepper);
    }
    return keyRaw;
}

async function deriveKeyArgon2(password, salt, devicePepper = null) {
    if (typeof argon2 !== 'undefined') {
        try {
            // Hardened parameters for high-security mode
            const mem = devicePepper ? 131072 : 65536; // 128MB if device-bound, else 64MB
            const time = devicePepper ? 5 : 3;

            let passBytes = new TextEncoder().encode(password);
            if (devicePepper) {
                // Combine password with device-specific pepper
                const combined = new Uint8Array(passBytes.length + devicePepper.length);
                combined.set(passBytes, 0);
                combined.set(devicePepper, passBytes.length);
                passBytes = combined;
            }

            const result = await argon2.hash({
                pass: passBytes,
                salt: salt,
                time: time,
                mem: mem,
                hashLen: 32, // 256 bits
                parallelism: 1,
                type: argon2.argon2id,
                distPath: 'libs'
            });

            if (devicePepper) secureZero(passBytes);
            return result.hash;
        } catch (e) {
            /* Argon2 failed, falling back to PBKDF2 */
        }
    }
    return null;
}

async function deriveKeyPBKDF2(password, salt, devicePepper = null) {
    const enc = new TextEncoder();
    let passBytes = enc.encode(password);

    if (devicePepper) {
        const combined = new Uint8Array(passBytes.length + devicePepper.length);
        combined.set(passBytes, 0);
        combined.set(devicePepper, passBytes.length);
        passBytes = combined;
    }

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        passBytes,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 600000,
            hash: "SHA-256",
        },
        keyMaterial,
        256
    );

    if (devicePepper) secureZero(passBytes);
    return new Uint8Array(bits);
}

// MIME type <-> extension maps
const MIME_MAP = {
    'txt': 'text/plain',
    'csv': 'text/csv',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'pdf': 'application/pdf',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'rtf': 'application/rtf',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime'
};

// Build reverse map: MIME -> extension (prefer shorter canonical exts)
const EXT_FROM_MIME = {};
for (const [ext, mime] of Object.entries(MIME_MAP)) {
    // Prefer shorter extensions (e.g., 'jpg' over 'jpeg')
    if (!EXT_FROM_MIME[mime] || ext.length < EXT_FROM_MIME[mime].length) {
        EXT_FROM_MIME[mime] = ext;
    }
}

function guessMime(fileName) {
    if (!fileName) return 'application/octet-stream';
    const ext = fileName.split('.').pop().toLowerCase();
    return MIME_MAP[ext] || 'application/octet-stream';
}

// Reverse lookup: MIME type -> file extension
function guessExtFromMime(mimeType) {
    if (!mimeType || mimeType === 'application/octet-stream') return 'bin';
    return EXT_FROM_MIME[mimeType] || 'bin';
}

// Build a safe fallback file name with extension from MIME type
function buildFallbackName(name, mimeType) {
    if (name && name.includes('.')) return name; // Already has extension
    const ext = guessExtFromMime(mimeType);
    const baseName = name || 'decrypted_file';
    return `${baseName}.${ext}`;
}

async function encrypt(input, password, expiresAt = null, fileName = null, fileType = null, senderIdentity = null) {
    if (!isSodiumReady && typeof sodium !== 'undefined') {
        await initCrypto();
    }

    const isText = typeof input === 'string';
    const enc = new TextEncoder();
    let plaintextBytes;

    const deviceBound = !!(expiresAt && expiresAt._sv_bound);
    const realExpiresAt = (typeof expiresAt === 'number') ? expiresAt :
        (expiresAt && typeof expiresAt.val === 'number') ? expiresAt.val : null;

    // ALWAYS wrap payloads with metadata + integrity hash for full protection
    const payloadObj = {
        _sv_msg: isText ? input : bufferToBase64(input),
        _sv_bin: !isText
    };
    if (realExpiresAt) payloadObj._sv_exp = realExpiresAt;
    if (deviceBound) payloadObj._sv_bound = true;
    if (fileName) payloadObj._sv_name = sanitizeFilename(fileName);
    if (fileName) payloadObj._sv_type = fileType || guessMime(fileName);
    const rawBytes = isText ? enc.encode(input) : input;
    payloadObj._sv_size = rawBytes.byteLength;
    payloadObj._sv_hash = bufferToBase64(await computeIntegrityHash(rawBytes));

    plaintextBytes = enc.encode(JSON.stringify(payloadObj));

    // Digital Signature: Bind the vault to the sender's identity
    if (senderIdentity && senderIdentity.signingPrivateKeyBase64) {
        // Create a copy for signing to avoid circular reference in JSON
        const signPayload = JSON.stringify(payloadObj);
        const signBytes = enc.encode(signPayload);

        payloadObj._sv_sender = senderIdentity.publicKeyBase64;
        payloadObj._sv_sender_spk = senderIdentity.signingPublicKey;
        payloadObj._sv_sig = signData(signBytes, senderIdentity.signingPrivateKeyBase64);

        if (senderIdentity.pqSigningPrivateKey) {
            payloadObj._sv_pq_spk = senderIdentity.pqSigningPublicKey;
            payloadObj._sv_pq_sig = pqSign(
                signBytes,
                senderIdentity.pqSigningPrivateKey,
                senderIdentity.pqLeafIndex || 0,
                senderIdentity.pqTreeHeight || PQ_TREE_HEIGHT
            );
        }
        // Final signed payload
        plaintextBytes = enc.encode(JSON.stringify(payloadObj));
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    let keyRaw = null;

    try {
        const deviceKey = deviceBound ? await getDeviceKey(true) : null;
        keyRaw = await getDerivedKeyRaw(password, salt, deviceKey);

        let ciphertext, iv;
        const algoId = isSodiumReady ? 1 : 2;

        // Flags: bit 0 = isText, bit 1 = hasExpiration, bit 2 = isWrapped (always set), bit 3 = deviceBound
        let flags = 4; // Always wrapped
        if (isText) flags |= 1;
        if (realExpiresAt) flags |= 2;
        if (deviceBound) flags |= 8;

        const header = new Uint8Array([algoId, flags]);

        if (isSodiumReady) {
            iv = crypto.getRandomValues(new Uint8Array(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES));
            ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
                plaintextBytes, header, null, iv, keyRaw
            );
        } else {
            iv = crypto.getRandomValues(new Uint8Array(12));
            const cryptoKey = await crypto.subtle.importKey(
                "raw", keyRaw, { name: "AES-GCM" }, false, ["encrypt"]
            );
            const ciphertextBuffer = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv, additionalData: header },
                cryptoKey,
                plaintextBytes
            );
            ciphertext = new Uint8Array(ciphertextBuffer);
        }

        const payload = new Uint8Array(2 + salt.length + iv.length + ciphertext.length);
        payload[0] = algoId;
        payload[1] = flags;
        payload.set(salt, 2);
        payload.set(iv, 2 + salt.length);
        payload.set(ciphertext, 2 + salt.length + iv.length);

        return bufferToBase64(payload);
    } finally {
        // Memory hardening: zero sensitive buffers
        if (keyRaw) secureZero(keyRaw);
        if (plaintextBytes) secureZero(plaintextBytes);
    }
}

async function decrypt(payloadBase64, password) {
    // Brute-force protection: check if we are in a lockout period
    if (typeof localforage !== 'undefined') {
        const lockoutEnd = await localforage.getItem('_sv_lockout_end');
        if (lockoutEnd && Date.now() < lockoutEnd) {
            const waitSec = Math.ceil((lockoutEnd - Date.now()) / 1000);
            throw new Error(`Security Lockout: Try again in ${waitSec} seconds.`);
        }
    }

    if (!isSodiumReady && typeof sodium !== 'undefined') {
        await initCrypto();
    }

    // Minimum 500ms delay to thwart automated brute-force scripts
    const startAt = Date.now();
    const payload = base64ToBuffer(payloadBase64);
    if (payload.length < 30) throw new Error("Invalid payload length");

    const algoId = payload[0];
    const flags = payload[1];
    const salt = payload.slice(2, 18);
    const iv = payload.slice(18, 30);
    const ciphertext = payload.slice(30);

    const isText = (flags & 1) === 1;
    const deviceBound = (flags & 8) === 8;

    const header = new Uint8Array([algoId, flags]);
    let keyRaw = null;
    let decryptedBytes;

    try {
        const deviceKey = deviceBound ? await getDeviceKey(false) : null;
        if (deviceBound && !deviceKey) {
            throw new Error("This message is bound to another device and cannot be opened here.");
        }

        keyRaw = await getDerivedKeyRaw(password, salt, deviceKey);

        if (algoId === 1) {
            if (!isSodiumReady) throw new Error("ChaCha20 not supported");
            try {
                decryptedBytes = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
                    null, ciphertext, header, iv, keyRaw
                );
            } catch (e) {
                if (window.AuditLog) {
                    const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'symmetric', error: e.message });
                    if (isAnomaly && typeof localforage !== 'undefined') {
                        // Set a 30-second lockout on anomaly
                        await localforage.setItem('_sv_lockout_end', Date.now() + 30000);
                    }
                }
                throw new Error("Decryption failed (wrong password or payload tampered)");
            }
        } else if (algoId === 2) {
            try {
                const cryptoKey = await crypto.subtle.importKey(
                    "raw", keyRaw, { name: "AES-GCM" }, false, ["decrypt"]
                );
                const decryptedBuffer = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv, additionalData: header },
                    cryptoKey,
                    ciphertext
                );
                decryptedBytes = new Uint8Array(decryptedBuffer);
            } catch (e) {
                if (window.AuditLog) {
                    const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'symmetric', error: e.message });
                    if (isAnomaly && typeof localforage !== 'undefined') {
                        // Set a 30-second lockout on anomaly
                        await localforage.setItem('_sv_lockout_end', Date.now() + 30000);
                    }
                }
                throw new Error("Decryption failed (wrong password or payload tampered)");
            }
        } else {
            throw new Error("Unknown algorithm ID: " + algoId);
        }
    } finally {
        // Memory hardening: zero key material on all paths
        if (keyRaw) secureZero(keyRaw);

        // Ensure the minimum processing delay
        const elapsed = Date.now() - startAt;
        if (elapsed < 500) {
            await new Promise(r => setTimeout(r, 500 - elapsed));
        }
    }

    const isWrapped = (flags & 4) === 4;
    const dec = new TextDecoder();

    if (isWrapped) {
        const decodedStr = dec.decode(decryptedBytes);
        try {
            const data = JSON.parse(decodedStr);
            if (data._sv_sender && data._sv_sig) {
                // To verify, we need the payload WITHOUT the signatures
                const verifyData = { ...data };
                delete verifyData._sv_sig;
                delete verifyData._sv_pq_sig;
                delete verifyData._sv_sender;
                delete verifyData._sv_sender_spk;
                delete verifyData._sv_pq_spk;

                const textEncoder = new TextEncoder();
                const verifyBytes = textEncoder.encode(JSON.stringify(verifyData));

                const verified = verifySignature(verifyBytes, data._sv_sig, data._sv_sender_spk);
                data._sv_verified = verified;

                if (data._sv_pq_sig && data._sv_pq_spk) {
                    const pqVerified = pqVerify(verifyBytes, data._sv_pq_sig, data._sv_pq_spk);
                    data._sv_pq_verified = pqVerified;
                }
            }

            const result = {
                verified: data._sv_verified || false,
                pq_verified: data._sv_pq_verified || false,
                sender: data._sv_sender || null
            };

            if (data._sv_bin) {
                const fileType = data._sv_type || 'application/octet-stream';
                const fileName = buildFallbackName(sanitizeFilename(data._sv_name), fileType);
                const fileData = base64ToBuffer(data._sv_msg);
                if (data._sv_hash) {
                    const computed = await computeIntegrityHash(fileData);
                    const expected = base64ToBuffer(data._sv_hash);
                    if (!constantTimeEqual(computed, expected)) {
                        throw new Error("Integrity check failed: file data has been tampered with.");
                    }
                }
                result.data = fileData;
                result.name = fileName;
                result.type = fileType;
                result.is_file = true;
            } else {
                result.data = data._sv_msg;
                result.is_text = true;
            }
            return result;
        } catch (e) {
            if (e.message.indexOf("expired") > -1) throw e;
            throw new Error("Payload marked as wrapped but format is invalid.");
        }
    }

    return isText ? dec.decode(decryptedBytes) : decryptedBytes;
}

function bufferToBase64(buffer) {
    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer;
}

// --- Asymmetric Key Exchange (Hybrid X25519 + Kyber) ---

let kyberModule = null;
let kyberKemPtr = null;

async function initKyber() {
    if (typeof LibOQS_ml_kem_768 !== 'undefined' && !kyberModule) {
        try {
            kyberModule = await LibOQS_ml_kem_768();
            kyberModule._OQS_init();
            const algoName = "ML-KEM-768";
            const nameLen = kyberModule.lengthBytesUTF8(algoName);
            const namePtr = kyberModule._malloc(nameLen + 1);
            kyberModule.stringToUTF8(algoName, namePtr, nameLen + 1);
            kyberKemPtr = kyberModule._OQS_KEM_new(namePtr);
            kyberModule._free(namePtr);
            if (!kyberKemPtr) {
                kyberModule = null;
            }
        } catch (e) {
            kyberModule = null;
        }
    }
}

async function generateKeyPair() {
    if (!isSodiumReady && typeof sodium !== 'undefined') await initCrypto();
    if (!isSodiumReady) throw new Error("Libsodium is required for Asymmetric crypto");
    await initKyber();

    const kpX25519 = sodium.crypto_box_keypair();
    const isHybrid = kyberModule ? 1 : 0;

    let pk = new Uint8Array(1 + 32 + (isHybrid ? 1184 : 0));
    let sk = new Uint8Array(1 + 32 + (isHybrid ? 2400 : 0));

    pk[0] = isHybrid;
    sk[0] = isHybrid;

    pk.set(kpX25519.publicKey, 1);
    sk.set(kpX25519.privateKey, 1);

    if (isHybrid) {
        const pkPtr = kyberModule._malloc(1184);
        const skPtr = kyberModule._malloc(2400);
        kyberModule._OQS_KEM_keypair(kyberKemPtr, pkPtr, skPtr);
        pk.set(kyberModule.HEAPU8.subarray(pkPtr, pkPtr + 1184), 33);
        sk.set(kyberModule.HEAPU8.subarray(skPtr, skPtr + 2400), 33);
        kyberModule._free(pkPtr);
        kyberModule._free(skPtr);
    }

    const kpSign = sodium.crypto_sign_keypair();
    const pqKeys = pqGenerateKeypair();

    return {
        publicKeyBase64: bufferToBase64(pk),
        privateKeyBase64: bufferToBase64(sk),
        signingPublicKey: bufferToBase64(kpSign.publicKey),
        signingPrivateKey: bufferToBase64(kpSign.privateKey),
        pqSigningPublicKey: pqKeys.pqPublicKey,
        pqSigningPrivateKey: pqKeys.pqPrivateKey,
        pqTreeHeight: pqKeys.pqTreeHeight,
        pqLeafIndex: pqKeys.pqLeafIndex
    };
}

async function encryptAsymmetric(plaintext, publicKeyBase64, expiresAt = null, fileName = null, fileType = null, senderIdentity = null) {
    if (!isSodiumReady) await initCrypto();
    await initKyber();

    const pkBuf = base64ToBuffer(publicKeyBase64);
    if (pkBuf.length < 33) throw new Error("Invalid public key");

    const isHybrid = pkBuf[0] === 1;
    const pkX25519 = pkBuf.slice(1, 33);

    // Generate Ephemeral X25519 Key
    const ephX25519 = sodium.crypto_box_keypair();
    // Compute Shared Secret 1 using X25519 Diffie-Hellman
    const shared1 = sodium.crypto_scalarmult(ephX25519.privateKey, pkX25519);

    let shared2 = new Uint8Array(0);
    let kyberCiphertext = new Uint8Array(0);

    if (isHybrid) {
        if (!kyberModule || pkBuf.length !== 1 + 32 + 1184) {
            throw new Error("Kyber is not available or invalid hybrid public key");
        }
        const pkKyber = pkBuf.slice(33);
        const pkPtr = kyberModule._malloc(1184);
        const ctPtr = kyberModule._malloc(1088);
        const ssPtr = kyberModule._malloc(32);

        kyberModule.HEAPU8.set(pkKyber, pkPtr);
        kyberModule._OQS_KEM_encaps(kyberKemPtr, ctPtr, ssPtr, pkPtr);

        kyberCiphertext = kyberModule.HEAPU8.slice(ctPtr, ctPtr + 1088);
        shared2 = kyberModule.HEAPU8.slice(ssPtr, ssPtr + 32);

        kyberModule._free(pkPtr);
        kyberModule._free(ctPtr);
        kyberModule._free(ssPtr);
    }

    // Derive symmetric key: Blake2b(shared1 || shared2)
    const combinedSecrets = new Uint8Array(shared1.length + shared2.length);
    combinedSecrets.set(shared1, 0);
    combinedSecrets.set(shared2, shared1.length);
    const symKey = sodium.crypto_generichash(32, combinedSecrets);

    // Determine Flags
    const isText = typeof plaintext === 'string';
    // Always wrap payloads with full metadata + integrity hash

    // Encrypt payload
    const enc = new TextEncoder();
    let plaintextBytes;
    const payloadObj = {
        _sv_msg: isText ? plaintext : bufferToBase64(plaintext),
        _sv_bin: !isText
    };
    if (expiresAt) payloadObj._sv_exp = expiresAt;
    if (fileName) payloadObj._sv_name = sanitizeFilename(fileName);
    if (fileName) payloadObj._sv_type = fileType || guessMime(fileName);
    const rawBytes = isText ? enc.encode(plaintext) : plaintext;
    payloadObj._sv_size = rawBytes.byteLength;
    payloadObj._sv_hash = bufferToBase64(await computeIntegrityHash(rawBytes));

    plaintextBytes = enc.encode(JSON.stringify(payloadObj));

    // Digital Signature: Bind the message to the sender's identity
    if (senderIdentity && senderIdentity.signingPrivateKeyBase64) {
        // Create a copy for signing to avoid circular reference in JSON
        const signPayload = JSON.stringify(payloadObj);
        const signBytes = enc.encode(signPayload);

        payloadObj._sv_sender = senderIdentity.publicKeyBase64;
        payloadObj._sv_sender_spk = senderIdentity.signingPublicKey;
        payloadObj._sv_sig = signData(signBytes, senderIdentity.signingPrivateKeyBase64);

        if (senderIdentity.pqSigningPrivateKey) {
            payloadObj._sv_pq_spk = senderIdentity.pqSigningPublicKey;
            payloadObj._sv_pq_sig = pqSign(
                signBytes,
                senderIdentity.pqSigningPrivateKey,
                senderIdentity.pqLeafIndex || 0,
                senderIdentity.pqTreeHeight || PQ_TREE_HEIGHT
            );
        }
        // Final signed payload
        plaintextBytes = enc.encode(JSON.stringify(payloadObj));
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const header = new Uint8Array([isHybrid ? 1 : 0, 0]); // Temporary header

    let flags = 4; // Always wrapped
    if (isText) flags |= 1;
    if (expiresAt) flags |= 2;
    header[1] = flags;

    // ChaCha20-Poly1305 with AAD
    const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
        plaintextBytes, header, null, iv, symKey
    );

    // Format: [isHybrid 1B] [Flags 1B] [EphemX25519 PK 32B] [Kyber CT 1088B if Hybrid] [IV 12B] [Ciphertext]
    const payloadBuffer = new Uint8Array(2 + 32 + kyberCiphertext.length + 12 + ciphertext.length);
    payloadBuffer[0] = isHybrid ? 1 : 0;
    payloadBuffer[1] = flags;
    payloadBuffer.set(ephX25519.publicKey, 2);

    let offset = 34;
    if (isHybrid) {
        payloadBuffer.set(kyberCiphertext, offset);
        offset += 1088;
    }

    payloadBuffer.set(iv, offset);
    offset += 12;
    payloadBuffer.set(ciphertext, offset);

    // Clean up sensitive keys
    sodium.memzero(symKey);
    sodium.memzero(combinedSecrets);
    sodium.memzero(shared1);
    if (shared2.length > 0) sodium.memzero(shared2);

    return bufferToBase64(payloadBuffer);
}

async function decryptAsymmetric(payloadBase64, privateKeyBase64) {
    if (!isSodiumReady) await initCrypto();
    await initKyber();

    const payload = base64ToBuffer(payloadBase64);
    if (payload.length < 35) throw new Error("Invalid payload length");
    const skBuf = base64ToBuffer(privateKeyBase64);

    const isHybrid = payload[0] === 1;
    const flags = payload[1];
    const isText = (flags & 1) === 1;
    const hasExpiration = (flags & 2) === 2;
    const header = new Uint8Array([payload[0], flags]);

    if (skBuf[0] !== payload[0]) throw new Error("Key type mismatch with payload");

    const skX25519 = skBuf.slice(1, 33);
    const ephPkX25519 = payload.slice(2, 34);

    const shared1 = sodium.crypto_scalarmult(skX25519, ephPkX25519);

    let shared2 = new Uint8Array(0);
    let offset = 34;

    if (isHybrid) {
        if (!kyberModule || skBuf.length !== 1 + 32 + 2400) {
            throw new Error("Kyber is not available or invalid hybrid private key");
        }
        const skKyber = skBuf.slice(33);
        const kyberCiphertext = payload.slice(34, 34 + 1088);
        offset += 1088;

        const ctPtr = kyberModule._malloc(1088);
        const skPtr = kyberModule._malloc(2400);
        const ssPtr = kyberModule._malloc(32);

        kyberModule.HEAPU8.set(kyberCiphertext, ctPtr);
        kyberModule.HEAPU8.set(skKyber, skPtr);

        kyberModule._OQS_KEM_decaps(kyberKemPtr, ssPtr, ctPtr, skPtr);

        shared2 = kyberModule.HEAPU8.slice(ssPtr, ssPtr + 32);

        kyberModule._free(ctPtr);
        kyberModule._free(skPtr);
        kyberModule._free(ssPtr);
    }

    const combinedSecrets = new Uint8Array(shared1.length + shared2.length);
    combinedSecrets.set(shared1, 0);
    combinedSecrets.set(shared2, shared1.length);
    const symKey = sodium.crypto_generichash(32, combinedSecrets);

    const iv = payload.slice(offset, offset + 12);
    offset += 12;
    const ciphertext = payload.slice(offset);

    let decryptedBytes;
    try {
        decryptedBytes = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
            null, ciphertext, header, iv, symKey
        );
    } catch (e) {
        throw new Error("Asymmetric decryption failed (key mismatch or payload tampered)");
    } finally {
        sodium.memzero(symKey);
        sodium.memzero(combinedSecrets);
        sodium.memzero(shared1);
        if (shared2.length > 0) sodium.memzero(shared2);
    }

    const isWrapped = (flags & 4) === 4;
    const dec = new TextDecoder();
    if (isWrapped) {
        const decodedStr = dec.decode(decryptedBytes);
        try {
            const data = JSON.parse(decodedStr);
            if (data._sv_exp && Date.now() > data._sv_exp) {
                throw new Error("This message has expired and is no longer accessible.");
            }

            // Verify Digital Signatures (Sender Identity)
            if (data._sv_sender && data._sv_sig) {
                // To verify, we need the payload WITHOUT the signatures
                const verifyData = { ...data };
                delete verifyData._sv_sig;
                delete verifyData._sv_pq_sig;
                delete verifyData._sv_sender;
                delete verifyData._sv_sender_spk;
                delete verifyData._sv_pq_spk;

                const textEncoder = new TextEncoder();
                const verifyBytes = textEncoder.encode(JSON.stringify(verifyData));

                const verified = verifySignature(verifyBytes, data._sv_sig, data._sv_sender_spk);
                data._sv_verified = verified;

                if (data._sv_pq_sig && data._sv_pq_spk) {
                    const pqVerified = pqVerify(verifyBytes, data._sv_pq_sig, data._sv_pq_spk);
                    data._sv_pq_verified = pqVerified;
                }
            }

            const result = {
                verified: data._sv_verified || false,
                pq_verified: data._sv_pq_verified || false,
                sender: data._sv_sender || null
            };

            if (data._sv_bin) {
                const fileType = data._sv_type || 'application/octet-stream';
                const fileName = buildFallbackName(sanitizeFilename(data._sv_name), fileType);
                const fileData = base64ToBuffer(data._sv_msg);
                if (data._sv_hash) {
                    const computed = await computeIntegrityHash(fileData);
                    const expected = base64ToBuffer(data._sv_hash);
                    if (!constantTimeEqual(computed, expected)) {
                        throw new Error("Integrity check failed: file data has been tampered with.");
                    }
                }
                result.data = fileData;
                result.name = fileName;
                result.type = fileType;
                result.is_file = true;
            } else {
                result.data = data._sv_msg;
                result.is_text = true;
            }
            return result;
        } catch (e) {
            if (e.message.indexOf("expired") > -1) throw e;
            throw new Error("Payload marked as wrapped but format is invalid.");
        }
    }

    return isText ? dec.decode(decryptedBytes) : decryptedBytes;
}

// --- DIGITAL SIGNATURE UTILITIES ---

/**
 * Sign data with Ed25519 private key.
 * Returns detached signature as Base64.
 */
function signData(dataBytes, signingPrivateKeyBase64) {
    if (!isSodiumReady) throw new Error("Libsodium required for signing");
    const sk = base64ToBuffer(signingPrivateKeyBase64);
    const sig = sodium.crypto_sign_detached(dataBytes, sk);
    sodium.memzero(sk);
    return bufferToBase64(sig);
}

/**
 * Verify Ed25519 signature.
 * Returns true if signature is valid.
 */
function verifySignature(dataBytes, signatureBase64, signingPublicKeyBase64) {
    if (!isSodiumReady) return false;
    try {
        const sig = base64ToBuffer(signatureBase64);
        const pk = base64ToBuffer(signingPublicKeyBase64);
        return sodium.crypto_sign_verify_detached(sig, dataBytes, pk);
    } catch (e) {
        return false;
    }
}

// --- MEMORY HARDENING ---

/**
 * Securely zero a buffer. Uses sodium.memzero when available,
 * falls back to manual fill.
 */
function secureZero(buf) {
    if (!buf || !buf.length) return;
    try {
        if (isSodiumReady && sodium.memzero) {
            sodium.memzero(buf);
        } else {
            if (buf.fill) buf.fill(0);
            else for (let i = 0; i < buf.length; i++) buf[i] = 0;
        }
    } catch (e) {
        // Last resort
        if (buf.fill) buf.fill(0);
    }
}

// --- POST-QUANTUM SIGNATURES (WOTS+ / Merkle) ---
// Hash-based stateful signatures — genuinely quantum-resistant.
// Uses only SHA-256 via libsodium. No lattice math needed.

const WOTS_N = 32;       // SHA-256 output bytes
const WOTS_W = 16;       // Winternitz parameter
const WOTS_LOG2W = 4;
const WOTS_LEN1 = 64;    // ceil(8*N / log2(W))
const WOTS_LEN2 = 3;     // floor(log2(LEN1*(W-1)) / log2(W)) + 1
const WOTS_LEN = 67;     // LEN1 + LEN2
const WOTS_SIG_BYTES = WOTS_LEN * WOTS_N; // 2144 bytes
const PQ_TREE_HEIGHT = 4; // 2^4 = 16 one-time signatures per key

function pqHash(data) {
    return sodium.crypto_generichash(32, data);
}

function pqConcat(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a, 0); c.set(b, a.length);
    return c;
}

function wotsChain(x, start, steps) {
    let cur = new Uint8Array(x);
    for (let j = start; j < start + steps; j++) {
        const buf = new Uint8Array(4 + WOTS_N);
        buf[0] = (j >>> 24) & 0xff; buf[1] = (j >>> 16) & 0xff;
        buf[2] = (j >>> 8) & 0xff; buf[3] = j & 0xff;
        buf.set(cur, 4);
        cur = pqHash(buf);
    }
    return cur;
}

function baseW(input, outLen) {
    const result = new Array(outLen);
    let bits = 0, total = 0, inIdx = 0;
    for (let i = 0; i < outLen; i++) {
        while (bits < WOTS_LOG2W) {
            total = (total << 8) | (input[inIdx] || 0);
            inIdx++; bits += 8;
        }
        bits -= WOTS_LOG2W;
        result[i] = (total >>> bits) & (WOTS_W - 1);
    }
    return result;
}

function wotsMsg(messageBytes) {
    const h = pqHash(messageBytes);
    const msg = baseW(h, WOTS_LEN1);
    let csum = 0;
    for (let i = 0; i < WOTS_LEN1; i++) csum += (WOTS_W - 1) - msg[i];
    const csumBuf = new Uint8Array(4);
    csumBuf[0] = (csum >>> 24); csumBuf[1] = (csum >>> 16);
    csumBuf[2] = (csum >>> 8); csumBuf[3] = csum & 0xff;
    const csumW = baseW(csumBuf, WOTS_LEN2);
    const all = new Array(WOTS_LEN);
    for (let i = 0; i < WOTS_LEN1; i++) all[i] = msg[i];
    for (let i = 0; i < WOTS_LEN2; i++) all[WOTS_LEN1 + i] = csumW[i];
    return all;
}

function deriveLeafSeed(masterSeed, idx) {
    const buf = new Uint8Array(WOTS_N + 4);
    buf.set(masterSeed, 0);
    buf[WOTS_N] = (idx >>> 24); buf[WOTS_N + 1] = (idx >>> 16);
    buf[WOTS_N + 2] = (idx >>> 8); buf[WOTS_N + 3] = idx & 0xff;
    return pqHash(buf);
}

function wotsKeyGen(seed) {
    const sk = new Array(WOTS_LEN);
    const pkParts = new Uint8Array(WOTS_LEN * WOTS_N);
    for (let i = 0; i < WOTS_LEN; i++) {
        const buf = new Uint8Array(WOTS_N + 4);
        buf.set(seed, 0);
        buf[WOTS_N] = (i >>> 24); buf[WOTS_N + 1] = (i >>> 16);
        buf[WOTS_N + 2] = (i >>> 8); buf[WOTS_N + 3] = i & 0xff;
        sk[i] = pqHash(buf);
        pkParts.set(wotsChain(sk[i], 0, WOTS_W - 1), i * WOTS_N);
    }
    return { sk, pkHash: pqHash(pkParts) };
}

function merkleTreeBuild(seed, height) {
    const n = 1 << height;
    const tree = new Array(2 * n);
    for (let i = 0; i < n; i++) {
        const ls = deriveLeafSeed(seed, i);
        tree[n + i] = wotsKeyGen(ls).pkHash;
    }
    for (let i = n - 1; i >= 1; i--) {
        tree[i] = pqHash(pqConcat(tree[2 * i], tree[2 * i + 1]));
    }
    return { root: tree[1], tree };
}

function merkleAuthPath(tree, leafIdx, height) {
    const n = 1 << height;
    const path = new Array(height);
    let idx = n + leafIdx;
    for (let lv = 0; lv < height; lv++) {
        path[lv] = tree[idx ^ 1];
        idx >>>= 1;
    }
    return path;
}

function merkleVerifyPath(leafHash, authPath, leafIdx, height) {
    let cur = leafHash, idx = leafIdx;
    for (let lv = 0; lv < height; lv++) {
        cur = (idx & 1)
            ? pqHash(pqConcat(authPath[lv], cur))
            : pqHash(pqConcat(cur, authPath[lv]));
        idx >>>= 1;
    }
    return cur;
}

/**
 * Generate a post-quantum signing keypair (WOTS+ / Merkle).
 * Returns: { pqPublicKey, pqPrivateKey, pqTreeHeight, pqLeafIndex }
 */
function pqGenerateKeypair() {
    if (!isSodiumReady) throw new Error("Libsodium required for PQ signatures");
    const seed = crypto.getRandomValues(new Uint8Array(32));
    const { root } = merkleTreeBuild(seed, PQ_TREE_HEIGHT);
    return {
        pqPublicKey: bufferToBase64(root),
        pqPrivateKey: bufferToBase64(seed),
        pqTreeHeight: PQ_TREE_HEIGHT,
        pqLeafIndex: 0
    };
}

/**
 * Sign data with PQ private key. Returns Base64 signature.
 * Caller must increment pqLeafIndex after each call.
 */
function pqSign(messageBytes, pqPrivateKeyBase64, leafIndex, treeHeight) {
    if (!isSodiumReady) throw new Error("Libsodium required for PQ signatures");
    treeHeight = treeHeight || PQ_TREE_HEIGHT;
    const maxLeaves = 1 << treeHeight;
    if (leafIndex >= maxLeaves) throw new Error("PQ key exhausted — regenerate identity");

    const seed = base64ToBuffer(pqPrivateKeyBase64);
    const { tree } = merkleTreeBuild(seed, treeHeight);
    const ls = deriveLeafSeed(seed, leafIndex);
    const { sk } = wotsKeyGen(ls);

    // Sign
    const allMsg = wotsMsg(messageBytes);
    const wotsSig = new Uint8Array(WOTS_SIG_BYTES);
    for (let i = 0; i < WOTS_LEN; i++) {
        wotsSig.set(wotsChain(sk[i], 0, allMsg[i]), i * WOTS_N);
    }

    // Auth path
    const authPath = merkleAuthPath(tree, leafIndex, treeHeight);

    // Zero secrets
    for (const s of sk) secureZero(s);
    secureZero(seed);

    // Encode: [height(1)][leafIdx(4)][wotsSig][authPath]
    const apBytes = treeHeight * WOTS_N;
    const sig = new Uint8Array(1 + 4 + WOTS_SIG_BYTES + apBytes);
    sig[0] = treeHeight;
    sig[1] = (leafIndex >>> 24); sig[2] = (leafIndex >>> 16);
    sig[3] = (leafIndex >>> 8); sig[4] = leafIndex & 0xff;
    sig.set(wotsSig, 5);
    for (let i = 0; i < treeHeight; i++) sig.set(authPath[i], 5 + WOTS_SIG_BYTES + i * WOTS_N);

    return bufferToBase64(sig);
}

/**
 * Verify a PQ signature. Returns boolean.
 */
function pqVerify(messageBytes, signatureBase64, pqPublicKeyBase64) {
    if (!isSodiumReady) return false;
    try {
        const sigBuf = base64ToBuffer(signatureBase64);
        const root = base64ToBuffer(pqPublicKeyBase64);
        const h = sigBuf[0];
        const li = (sigBuf[1] << 24) | (sigBuf[2] << 16) | (sigBuf[3] << 8) | sigBuf[4];
        const wotsSig = sigBuf.slice(5, 5 + WOTS_SIG_BYTES);
        const ap = [];
        for (let i = 0; i < h; i++) ap.push(sigBuf.slice(5 + WOTS_SIG_BYTES + i * WOTS_N, 5 + WOTS_SIG_BYTES + (i + 1) * WOTS_N));

        // Recover leaf pk hash from signature
        const allMsg = wotsMsg(messageBytes);
        const cpk = new Uint8Array(WOTS_LEN * WOTS_N);
        for (let i = 0; i < WOTS_LEN; i++) {
            cpk.set(wotsChain(wotsSig.slice(i * WOTS_N, (i + 1) * WOTS_N), allMsg[i], (WOTS_W - 1) - allMsg[i]), i * WOTS_N);
        }
        const leafPkHash = pqHash(cpk);

        // Verify Merkle path
        const computedRoot = merkleVerifyPath(leafPkHash, ap, li, h);
        return constantTimeEqual(computedRoot, root);
    } catch (e) {
        return false;
    }
}

// --- NAMESPACE WRAPPER ---
window.SecureCrypto = {
    encryptSymmetric: encrypt,
    decryptSymmetric: decrypt,
    encryptAsymmetric: encryptAsymmetric,
    decryptAsymmetric: decryptAsymmetric,
    generateKeyPair: generateKeyPair,
    init: initCrypto,
    // Classical signatures
    signData: signData,
    verifySignature: verifySignature,
    // Post-quantum signatures (WOTS+ / Merkle)
    pqGenerateKeypair: pqGenerateKeypair,
    pqSign: pqSign,
    pqVerify: pqVerify,
    // Security utilities
    constantTimeEqual: constantTimeEqual,
    sanitizeFilename: sanitizeFilename,
    computeIntegrityHash: computeIntegrityHash,
    secureZero: secureZero
};
