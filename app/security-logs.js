/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 *
 * audit.js — Offline Security Audit Logger
 * Stores tamper-evident security events in localforage.
 * No network access. All data stays local.
 */
const AuditLog = (() => {
    const STORE_KEY = '_sv_audit_log';
    const MAX_ENTRIES = 500;
    const ANOMALY_THRESHOLD = 5;
    const ANOMALY_WINDOW_MS = 60000;

    const EventType = {
        KEY_GENERATED: 'KEY_GENERATED',
        ENCRYPT_SUCCESS: 'ENCRYPT_SUCCESS',
        DECRYPT_SUCCESS: 'DECRYPT_SUCCESS',
        DECRYPT_FAILED: 'DECRYPT_FAILED',
        INTEGRITY_FAIL: 'INTEGRITY_FAIL',
        UPDATE_BLOCKED: 'UPDATE_BLOCKED',
        UPDATE_APPLIED: 'UPDATE_APPLIED',
        WIPE_EXECUTED: 'WIPE_EXECUTED',
        SIGNATURE_INVALID: 'SIGNATURE_INVALID',
        ANOMALY_DETECTED: 'ANOMALY_DETECTED'
    };

    async function computeHash(entry, prevHash = "") {
        const data = JSON.stringify(entry) + prevHash;
        const msgBuffer = new TextEncoder().encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async function log(eventType, details = {}) {
        try {
            let logs = await localforage.getItem(STORE_KEY) || [];
            const lastEntry = logs[logs.length - 1];
            const prevHash = lastEntry ? lastEntry.hash : "GENESIS";

            const entry = {
                id: (typeof crypto.randomUUID === 'function')
                    ? crypto.randomUUID()
                    : Date.now().toString(36) + Math.random().toString(36).slice(2),
                type: eventType,
                timestamp: Date.now(),
                details
            };

            entry.hash = await computeHash(entry, prevHash);
            
            logs.push(entry);
            if (logs.length > MAX_ENTRIES) logs = logs.slice(-MAX_ENTRIES);
            await localforage.setItem(STORE_KEY, logs);

            if (eventType === EventType.DECRYPT_FAILED) {
                return await checkAnomaly(logs);
            }
            return false;
        } catch (e) {
            console.error("AuditLog Error:", e);
            return false;
        }
    }

    async function checkAnomaly(logs) {
        if (!logs) logs = await localforage.getItem(STORE_KEY) || [];
        const now = Date.now();
        const recent = logs.filter(e =>
            e.type === EventType.DECRYPT_FAILED &&
            (now - e.timestamp) < ANOMALY_WINDOW_MS
        );
        if (recent.length >= ANOMALY_THRESHOLD) {
            // Log the anomaly itself (avoid infinite loop by not re-checking)
            const entry = {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                type: EventType.ANOMALY_DETECTED,
                timestamp: now,
                details: { failureCount: recent.length, windowMs: ANOMALY_WINDOW_MS }
            };
            logs.push(entry);
            await localforage.setItem(STORE_KEY, logs);
            return true; // anomaly detected
        }
        return false;
    }

    async function getAll() {
        return await localforage.getItem(STORE_KEY) || [];
    }

    async function getRecent(count = 50) {
        const all = await getAll();
        return all.slice(-count);
    }

    async function clear() {
        await localforage.setItem(STORE_KEY, []);
    }

    async function verifyChain() {
        const logs = await getAll();
        if (logs.length === 0) return true;
        
        let prevHash = "GENESIS";
        for (const entry of logs) {
            const entryCopy = { ...entry };
            delete entryCopy.hash;
            const expectedHash = await computeHash(entryCopy, prevHash);
            if (entry.hash !== expectedHash) return false;
            prevHash = entry.hash;
        }
        return true;
    }

    async function getStats() {
        const logs = await getAll();
        const stats = {};
        for (const e of logs) stats[e.type] = (stats[e.type] || 0) + 1;
        stats.total = logs.length;
        stats.firstEntry = logs.length ? new Date(logs[0].timestamp).toISOString() : null;
        stats.lastEntry = logs.length ? new Date(logs[logs.length - 1].timestamp).toISOString() : null;
        stats.integrityOk = await verifyChain();
        return stats;
    }

    return { log, getAll, getRecent, clear, getStats, verifyChain, checkAnomaly: () => checkAnomaly(null), EventType };
})();

window.AuditLog = AuditLog;
