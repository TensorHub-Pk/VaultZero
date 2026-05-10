/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * app.js — VaultZero UI Controller
 * Dual-UI: Mobile App + Desktop Command Center
 */

let APP_VERSION = '3.0.0 Stable';
let deferredInstallPrompt = null;
let swRegistration = null;

const State = {
    view: 'symmetric',
    sym: { mode: 'encrypt', type: 'text', stego: false, timer: false },
    asym: { mode: 'encrypt', type: 'text', stego: false, timer: false },
    id: { publicKey: null, privateKey: null },
    airGap: false,
    pass: { entries: [], unlocked: false, masterKey: null, vaultId: null, lastSync: 0, syncStatus: 'idle' }
};

// --- REAL-TIME TAB RELAY ---
const SyncRelay = new BroadcastChannel('vaultzero_sync_relay');
SyncRelay.onmessage = async (event) => {
    if (!event.data) return;

    // 1. Handle HELLO (A new tab just opened/unlocked and needs current data)
    if (event.data.type === 'HELLO') {
        console.log("[Local Mesh] New tab detected. Broadcasting current state.");
        performCloudPulse(); // Send our current state to the new tab
        return;
    }

    // 2. Handle PULSE (Incoming data from another tab)
    if (event.data.type === 'PULSE') {
        // Ensure we have the same Vault ID as the sender (in case we just opened)
        if (!State.pass.vaultId) await ensureVaultId();

        if (event.data.vaultId === State.pass.vaultId) {
            console.log("[Local Mesh] Pulse Received:", event.data.vaultId);
            handleRemotePulse(event.data.payload);
        } else {
            console.warn("[Local Mesh] Pulse Rejected (ID Mismatch):", event.data.vaultId, "vs", State.pass.vaultId);
        }
    }

    // 3. Handle WIPE_SIGNAL (Propagation of vault deletion)
    if (event.data.type === 'WIPE_SIGNAL') {
        if (event.data.vaultId === State.pass.vaultId) {
            console.warn("[Local Mesh] WIPE SIGNAL RECEIVED. Clearing local vault...");
            localforage.clear().then(() => location.reload());
        }
    }
};

const El = {
    // Initialized in start()
    nav: {}, sideNav: {}, views: {}, sym: {}, asym: {}, version: {}
};

async function initElements() {
    El.nav = {
        sym: document.getElementById('nav-symmetric'),
        asym: document.getElementById('nav-asymmetric'),
        id: document.getElementById('nav-identity'),
        pass: document.getElementById('nav-passwords')
    };
    El.sideNav = {
        sym: document.getElementById('header-nav-sym'),
        asym: document.getElementById('header-nav-asym'),
        id: document.getElementById('header-nav-identity'),
        pass: document.getElementById('header-nav-passwords')
    };
    El.views = {
        sym: document.getElementById('view-symmetric'),
        asym: document.getElementById('view-asymmetric'),
        id: document.getElementById('view-identity'),
        pass: document.getElementById('view-passwords')
    };
    El.topbarTitle = document.getElementById('desktop-view-title');
    El.toast = document.getElementById('status-toast');
    El.infoModal = {
        root: document.getElementById('info-modal'),
        title: document.getElementById('info-modal-title'),
        icon: document.getElementById('info-modal-icon'),
        content: document.getElementById('info-modal-content')
    };

    El.sym = {
        btns: { enc: document.getElementById('btn-encrypt-sym'), dec: document.getElementById('btn-decrypt-sym') },
        tabs: { text: document.getElementById('tab-input-text-sym'), file: document.getElementById('tab-input-file-sym') },
        pass: document.getElementById('password-sym'),
        msg: document.getElementById('message-sym'),
        fileInput: document.getElementById('target-file-sym'),
        fileBox: document.getElementById('file-input-container'),
        fileLabel: document.getElementById('file-label-sym'),
        stegoToggle: document.getElementById('stego-toggle-sym'),
        stegoBox: document.getElementById('stego-file-container-sym'),
        stegoInput: document.getElementById('stego-file-sym'),
        stegoDropZone: document.getElementById('stego-drop-zone-sym'),
        stegoLabel: document.getElementById('stego-label-sym'),
        timerToggle: document.getElementById('timer-toggle-sym'),
        timerBox: document.getElementById('timer-options-sym'),
        timerSelect: document.getElementById('timer-select-sym'),
        deviceLock: document.getElementById('device-lock-sym'),
        passStrength: document.getElementById('pass-strength-sym')?.querySelector('.pass-strength-fill'),
        passHint: document.getElementById('pass-hint-sym'),
        resBadge: document.getElementById('res-badge-sym'),
        action: document.getElementById('btn-action-sym'),
        actionText: document.getElementById('btn-action-text-sym'),
        resultArea: document.getElementById('result-area-sym'),
        resultText: document.getElementById('result-text-sym'),
        copy: document.getElementById('btn-copy-sym'),
        copyLink: document.getElementById('btn-copy-link-sym'),
        download: document.getElementById('btn-download-sym'),
        optionsArea: document.getElementById('sym-options-area')
    };

    El.asym = {
        btns: { enc: document.getElementById('btn-encrypt-asym'), dec: document.getElementById('btn-decrypt-asym') },
        keyInput: document.getElementById('key-input-asym'),
        keyLabel: document.getElementById('asym-key-label'),
        msg: document.getElementById('message-asym'),
        msgReceive: document.getElementById('message-asym-receive'),
        stegoToggle: document.getElementById('stego-toggle-asym'),
        stegoBox: document.getElementById('stego-file-container-asym'),
        stegoInput: document.getElementById('stego-file-asym'),
        stegoDropZone: document.getElementById('stego-drop-zone-asym'),
        stegoLabel: document.getElementById('stego-label-asym'),
        timerToggle: document.getElementById('timer-toggle-asym'),
        timerBox: document.getElementById('timer-options-asym'),
        timerSelect: document.getElementById('timer-select-asym'),
        resBadge: document.getElementById('res-badge-asym'),
        action: document.getElementById('btn-action-asym'),
        actionReceive: document.getElementById('btn-action-asym-receive'),
        actionText: document.getElementById('btn-action-text-asym'),
        resultArea: document.getElementById('result-area-asym'),
        resultText: document.getElementById('result-text-asym'),
        copy: document.getElementById('btn-copy-asym'),
        copyLink: document.getElementById('btn-copy-link-asym'),
        download: document.getElementById('btn-download-asym'),
        optionsArea: document.getElementById('asym-options-area'),
        typeSwitch: document.getElementById('asym-type-switch'),
        tabs: { text: document.getElementById('tab-input-text-asym'), file: document.getElementById('tab-input-file-asym') },
        fileInput: document.getElementById('target-file-asym'),
        fileBox: document.getElementById('file-input-container-asym'),
        fileLabel: document.getElementById('file-label-asym'),
        fileInputReceive: document.getElementById('target-file-asym-receive'),
        fileBoxReceive: document.getElementById('file-input-container-asym-receive'),
        fileLabelReceive: document.getElementById('file-label-asym-receive'),
        sendForm: document.getElementById('asym-send-form'),
        receiveForm: document.getElementById('asym-receive-form'),
        cardDesc: document.getElementById('asym-card-desc')
    };

    El.id = {
        gen: document.getElementById('btn-generate-keys-id'),
        display: document.getElementById('my-public-display'),
        privTimer: document.getElementById('private-key-timer'),
        privDownload: document.getElementById('btn-download-private-id'),
        copyPub: document.getElementById('btn-copy-public-id'),
        shareLink: document.getElementById('btn-share-link-id'),
        unlock: document.getElementById('btn-unlock-id'),
        badge: document.getElementById('identity-status-badge'),
        securityHint: document.getElementById('security-hint-text'),
        mobileIcon: document.getElementById('mobile-identity-icon'),
        audit: {
            list: document.getElementById('audit-log-list'),
            integrity: document.getElementById('audit-integrity-badge'),
            total: document.getElementById('audit-stat-total'),
            anomalies: document.getElementById('audit-stat-anomalies'),
            last: document.getElementById('audit-stat-last'),
            integrityText: document.getElementById('audit-stat-integrity'),
            refresh: document.getElementById('btn-refresh-audit'),
            airGap: document.getElementById('air-gap-toggle'),
            heartbeat: document.getElementById('audit-stat-heartbeat')
        }
    };

    El.install = {
        sidebar: document.getElementById('btn-install-header'),
        mobile: document.getElementById('btn-install-mobile')
    };

    El.version = {
        headerNavBtn: document.getElementById('header-nav-update'),
        mobileNavBtn: document.getElementById('mobile-nav-update'),
        confirmUpdateBtn: document.getElementById('btn-confirm-update'),
        desktopVText: document.getElementById('header-version-text'),
        mobileVText: document.getElementById('mobile-v-text'),
        statusText: document.getElementById('header-status-text'),
        statusDots: document.querySelectorAll('.status-dot'),
        airGapDesktop: document.getElementById('header-airgap-desktop'),
        airGapMobile: document.getElementById('header-airgap-mobile-nav'),
        isolationContainer: document.getElementById('status-container-isolation'),
        navPass: document.getElementById('header-nav-passwords'),
        mobileNavPass: document.getElementById('nav-passwords')
    };

    El.pass = {
        view: document.getElementById('view-passwords'),
        choice: document.getElementById('pass-manager-choice'),
        setup: document.getElementById('pass-manager-setup'),
        setupPin: document.getElementById('pass-setup-pin'),
        setupBtn: document.getElementById('btn-setup-passwords'),
        locked: document.getElementById('pass-manager-locked'),
        active: document.getElementById('pass-manager-active'),
        pin: document.getElementById('pass-master-pin'),
        unlockBtn: document.getElementById('btn-unlock-passwords'),
        lockBtn: document.getElementById('btn-lock-passwords'),
        search: document.getElementById('pass-search'),
        list: document.getElementById('pass-list'),
        addBtn: document.getElementById('btn-add-pass'),
        syncBtn: document.getElementById('btn-sync-passwords'),
        countBadge: document.getElementById('pass-count-badge'),
        countText: document.getElementById('pass-count-text'),
        strengthBar: document.getElementById('pass-strength-fill'),
        strengthLabel: document.getElementById('pass-strength-label')
    };

    El.loader = {
        root: document.getElementById('app-loader'),
        title: document.getElementById('loader-title'),
        status: document.getElementById('loader-status'),
        progressContainer: document.getElementById('loader-progress-container'),
        progressFill: document.getElementById('loader-progress-fill')
    };
}

function showLoader(title, status, showProgress = false) {
    if (!El.loader || !El.loader.root) return;
    El.loader.title.textContent = title;
    El.loader.status.textContent = status;
    El.loader.progressContainer.classList.toggle('hidden', !showProgress);
    if (showProgress) El.loader.progressFill.style.width = '0%';
    El.loader.root.classList.remove('hidden');
}

function updateLoaderProgress(percent) {
    if (El.loader && El.loader.progressFill) {
        El.loader.progressFill.style.width = percent + '%';
    }
}

function hideLoader() {
    if (El.loader && El.loader.root) {
        El.loader.root.classList.add('hidden');
    }
}

/**
 * Simulations: Premium "fake" progress animation 
 * Starts fast, slows down at 95%, hits 100% on actual completion
 */
function simulateProgress(duration = 2000) {
    let progress = 0;
    const interval = 30;
    const startTime = Date.now();

    const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = 96 - progress;

        // Progress should at least match the elapsed time ratio vs duration
        const timeRatio = Math.min(elapsed / duration, 1);
        const targetProgress = 96 * timeRatio;

        if (progress < targetProgress) {
            progress += (targetProgress - progress) * 0.1 + (Math.random() * 0.5);
        } else {
            progress += Math.random() * 0.1;
        }

        if (progress >= 96) {
            progress = 96;
            clearInterval(timer);
        }
        updateLoaderProgress(progress);
    }, interval);

    return {
        finish: (onComplete = null) => {
            clearInterval(timer);
            const currentPos = progress;
            let finalStep = 0;
            const finalTimer = setInterval(() => {
                finalStep += 5;
                const pos = currentPos + (100 - currentPos) * (finalStep / 100);
                updateLoaderProgress(pos);
                if (finalStep >= 100) {
                    clearInterval(finalTimer);
                    setTimeout(() => {
                        hideLoader();
                        if (onComplete) onComplete();
                    }, 400);
                }
            }, 16);
        },
        kill: () => clearInterval(timer)
    };
}

function openInfoModal(topic) {
    const data = {
        vault: {
            title: "Secret Vault",
            icon: "ph-lock-key",
            text: "This is your personal digital safe. Lock notes, passwords, or documents locally on this device. Everything is scrambled using AES-256-GCM, the same security banks use."
        },
        share: {
            title: "Secure Share",
            icon: "ph-share-network",
            text: "Send locked messages directly to a friend. You seal the data with their unique ID so that *only their device* can open it. Even if the message is intercepted, it is impossible to read without their key."
        },
        identity: {
            title: "My Digital Identity",
            icon: "ph-fingerprint",
            text: "This card contains your Public Key. Think of it like your digital mailing address. It allows others to send you secure messages without ever knowing your actual name or location."
        },
        stego: {
            title: "Steganography",
            icon: "ph-image",
            text: "Hides your secret data *inside* a normal-looking photo. To any observer, it's just an image, but it actually contains your encrypted message hidden between the pixels."
        },
        expiration: {
            title: "Auto-Delete",
            icon: "ph-hourglass-low",
            text: "When enabled, the message will permanently delete itself from our transient buffers after the first time it is opened, or once the expiration timer runs out."
        },
        device_lock: {
            title: "Hardware Device Lock",
            icon: "ph-cpu",
            text: "This is the ultimate security layer. It binds the encryption to THIS specific device using a unique local hardware key. Even if someone steals your file AND your password, they cannot decrypt it on any other computer."
        },
        recipient: {
            title: "Recipient Link",
            icon: "ph-user-focus",
            text: "Paste your friend's Public Key here. This tells the app exactly which digital lock to use so only your friend can open the message."
        },
        signing: {
            title: "Digital Identity Signature",
            icon: "ph-signature",
            text: "When enabled, the message is cryptographically signed using your private identity. This allows the recipient to be 100% sure the message came from you and hasn't been tampered with."
        },
        quantum: {
            title: "Post-Quantum Security",
            icon: "ph-atom",
            text: "VaultZero uses ML-KEM (Kyber) to protect against future quantum computers. Your communication is safe today, and will remain safe years from now."
        },
        error: {
            title: "Security Block",
            icon: "ph-shield-warning",
            text: "This link contains invalid data. To protect you from potential tracking or attacks, we have blocked this action. Please request a new link."
        }
    };

    const info = data[topic];
    if (!info) return;

    El.infoModal.root.querySelector('.install-modal-card').innerHTML = `
        <div class="info-modal-anim-content">
            <button class="install-modal-close" onclick="this.parentElement.parentElement.parentElement.classList.remove('active'); setTimeout(()=>this.parentElement.parentElement.parentElement.classList.add('hidden'),300); document.querySelector('.app-shell')?.classList.remove('shell-modal-active');">
                <i class="ph ph-duotone ph-x" style="font-size: 24px;"></i>
            </button>
            <div class="install-modal-icon info-modal-icon-bounce" style="background: none;">
              <i class="ph ph-duotone ${info.icon}" style="font-size: 60px; color: var(--accent);"></i>
            </div>
            <h2 class="install-modal-title" style="margin-top: -10px;">${info.title}</h2>
            <div style="text-align: center; color: var(--text-secondary); line-height: 1.7; margin-top: 15px; font-size: 15px; padding: 0 10px;">
              ${info.text}
            </div>
            <div style="margin-top: 30px">
              <button class="action-btn primary-action" style="width: 100%;" onclick="this.parentElement.parentElement.parentElement.parentElement.classList.remove('active'); setTimeout(()=>this.parentElement.parentElement.parentElement.parentElement.classList.add('hidden'),300); document.querySelector('.app-shell')?.classList.remove('shell-modal-active');">
                Got it, thanks!
              </button>
            </div>
        </div>
    `;

    El.infoModal.root.classList.remove('hidden');
    document.querySelector('.app-shell')?.classList.add('shell-modal-active');
    requestAnimationFrame(() => El.infoModal.root.classList.add('active'));
}

let _privKeyTimer;
function startPrivateKeyTimer(publicKey, privateKey) {
    let timeLeft = 120; // 2 minutes
    if (_privKeyTimer) clearInterval(_privKeyTimer);

    // Store in transient state for buttons
    State.id.publicKey = publicKey;
    State.id.privateKey = privateKey;

    // Explicit UI Updates for Private Mode
    if (El.id.display) {
        El.id.display.value = privateKey;
        El.id.display.style.color = "var(--red)";
    }

    if (El.id.securityHint) El.id.securityHint.classList.remove('hidden');
    if (El.id.privTimer) El.id.privTimer.classList.remove('hidden');
    if (El.id.unlock) El.id.unlock.classList.add('hidden');

    if (El.id.privDownload) {
        El.id.privDownload.classList.remove('hidden');
        El.id.privDownload.onclick = async () => {
            const confirmed = await customConfirm("WARNING: Your private key is sensitive! NEVER share it with anyone. Access to this key means access to all your encrypted data. Proceed with download?", "Security Alert");
            if (confirmed) {
                const blob = new Blob([privateKey], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                downloadFile(url, `vaultzero_private_key_${Date.now()}.txt`);
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }
        };
    }

    const updateDisplay = () => {
        if (!El.id.privTimer) return;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        El.id.privTimer.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

        if (timeLeft <= 30) {
            El.id.privTimer.style.background = 'var(--red)';
            El.id.privTimer.style.color = '#fff';
        }
    };

    updateDisplay();
    updateIdentityStatus();

    _privKeyTimer = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(_privKeyTimer);
            _privKeyTimer = null;

            // Security: Purge sensitive data completely
            State.id.privateKey = null;

            if (El.id.display) {
                El.id.display.value = State.id.publicKey || "LOCKED. Please unlock.";
                El.id.display.style.color = "";
            }

            if (El.id.privTimer) El.id.privTimer.classList.add('hidden');
            if (El.id.securityHint) El.id.securityHint.classList.add('hidden');
            if (El.id.privDownload) El.id.privDownload.classList.add('hidden');
            if (El.id.unlock) El.id.unlock.classList.remove('hidden');

            updateIdentityStatus();
            toast("Security: Sensitive data purged.", "info");
        }
    }, 1000);
}

function initShareAutoFill() {
    try {
        const params = new URLSearchParams(window.location.search);
        let hashParams = new URLSearchParams();
        if (window.location.hash.includes('?')) {
            hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
        } else if (window.location.hash.startsWith('#')) {
            const hash = window.location.hash.substring(1);
            if (hash.includes('=')) hashParams = new URLSearchParams(hash);
            else hashParams.set('data', hash); // Fallback for raw data in hash
        }

        const getParam = (name) => params.get(name) || hashParams.get(name);

        const type = getParam('type');
        let data = getParam('data') || getParam('payload');
        const key = getParam('key') || getParam('pk');
        const pubkey = getParam('pubkey');

        // Case 1: Friend's Public ID Link
        if (pubkey || type === 'public_key' || (data && (data.length === 44 || data.length === 1248))) {
            const pk = pubkey || data;
            if (pk && pk.length > 20) {
                switchMainTab('asymmetric');
                setOpModeAsym('encrypt');
                El.asym.keyInput.value = decodeURIComponent(pk);
                checkAsym();
                toast("Friend's Public ID auto-filled!", "success");
                window.history.replaceState({}, '', window.location.pathname);
                return;
            }
        }

        if (!type && !data) return;

        const decodedData = decodeURIComponent(data || '');

        if (type === 'vault_item' || type === 'vault') {
            switchMainTab('symmetric');
            setOpMode('decrypt');
            El.sym.msg.value = decodedData;
            checkSym();
        } else if (type === 'encrypted_message' || type === 'msg') {
            switchMainTab('asymmetric');
            setOpModeAsym('decrypt');
            if (El.asym.msgReceive) El.asym.msgReceive.value = decodedData;
            checkAsym();
        } else if (decodedData.startsWith('vVault') || decodedData.length > 100) {
            // Smart auto-detect if no type but data looks valid
            if (decodedData.startsWith('vVault')) {
                switchMainTab('asymmetric');
                setOpModeAsym('decrypt');
                if (El.asym.msgReceive) El.asym.msgReceive.value = decodedData;
                checkAsym();
            } else {
                switchMainTab('symmetric');
                setOpMode('decrypt');
                El.sym.msg.value = decodedData;
                checkSym();
            }
        }

        toast(`Secure content auto-filled!`, "success");
        window.history.replaceState({}, '', window.location.pathname);
    } catch (e) {
        openInfoModal('error');
    }
}

function showUpdatePrompt(isCritical = false) {
    window._isUpdateWaiting = true;

    // 1. Universal Nav Update Buttons
    if (El.version.mobileNavBtn) El.version.mobileNavBtn.classList.remove('hidden');
    if (El.version.headerNavBtn) El.version.headerNavBtn.classList.remove('hidden');

    // 2. Proactive Modal for critical updates
    if (isCritical) {
        const modal = document.getElementById('update-confirm-modal');
        if (modal && modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('active'), 100);
            toast("Critical security update available!", "warning");
        }
    } else {
        toast("A new version of VaultZero is ready.", "success");
    }
}

async function checkForUpdates() {
    if (window._isCheckingUpdate) return;
    window._isCheckingUpdate = true;

    try {
        const installedVersion = await localforage.getItem('app_version') || '1.0';
        const fetcher = window._nativeFetch || fetch;

        const res = await fetcher('update-info.json?t=' + Date.now(), {
            cache: 'no-cache'
        });

        if (res.ok) {
            const manifest = await res.json();
            const serverVersion = manifest.version;

            const integrityOk = await verifyScriptIntegrity(manifest);
            if (!integrityOk) return;

            if (compareVersions(serverVersion, installedVersion) > 0) {
                showUpdatePrompt(true);
            }
        }
    } catch (e) { } finally {
        window._isCheckingUpdate = false;
    }
}

function openInstallModal() {
    const modal = document.getElementById('install-modal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.querySelector('.app-shell')?.classList.add('shell-modal-active');
    requestAnimationFrame(() => modal.classList.add('active'));
}

// --- INITIALIZE ---
async function start() {
    try {
        await initElements();
        showLoader("Securing Environment", "Initializing cryptographic modules...", true);

        // Safety timeout: If initialization takes > 8s, force hide loader
        // This prevents the app from being unusable on slow mobile networks or old devices
        const safetyLoaderTimeout = setTimeout(() => {
            hideLoader();
        }, 8000);

        initNetworkStatus();

        // SEO & Privacy: Dynamically prevent indexing of private/sensitive routes
        function enforcePrivacySEO() {
            const url = new URL(window.location.href);
            const hasPayload = url.hash.includes('payload=');

            if (hasPayload || url.searchParams.has('payload') || url.searchParams.has('id') || url.searchParams.has('pubkey')) {
                let meta = document.createElement('meta');
                meta.name = "robots";
                meta.content = "noindex, nofollow";
                document.head.appendChild(meta);
            }
        }
        enforcePrivacySEO();

        // Setup install button listeners
        if (El.install.sidebar) El.install.sidebar.addEventListener('click', triggerInstallPrompt);
        if (El.install.mobile) El.install.mobile.addEventListener('click', triggerInstallPrompt);

        updateInstallUI();
        listeners();
        theme();
        checkCacheAge();

        // Critical Security Init
        try {
            await updateIdentityStatus();
            await SecureCrypto.init();

            // Check for updates only if not in Air-Gap mode
            const airGapSaved = await localforage.getItem('vaultzero_airgap');
            const airGapTs = await localforage.getItem('vaultzero_airgap_timestamp') || 0;
            const AIRGAP_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

            if (airGapSaved) {
                // NEW: Auto-Disable Air-Gap after 24 hours to allow fresh sync attempt
                if (Date.now() - airGapTs > AIRGAP_EXPIRY) {
                    console.log("Security Notice: Air-Gap cooldown expired. Attempting fresh security check.");
                    await localforage.removeItem('vaultzero_airgap');
                    await localforage.removeItem('vaultzero_airgap_timestamp');
                    State.airGap = false;
                    await initVersionControl();
                } else {
                    State.airGap = true;
                    if (El.id.audit.airGap) El.id.audit.airGap.checked = true;
                    await setAirGap(true);
                }
            } else {
                await initVersionControl();
            }
        } catch (initErr) {
            console.error("Init Error:", initErr);
        }

        initShareAutoFill();
        await ensureVaultId();
        await checkPassVaultStatus();

        const idData = await localforage.getItem('my_identity');
        const pubId = await localforage.getItem('my_public_id');

        if (pubId) {
            State.id.publicKey = pubId;
            if (El.id.display) El.id.display.value = pubId;
        } else if (idData) {
            if (El.id.display) El.id.display.value = "INITIALIZING...";
        } else {
            if (El.id.display) El.id.display.value = "Identity not generated. Start below.";
        }
        updateIdentityStatus();

        // Finalize UI
        clearTimeout(safetyLoaderTimeout);

        let sessionStart = localStorage.getItem('vaultzero_last_load');
        if (!sessionStart) {
            sessionStart = Date.now().toString();
            localStorage.setItem('vaultzero_last_load', sessionStart);
        }

        // Apply offline shield ONLY if explicitly requested or on security breach
        const sim = simulateProgress(400);
        setTimeout(() => {
            sim.finish(() => {
                // REMOVED: Auto-isolation mode disabled by user request
                // if (!State.airGap) goOffline();
                hideLoader();
            });
        }, 600);
    } catch (fatalErr) {
        console.error("Fatal Start Error:", fatalErr);
        hideLoader();
        toast("App failed to start securely. Please refresh.", "error");
    }
}

function goOffline() {
    const blockedFn = (name) => () => { throw new Error('OFFLINE_LOCKDOWN: ' + name + ' blocked.'); };
    const blockedFetch = () => Promise.reject(new Error('OFFLINE_LOCKDOWN: Network access disabled for this session.'));

    if (!window._nativeFetch) window._nativeFetch = window.fetch;

    // Harden: use Object.defineProperty to prevent reassignment/deletion
    Object.defineProperty(window, 'fetch', { value: blockedFetch, writable: false, configurable: true });
    Object.defineProperty(window, 'XMLHttpRequest', { value: blockedFn('XHR'), writable: false, configurable: false });
    Object.defineProperty(window, 'WebSocket', { value: blockedFn('WebSocket'), writable: false, configurable: false });
    Object.defineProperty(window, 'EventSource', { value: blockedFn('EventSource'), writable: false, configurable: false });

    if (navigator.sendBeacon) {
        Object.defineProperty(navigator, 'sendBeacon', { value: () => false, writable: false, configurable: false });
    }

    window._offlineLocked = true;

    if (El.version.statusText) {
        El.version.statusText.textContent = 'ISOLATION';
        El.version.statusText.style.fontWeight = '900';
        El.version.statusText.style.color = '#22c55e';
    }
    if (El.version.statusDots) {
        El.version.statusDots.forEach(dot => {
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.6)';
            dot.classList.remove('offline');
            dot.classList.add('online');
            dot.classList.add('secure-pulse');
        });
    }
    const statusBar = document.querySelector('.header-status-area');
    if (statusBar) {
        statusBar.title = 'Environment Verified & Sealed Offline';
    }
}

const nativeShare = (data, btn) => {
    if (navigator.share) {
        navigator.share(data).catch(() => copyTxt(data.url || data.text, btn));
    } else {
        copyTxt(data.url || data.text, btn);
    }
};

const sharePayload = (text, btn) => {
    if (!text || text.includes('RESTORED') || text.includes('BINARY DATA')) {
        return toast("No encrypted content to share. Please encrypt something first.", "warning");
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const isAsym = btn.id.includes('asym') || (text && text.startsWith('vVault'));
    const type = isAsym ? 'msg' : 'vault';

    const link = `${baseUrl}?type=${type}&data=${encodeURIComponent(text)}`;

    nativeShare({
        title: isAsym ? 'Secure Share Content' : 'Secret Vault Content',
        text: isAsym ? 'I sent you a PK-encrypted message. Open it here:' : 'I shared a password-protected vault with you. Open it here:',
        url: link
    }, btn);
};

function listeners() {
    [El.sym.pass, El.sym.msg].forEach(i => i.addEventListener('input', () => {
        checkSym();
    }));

    El.sym.stegoToggle.addEventListener('change', () => {
        State.sym.stego = El.sym.stegoToggle.checked;
        El.sym.stegoBox.classList.toggle('hidden', !State.sym.stego);
        checkSym();
    });

    El.sym.timerToggle.addEventListener('change', () => {
        State.sym.timer = El.sym.timerToggle.checked;
        El.sym.timerBox.classList.toggle('hidden', !State.sym.timer);
    });

    El.sym.fileInput.addEventListener('change', () => {
        const file = El.sym.fileInput.files[0];
        if (file) {
            if (!validateFile(file, 'text', State.sym.mode)) {
                El.sym.fileInput.value = '';
                El.sym.fileLabel.textContent = "Click to attach file";
                El.sym.fileBox.classList.remove('success');
                checkSym();
                return;
            }
            El.sym.fileLabel.textContent = `Attached: ${file.name}`;
            El.sym.fileBox.classList.add('success');
            toast(`Ready: ${file.name}`);
        } else {
            El.sym.fileLabel.textContent = "Click to attach file";
            El.sym.fileBox.classList.remove('success');
        }
        checkSym();
    });

    [El.asym.keyInput, El.asym.msg, El.asym.msgReceive].forEach(i => { if (i) i.addEventListener('input', checkAsym) });

    El.asym.stegoToggle.addEventListener('change', () => {
        State.asym.stego = El.asym.stegoToggle.checked;
        El.asym.stegoBox.classList.toggle('hidden', !State.asym.stego);
        checkAsym();
    });



    El.sym.stegoInput.addEventListener('change', () => {
        const file = El.sym.stegoInput.files[0];
        if (file) {
            if (!validateFile(file, 'image', State.sym.mode)) {
                El.sym.stegoInput.value = '';
                if (El.sym.stegoLabel) El.sym.stegoLabel.textContent = 'Click or drop image here';
                if (El.sym.stegoDropZone) El.sym.stegoDropZone.classList.remove('success');
                checkSym();
                return;
            }
            if (El.sym.stegoLabel) El.sym.stegoLabel.textContent = `Image: ${file.name}`;
            if (El.sym.stegoDropZone) El.sym.stegoDropZone.classList.add('success');
            toast(`Image ready: ${file.name}`);
        } else {
            if (El.sym.stegoLabel) El.sym.stegoLabel.textContent = 'Click or drop image here';
            if (El.sym.stegoDropZone) El.sym.stegoDropZone.classList.remove('success');
        }
        checkSym();
    });

    El.asym.stegoInput.addEventListener('change', () => {
        const file = El.asym.stegoInput.files[0];
        if (file) {
            if (!validateFile(file, 'image', State.asym.mode)) {
                El.asym.stegoInput.value = '';
                if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = 'Click or drop image here';
                if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.remove('success');
                checkAsym();
                return;
            }
            if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = `Image: ${file.name}`;
            if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.add('success');
            toast(`Image ready: ${file.name}`);
        } else {
            if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = 'Click or drop image here';
            if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.remove('success');
        }
        checkAsym();
    });

    El.asym.timerToggle.addEventListener('change', () => {
        State.asym.timer = El.asym.timerToggle.checked;
        El.asym.timerBox.classList.toggle('hidden', !State.asym.timer);
    });

    El.asym.fileInput.addEventListener('change', () => {
        const file = El.asym.fileInput.files[0];
        if (file) {
            if (!validateFile(file, 'text', State.asym.mode)) {
                El.asym.fileInput.value = '';
                El.asym.fileLabel.textContent = "Click to attach file";
                El.asym.fileBox.classList.remove('success');
                checkAsym();
                return;
            }
            El.asym.fileLabel.textContent = `Attached: ${file.name}`;
            El.asym.fileBox.classList.add('success');
            toast(`Ready: ${file.name}`);
        } else {
            El.asym.fileLabel.textContent = "Click to attach file";
            El.asym.fileBox.classList.remove('success');
        }
        checkAsym();
    });

    if (El.asym.fileInputReceive) {
        El.asym.fileInputReceive.addEventListener('change', () => {
            const file = El.asym.fileInputReceive.files[0];
            if (file) {
                if (!validateFile(file, 'text', State.asym.mode)) {
                    El.asym.fileInputReceive.value = '';
                    El.asym.fileLabelReceive.textContent = "Drop encrypted file";
                    El.asym.fileBoxReceive.classList.remove('success');
                    checkAsym();
                    return;
                }
                El.asym.fileLabelReceive.textContent = `File: ${file.name}`;
                El.asym.fileBoxReceive.classList.add('success');
                toast(`File ready: ${file.name}`);
            } else {
                El.asym.fileLabelReceive.textContent = "Drop encrypted file";
                El.asym.fileBoxReceive.classList.remove('success');
            }
            checkAsym();
        });
    }

    El.sym.action.addEventListener('click', runSym);
    El.asym.action.addEventListener('click', runAsym);
    if (El.asym.actionReceive) El.asym.actionReceive.addEventListener('click', runAsym);


    El.id.audit.refresh?.addEventListener('click', () => {
        renderAuditTrail();
        toast("Audit trail updated.", "success");
    });

    El.id.audit.clear?.addEventListener('click', async () => {
        if (await customConfirm("Clear all security logs? This will also reset the tamper-evident chain.", "Clear Audit Trail")) {
            await AuditLog.clear();
            renderAuditTrail();
            toast("Audit trail wiped.", "warning");
        }
    });

    El.sym.copy.addEventListener('click', () => copyTxt(El.sym.resultText.textContent, El.sym.copy));
    El.sym.copyLink.addEventListener('click', () => sharePayload(El.sym.resultText.textContent, El.sym.copyLink));

    El.id.copyPub.addEventListener('click', () => {
        const pk = State.id.publicKey || El.id.display.value;
        if (!pk || pk.length < 20) return toast("Identity not ready. Please generate one first.", "warning");
        copyTxt(pk, El.id.copyPub);
    });

    if (El.asym.copy) {
        El.asym.copy.addEventListener('click', () => copyTxt(El.asym.resultText.textContent, El.asym.copy));
    }
    if (El.asym.copyLink) {
        El.asym.copyLink.addEventListener('click', () => sharePayload(El.asym.resultText.textContent, El.asym.copyLink));
    }

    El.id.shareLink.addEventListener('click', () => {
        const pk = State.id.publicKey || (El.id.display.value.length > 20 ? El.id.display.value : null);
        if (!pk) return toast("Your ID isn't ready. Please generate one first.", "warning");
        const link = window.location.origin + window.location.pathname + "?type=public_key&data=" + encodeURIComponent(pk);
        nativeShare({
            title: 'My Secure ID',
            text: 'Here is my public ID for VaultZero:',
            url: link
        }, El.id.shareLink);
    });

    El.id.gen.addEventListener('click', rotateId);
    if (El.id.unlock) El.id.unlock.addEventListener('click', fillMyKey);

    El.id.audit.airGap?.addEventListener('change', () => {
        setAirGap(El.id.audit.airGap.checked);
    });

    [El.version.airGapDesktop, El.version.airGapMobile].forEach(btn => {
        btn?.addEventListener('click', () => setAirGap(!State.airGap));
    });

    if (El.version.confirmUpdateBtn) {
        El.version.confirmUpdateBtn.addEventListener('click', triggerAppUpdate);
    }
    if (El.version.mobileNavBtn) El.version.mobileNavBtn.addEventListener('click', triggerAppUpdate);

    // --- Password Manager Listeners ---
    El.pass.setupBtn?.addEventListener('click', () => unlockPasswords(El.pass.setupPin.value, true));
    El.pass.setupPin?.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlockPasswords(El.pass.setupPin.value, true); });
    El.pass.unlockBtn?.addEventListener('click', () => unlockPasswords(El.pass.pin.value));
    El.pass.pin?.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlockPasswords(El.pass.pin.value); });
    El.pass.lockBtn?.addEventListener('click', lockPasswords);
    El.pass.addBtn?.addEventListener('click', addPasswordEntry);
    El.pass.search?.addEventListener('input', (e) => renderPasswords(e.target.value));
    El.pass.syncBtn?.addEventListener('click', syncPasswords);

    // PIN strength indicator
    El.pass.setupPin?.addEventListener('input', (e) => {
        const pin = e.target.value;
        let pct = 0, label = 'Enter a Password', color = 'var(--text-muted)';
        if (pin.length >= 1) { pct = 20; label = 'Too short'; color = 'var(--red)'; }
        if (pin.length >= 6) { pct = 40; label = 'Weak'; color = 'var(--red)'; }
        if (pin.length >= 10) { pct = 70; label = 'Acceptable'; color = '#f0a030'; }
        if (pin.length >= 14) { pct = 100; label = 'Excellent'; color = 'var(--green)'; }
        if (El.pass.strengthBar) { El.pass.strengthBar.style.width = pct + '%'; El.pass.strengthBar.style.background = color; }
        if (El.pass.strengthLabel) { El.pass.strengthLabel.textContent = label; El.pass.strengthLabel.style.color = color; }
    });


    // --- Drag & Drop Setup ---
    const setupDrag = (box, input, type) => {
        if (!box || !input) return;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => box.addEventListener(ev, e => {
            e.preventDefault(); e.stopPropagation();
        }));
        ['dragenter', 'dragover'].forEach(ev => box.addEventListener(ev, () => {
            box.style.borderColor = 'var(--brand)';
            box.style.background = 'var(--brand-soft)';
        }));
        ['dragleave', 'drop'].forEach(ev => box.addEventListener(ev, () => {
            box.style.borderColor = '';
            box.style.background = '';
        }));
        box.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                if (validateFile(files[0], type)) {
                    input.files = files;
                    input.dispatchEvent(new Event('change'));
                }
            }
        });
    };
    setupDrag(El.sym.fileBox, El.sym.fileInput, 'text');
    setupDrag(El.asym.fileBox, El.asym.fileInput, 'text');
    setupDrag(El.asym.fileBoxReceive, El.asym.fileInputReceive, 'text');
    setupDrag(El.sym.stegoDropZone, El.sym.stegoInput, 'image');
    setupDrag(El.asym.stegoDropZone, El.asym.stegoInput, 'image');

    // Handle context-specific validation in drag/drop
    El.sym.fileBox.addEventListener('drop', () => { if (State.sym.mode === 'decrypt') checkSym(); });
    El.asym.fileBox.addEventListener('drop', () => { if (State.asym.mode === 'decrypt') checkAsym(); });

    // --- Header Scroll Animation ---
    let lastScrollY = window.scrollY;
    let scrollTicking = false;
    const desktopHeader = document.querySelector('.desktop-header');
    const mobileHeader = document.querySelector('.mobile-header');

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                const hideThreshold = 100;
                const scrollThreshold = 40;

                if (currentScrollY > scrollThreshold) {
                    if (desktopHeader) desktopHeader.classList.add('scrolled');
                    if (mobileHeader) mobileHeader.classList.add('scrolled');
                } else {
                    if (desktopHeader) desktopHeader.classList.remove('scrolled');
                    if (mobileHeader) mobileHeader.classList.remove('scrolled');
                }

                if (currentScrollY > lastScrollY && currentScrollY > hideThreshold) {
                    // Scrolling down
                    if (desktopHeader) desktopHeader.classList.add('header-hidden');
                    if (mobileHeader) mobileHeader.classList.add('header-hidden');
                } else if (currentScrollY < lastScrollY) {
                    // Scrolling up
                    if (desktopHeader) desktopHeader.classList.remove('header-hidden');
                    if (mobileHeader) mobileHeader.classList.remove('header-hidden');
                }

                lastScrollY = currentScrollY;
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true });
}

window.switchMainTab = function (t) {
    State.view = t;

    const keyMap = { symmetric: 'sym', asymmetric: 'asym', identity: 'id', passwords: 'pass' };
    const shortKey = keyMap[t] || t;

    Object.keys(El.views).forEach(k => {
        if (El.views[k]) El.views[k].classList.toggle('hidden', k !== shortKey);
        if (El.nav[k]) El.nav[k].classList.toggle('active', k === shortKey);
        if (El.sideNav[k]) El.sideNav[k].classList.toggle('active', k === shortKey);
    });

    if (t === 'identity') {
        updateIdentityStatus();
        renderAuditTrail();
    }

    if (t === 'passwords') {
        checkPassVaultStatus();
        renderPasswords();
    }

    // Update Desktop Header Title
    if (El.topbarTitle) {
        const titles = { symmetric: 'Secret Vault', asymmetric: 'Secure Share', identity: 'My Identity', passwords: 'Password Manager' };
        El.topbarTitle.textContent = titles[t] || 'VaultZero';
    }

    // Password Search Listener
    if (t === 'passwords' && !State._searchInited) {
        const searchInput = document.getElementById('pass-search');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase();
                renderPasswords(query);
            };
        }
        State._searchInited = true;
    }

    // Clear memory & state on context switch
    [El.sym.pass, El.sym.msg, El.asym.keyInput, El.asym.msg, El.asym.msgReceive].forEach(e => { if (e) e.value = ''; });
    [El.sym.fileInput, El.sym.stegoInput, El.asym.fileInput, El.asym.stegoInput].forEach(e => { if (e) e.value = ''; });

    El.sym.fileLabel.textContent = "Click to attach file";
    El.asym.fileLabel.textContent = "Click to attach file";
    El.sym.fileBox.classList.remove('success');
    El.asym.fileBox.classList.remove('success');

    if (El.sym.stegoLabel) El.sym.stegoLabel.textContent = 'Click or drop image here';
    if (El.sym.stegoDropZone) El.sym.stegoDropZone.classList.remove('success');
    if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = 'Click or drop image here';
    if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.remove('success');

    El.sym.resultArea.classList.add('hidden');
    El.asym.resultArea.classList.add('hidden');
    El.sym.copy.classList.remove('hidden');
    El.asym.copy.classList.remove('hidden');
    El.sym.download.classList.add('hidden');
    El.asym.download.classList.add('hidden');
    El.sym.resultText.textContent = '';
    El.asym.resultText.textContent = '';

    checkSym();
    checkAsym();
    updateIdentityStatus();
    theme();
};

window.setOpMode = (m) => {
    State.sym.mode = m;
    El.sym.btns.enc.classList.toggle('active', m === 'encrypt');
    El.sym.btns.dec.classList.toggle('active', m === 'decrypt');
    El.sym.actionText.textContent = m === 'encrypt' ? 'Secure & Lock' : 'Unlock & Open';

    // Clear all data on mode switch
    El.sym.msg.value = '';
    El.sym.pass.value = '';
    El.sym.fileInput.value = '';
    El.sym.stegoInput.value = '';
    El.sym.fileLabel.textContent = "Click to attach file";
    El.sym.fileBox.classList.remove('success');
    if (El.sym.stegoLabel) El.sym.stegoLabel.textContent = 'Click or drop image here';
    if (El.sym.stegoDropZone) El.sym.stegoDropZone.classList.remove('success');
    El.sym.resultArea.classList.add('hidden');
    El.sym.resultText.textContent = '';

    const isEnc = m === 'encrypt';

    // Hide Toggle Chips in Decrypt (Not needed)
    const chips = El.sym.optionsArea ? El.sym.optionsArea.querySelector('.options-row') : null;
    if (chips) chips.classList.toggle('hidden', !isEnc);

    // Strictly show/hide elements based on Mode
    // El.sym.optionsArea is NOT hidden anymore to allow Stego reveal

    // Unified Decryption Upload: In decrypt, stego is handled by the main fileBox
    El.sym.stegoBox.classList.add('hidden');

    // Hide/Show Timer box
    El.sym.timerBox.classList.toggle('hidden', !isEnc || !State.sym.timer);

    // Labels & Placeholders
    const textLabel = document.getElementById('text-label');
    if (textLabel) textLabel.textContent = isEnc ? 'Input Content' : 'Encrypted Volume';
    El.sym.msg.placeholder = isEnc ? 'Type your secrets here...' : 'Paste ciphertext or share link...';
    El.sym.fileLabel.textContent = isEnc ? "Click to attach file" : "Drop encrypted file or photo";

    theme();
    checkSym();
};

window.setOpModeAsym = (m) => {
    State.asym.mode = m;
    El.asym.btns.enc.classList.toggle('active', m === 'encrypt');
    El.asym.btns.dec.classList.toggle('active', m === 'decrypt');

    El.asym.sendForm.classList.toggle('hidden', m !== 'encrypt');
    El.asym.receiveForm.classList.toggle('hidden', m !== 'decrypt');

    El.asym.msg.value = '';
    if (El.asym.msgReceive) El.asym.msgReceive.value = '';
    El.asym.fileInput.value = '';
    if (El.asym.fileInputReceive) El.asym.fileInputReceive.value = '';
    El.asym.stegoInput.value = '';
    El.asym.keyInput.value = '';

    El.asym.fileLabel.textContent = "Click to attach file";
    El.asym.fileBox.classList.remove('success');
    if (El.asym.fileLabelReceive) El.asym.fileLabelReceive.textContent = "Drop encrypted file or photo";
    if (El.asym.fileBoxReceive) El.asym.fileBoxReceive.classList.remove('success');

    if (El.asym.cardDesc) {
        El.asym.cardDesc.textContent = m === 'encrypt' ? "Send messages directly to a friend's ID" : "Open a secure message sent by a friend";
    }
    if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = 'Click or drop image here';
    if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.remove('success');
    El.asym.resultArea.classList.add('hidden');
    El.asym.resultText.textContent = '';

    const isEnc = m === 'encrypt';

    const chips = El.asym.optionsArea ? El.asym.optionsArea.querySelector('.options-row') : null;
    if (chips) chips.classList.toggle('hidden', !isEnc);

    El.asym.stegoBox.classList.add('hidden');
    El.asym.timerBox.classList.toggle('hidden', !isEnc || !State.asym.timer);

    theme();
    checkAsym();
};

// Toggles removed as per request

function theme() {
    const isEnc = (State.view === 'symmetric' ? State.sym.mode : State.asym.mode) === 'encrypt';

    // Force instant theme application via CSS classes
    if (isEnc) {
        document.body.classList.add('theme-red');
        document.body.classList.remove('theme-green');
    } else {
        document.body.classList.add('theme-green');
        document.body.classList.remove('theme-red');
    }
}

async function updateIdentityStatus() {
    if (!El.id.badge) return;

    // Check if identity exists
    const pubId = await localforage.getItem('my_public_id');
    const isGenerated = !!pubId;
    const isActive = !!State.id.privateKey;

    const badge = El.id.badge;
    const dot = badge.querySelector('.status-dot');
    const text = badge.querySelector('.status-text');

    // Toggle Visibility of the "Card Content" and "Actions"
    if (El.id.copyPub) El.id.copyPub.classList.toggle('hidden', !isGenerated);
    if (El.id.shareLink) El.id.shareLink.classList.toggle('hidden', !isGenerated);
    if (El.id.unlock) {
        // Only show unlock if generated AND NOT currently active
        El.id.unlock.classList.toggle('hidden', !isGenerated || isActive);
    }

    // Dim the entire card (not .holo-body child) when no identity exists.
    // CRITICAL: opacity must be on the GPU-layer parent (.holographic-id-card),
    // NOT on a child element. Setting opacity on a child forces a new compositing
    // sub-layer, and the boundary between that sub-layer and .holo-actions renders
    // as a white ghost line on every GPU repaint triggered by hover events elsewhere.
    const holoCard = document.querySelector('.holographic-id-card');
    if (holoCard) holoCard.style.opacity = isGenerated ? '1' : '0.55';

    if (isGenerated) {
        if (text) text.textContent = isActive ? 'SESSION ACTIVE' : 'IDENTITY SECURED';
        if (dot) {
            dot.style.background = isActive ? 'var(--accent)' : 'var(--green)';
            if (isActive) dot.classList.add('secure-pulse');
            else dot.classList.remove('secure-pulse');
        }
    } else {
        if (dot) {
            dot.style.background = 'var(--red)';
            dot.classList.remove('secure-pulse');
        }
    }
}

// --- UTILS ---
function validateFile(file, expectedType, mode = 'encrypt') {
    if (!file) return false;

    const isStegoSource = expectedType === 'image';
    const nameExt = file.name.split('.').pop().toLowerCase();

    if (mode === 'encrypt') {
        if (isStegoSource) {
            const validImageExts = ['png', 'jpg', 'jpeg', 'webp'];
            if (!validImageExts.includes(nameExt)) {
                toast('Invalid cover image. Use PNG, JPG, or WEBP.');
                return false;
            }
        } else {
            const validEncryptExts = ['txt', 'docx', 'csv', 'pdf'];
            if (!validEncryptExts.includes(nameExt)) {
                toast('Restricted Format. Use TXT, DOCX, CSV, or PDF only.');
                return false;
            }
        }

        // Size limits for encryption
        const maxSize = isStegoSource ? 8 * 1024 * 1024 : 2 * 1024 * 1024;
        if (file.size > maxSize) {
            toast(`File too large (Max: ${Math.round(maxSize / 1024 / 1024)}MB).`);
            return false;
        }
    } else {
        // Decrypt mode: Unified detection for images and encrypted files
        const validDecryptExts = ['txt', 'docx', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'enc', 'bin', 'json'];
        if (!validDecryptExts.includes(nameExt)) {
            toast('Unknown format. Try uploading the encrypted file or photo.');
            return false;
        }
        // Decrypt allows up to 10MB for photos
        if (file.size > 10 * 1024 * 1024) {
            toast('File too large for decryption.');
            return false;
        }
    }

    return true;
}

function checkSym() {
    let ok;
    const hasText = El.sym.msg.value.trim().length > 0;
    const hasFile = El.sym.fileInput.files && El.sym.fileInput.files.length > 0;

    // UI Updates for Input Collapse
    if (hasText) {
        El.sym.fileBox.classList.add('input-inactive');
        El.sym.msg.classList.remove('input-inactive');
        El.sym.msg.disabled = false;
    } else if (hasFile) {
        El.sym.msg.classList.add('input-inactive');
        El.sym.fileBox.classList.remove('input-inactive');
        El.sym.msg.disabled = true;
    } else {
        El.sym.msg.classList.remove('input-inactive');
        El.sym.fileBox.classList.remove('input-inactive');
        El.sym.msg.disabled = false;
    }

    if (State.sym.mode === 'encrypt') {
        const hasStego = El.sym.stegoInput.files && El.sym.stegoInput.files.length > 0;
        const inputOk = hasText || hasFile;
        const stegoOk = !State.sym.stego || hasStego;
        const passStrength = updatePassStrength(El.sym.pass.value);
        ok = (El.sym.pass.value.length >= 4) && inputOk && stegoOk && (passStrength >= 40);
    } else {
        ok = (El.sym.pass.value.length >= 4) && (hasText || hasFile);
    }
    El.sym.action.disabled = !ok;
}

function updatePassStrength(pass) {
    if (!El.sym.passStrength || !El.sym.passHint) return 0;

    if (!pass) {
        El.sym.passStrength.style.width = '0%';
        El.sym.passHint.innerHTML = '<i class="ph ph-duotone ph-key"></i> Enter Password';
        El.sym.passHint.style.color = '';
        return 0;
    }

    let score = 0;
    let feedback = "";

    // 1. Length checks
    if (pass.length < 8) {
        score += pass.length * 2;
        feedback = "Make it longer (min 8)";
    } else {
        score += 30;
        if (pass.length >= 12) score += 10;
        if (pass.length >= 16) score += 10;
    }

    // 2. Complexity checks
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (hasUpper) score += 10;
    if (hasLower) score += 5;
    if (hasNum) score += 10;
    if (hasSpecial) score += 15;

    // 3. Pattern detection (Negative points)
    const sequences = ['123', 'abc', 'qwerty', 'password', 'admin', 'vault'];
    sequences.forEach(seq => {
        if (pass.toLowerCase().includes(seq)) score -= 20;
    });

    // 4. Calculate Final Rating
    const percent = Math.max(0, Math.min(score, 100));
    El.sym.passStrength.style.width = percent + '%';

    if (percent < 40) {
        El.sym.passStrength.style.background = 'var(--red)';
        El.sym.passHint.innerHTML = `<i class="ph ph-duotone ph-warning-circle"></i> ${feedback || 'Too Simple'}`;
        El.sym.passHint.style.color = 'var(--red)';
    } else if (percent < 75) {
        El.sym.passStrength.style.background = '#facc15'; // yellow
        let decentHint = "Decent Strength";
        if (!hasSpecial) decentHint = "Add a symbol (@#$)";
        else if (!hasUpper) decentHint = "Add uppercase";
        El.sym.passHint.innerHTML = `<i class="ph ph-duotone ph-shield-warning"></i> ${decentHint}`;
        El.sym.passHint.style.color = '#facc15';
    } else {
        El.sym.passStrength.style.background = 'var(--green)';
        El.sym.passHint.innerHTML = '<i class="ph ph-duotone ph-shield-check"></i> Strong & Secure';
        El.sym.passHint.style.color = 'var(--green)';
    }

    return percent;
}

function checkAsym() {
    let ok;
    if (State.asym.mode === 'encrypt') {
        const hasText = El.asym.msg.value.length > 0;
        const hasFile = El.asym.fileInput.files && El.asym.fileInput.files.length > 0;

        if (hasText) {
            El.asym.fileBox.classList.add('input-inactive');
            El.asym.msg.classList.remove('input-inactive');
            El.asym.msg.disabled = false;
        } else if (hasFile) {
            El.asym.msg.classList.add('input-inactive');
            El.asym.fileBox.classList.remove('input-inactive');
            El.asym.msg.disabled = true;
        } else {
            El.asym.msg.classList.remove('input-inactive');
            El.asym.fileBox.classList.remove('input-inactive');
            El.asym.msg.disabled = false;
        }

        const hasStego = El.asym.stegoInput.files && El.asym.stegoInput.files.length > 0;
        const inputOk = hasText || hasFile;
        const stegoOk = !State.asym.stego || hasStego;
        ok = El.asym.keyInput.value.length > 20 && inputOk && stegoOk;
        El.asym.action.disabled = !ok;
    } else {
        const hasText = El.asym.msgReceive && El.asym.msgReceive.value.trim().length > 10;
        const hasFile = El.asym.fileInputReceive && El.asym.fileInputReceive.files.length > 0;

        // UI Updates for Input Collapse in Receive
        if (hasText) {
            El.asym.fileBoxReceive.classList.add('input-inactive');
            El.asym.msgReceive.classList.remove('input-inactive');
        } else if (hasFile) {
            El.asym.msgReceive.classList.add('input-inactive');
            El.asym.fileBoxReceive.classList.remove('input-inactive');
        } else {
            El.asym.msgReceive.classList.remove('input-inactive');
            El.asym.fileBoxReceive.classList.remove('input-inactive');
        }

        ok = hasText || hasFile;
        if (El.asym.actionReceive) El.asym.actionReceive.disabled = !ok;
    }
}

async function runSym() {
    let sim;
    try {
        El.sym.action.disabled = true;
        const mode = State.sym.mode === 'encrypt' ? 'Encrypting' : 'Decrypting';
        showLoader(mode + " Content", "Performing cryptographic computations...", true);
        sim = simulateProgress(1000);

        // Allow UI to render loader
        await new Promise(r => setTimeout(r, 100));

        const pass = El.sym.pass.value;
        const ttlValue = State.sym.timer ? Date.now() + parseInt(El.sym.timerSelect.value) : null;
        const deviceBound = El.sym.deviceLock?.checked;

        // Use an object for ttl if deviceBound is needed since encrypt currently takes ttl as 3rd arg
        const ttl = deviceBound ? { _sv_bound: true, val: ttlValue } : ttlValue;
        // The encryption.js was updated to handle object as 3rd arg for flags

        let out;
        if (State.sym.mode === 'encrypt') {
            const file = El.sym.fileInput.files[0];
            let data = file ?
                new Uint8Array(await file.arrayBuffer()) :
                El.sym.msg.value;

            // NEW: Automatically sign if identity is available (Applied by Default)
            let senderIdentity = null;
            const idData = await localforage.getItem('my_identity');
            if (idData) {
                if (typeof idData === 'object' && idData.privateKeyBase64) {
                    senderIdentity = idData;
                } else {
                    // PIN-locked identity. Only prompt if not already in session.
                    if (State.id.privateKey && State.id.publicKey) {
                        // Use active session identity
                        const pubKey = State.id.publicKey;
                        const privKey = State.id.privateKey;
                        // We need the full identity object including signing keys.
                        // Since they are purged together, we can decrypt it once.
                        const pass = await customPrompt("Your Digital Identity is locked. Enter Password to sign this vault:", "Identity Signature Required");
                        if (pass) {
                            try {
                                const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
                                senderIdentity = JSON.parse(decryptedStr);
                                if (typeof startPrivateKeyTimer === 'function') startPrivateKeyTimer(senderIdentity.publicKeyBase64, senderIdentity.privateKeyBase64);
                            } catch (e) {
                                toast("Invalid Password. Vault will be created without signature.", "warning");
                            }
                        }
                    } else {
                        // No active session, prompt for Password
                        const pass = await customPrompt("Enter your Vault Password to sign this vault with your Digital Identity:", "Identity Signature");
                        if (pass) {
                            try {
                                const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
                                senderIdentity = JSON.parse(decryptedStr);
                                if (typeof startPrivateKeyTimer === 'function') startPrivateKeyTimer(senderIdentity.publicKeyBase64, senderIdentity.privateKeyBase64);
                            } catch (e) {
                                toast("Invalid Password. Vault will be created without signature.", "warning");
                            }
                        }
                    }
                }
            }

            const cipher = await SecureCrypto.encryptSymmetric(data, pass, ttl, file?.name, file?.type, senderIdentity);
            let isImageResult = false;
            if (State.sym.stego && El.sym.stegoInput.files[0]) {
                out = await Stego.hide(await Stego.prepareImage(El.sym.stegoInput.files[0]), cipher);
                downloadFile(out, `locker_${Date.now()}.png`);
                out = 'Secure payload hidden in image. Check your downloads.';
                isImageResult = true;
            } else out = cipher;

            // UI State Correction: Show/Hide buttons based on result type
            if (isImageResult) {
                El.sym.copy.classList.add('hidden');
                El.sym.copyLink.classList.add('hidden');
                El.sym.download.classList.remove('hidden');
                // Setup download button for the new image base64
                const save = () => downloadFile(out.startsWith('data:') ? out : null, `vault_image_${Date.now()}.png`);
                El.sym.download.onclick = save;
            } else {
                El.sym.copy.classList.remove('hidden');
                El.sym.copyLink.classList.remove('hidden');
                El.sym.download.classList.add('hidden');
            }

            // Update Badge
            if (El.sym.resBadge) {
                El.sym.resBadge.classList.remove('hidden', 'portable', 'locked');
                El.sym.resBadge.classList.add(deviceBound ? 'locked' : 'portable');

                let badgeHTML = deviceBound ?
                    '<i class="ph ph-duotone ph-cpu"></i> Device Locked' :
                    '<i class="ph ph-duotone ph-share"></i> Portable';

                if (senderIdentity) {
                    badgeHTML += ' <span style="opacity: 0.5; margin: 0 4px;">|</span> <i class="ph ph-duotone ph-signature"></i> Signed';
                }

                El.sym.resBadge.innerHTML = badgeHTML;
            }
        } else {
            if (El.sym.resBadge) El.sym.resBadge.classList.add('hidden');
            // Auto-detect source: Stego Input > File Input > Text Area
            let cipher;
            if (El.sym.stegoInput.files[0]) {
                cipher = await Stego.reveal(await Stego.prepareImage(El.sym.stegoInput.files[0]));
            } else if (El.sym.fileInput.files[0]) {
                const file = El.sym.fileInput.files[0];
                const ext = file.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                    cipher = await Stego.reveal(await Stego.prepareImage(file));
                } else {
                    cipher = await file.text();
                }
            } else {
                cipher = El.sym.msg.value.trim();
            }

            const res = await SecureCrypto.decryptSymmetric(cipher, pass);
            const isFile = res && typeof res === 'object' && res.is_file;

            // Verification Badge in Decrypt Mode
            if (El.sym.resBadge && res.verified) {
                El.sym.resBadge.classList.remove('hidden', 'portable', 'locked');
                El.sym.resBadge.classList.add('portable');
                El.sym.resBadge.innerHTML = res.pq_verified ?
                    '<i class="ph ph-duotone ph-seal-check"></i> Verified (PQ)' :
                    '<i class="ph ph-duotone ph-check-circle"></i> Verified';
            }

            const dec = isFile ? res : res.data || res;

            if (isFile) {
                const url = URL.createObjectURL(new Blob([dec.data], { type: dec.type }));
                const save = () => downloadFile(url, dec.name);
                save();
                El.sym.download.onclick = save;
                El.sym.download.classList.remove('hidden');
                El.sym.copy.classList.add('hidden');
                El.sym.copyLink.classList.add('hidden');
                out = `FILE RESTORED: ${dec.name}`;
            } else if (dec instanceof Uint8Array || (dec && dec.constructor && dec.constructor.name === 'Uint8Array')) {
                // Fallback: raw binary without metadata (e.g., old format)
                // Try to detect if it's actually readable text
                let isReadableText = false;
                let textContent = '';
                try {
                    textContent = new TextDecoder('utf-8', { fatal: true }).decode(dec);
                    // Check if it looks like printable text (not random binary)
                    const printableRatio = textContent.split('').filter(c => {
                        const code = c.charCodeAt(0);
                        return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
                    }).length / textContent.length;
                    isReadableText = printableRatio > 0.90 && textContent.length > 0;
                } catch (e) { /* not valid UTF-8 */ }

                if (isReadableText) {
                    // It's actually text â€” show as copyable text
                    El.sym.copy.classList.remove('hidden');
                    El.sym.copyLink.classList.remove('hidden');
                    El.sym.download.classList.add('hidden');
                    out = textContent;
                } else {
                    const url = URL.createObjectURL(new Blob([dec], { type: 'application/octet-stream' }));
                    const fallbackName = `decrypted_${Date.now()}.bin`;
                    const save = () => downloadFile(url, fallbackName);
                    save();
                    El.sym.download.onclick = save;
                    El.sym.download.classList.remove('hidden');
                    El.sym.copy.classList.add('hidden');
                    El.sym.copyLink.classList.add('hidden');
                    out = `BINARY DATA RESTORED: ${fallbackName}`;
                }
            } else {
                El.sym.copy.classList.remove('hidden');
                El.sym.copyLink.classList.remove('hidden');
                El.sym.download.classList.add('hidden');
                out = dec;
            }
        }
        El.sym.resultText.textContent = (typeof out === 'string') ? out : 'Decryption successful.';
        El.sym.resultArea.classList.remove('hidden');
        toast("Success! Your message is ready.", "success");
        if (window.AuditLog) AuditLog.log(State.sym.mode === 'encrypt' ? AuditLog.EventType.ENCRYPT_SUCCESS : AuditLog.EventType.DECRYPT_SUCCESS, { mode: 'symmetric' });
    } catch (e) {
        toast(`Something went wrong: ${e.message}`, "error");
        if (window.AuditLog && State.sym.mode === 'decrypt') {
            const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'symmetric', error: e.message });
            if (isAnomaly) toast('Warning: Unusual activity detected.', "warning");
        }
    }
    finally {
        El.sym.action.disabled = false;
        if (typeof sim !== 'undefined') sim.finish();
        else hideLoader();
    }
}

async function runAsym() {
    let sim;
    try {
        El.asym.action.disabled = true;
        if (El.asym.actionReceive) El.asym.actionReceive.disabled = true;
        const mode = State.asym.mode === 'encrypt' ? 'Encrypting' : 'Decrypting';
        showLoader(mode + " Secret", "Applying post-quantum protection...", true);
        sim = simulateProgress(1200);

        // Allow UI to render loader
        await new Promise(r => setTimeout(r, 100));

        const ttl = State.asym.timer ? Date.now() + parseInt(El.asym.timerSelect.value) : null;
        let out;

        if (State.asym.mode === 'encrypt') {
            const file = El.asym.fileInput.files[0];
            let data = file ?
                new Uint8Array(await file.arrayBuffer()) :
                El.asym.msg.value;

            // Sender Identity Signing (Applied by Default)
            let senderIdentity = null;
            const idData = await localforage.getItem('my_identity');
            if (idData) {
                if (typeof idData === 'object' && idData.privateKeyBase64) {
                    senderIdentity = idData;
                } else {
                    const pass = await customPrompt("Enter your Vault PIN to sign this message:", "Identity Signature");
                    if (!pass) throw new Error("Signing cancelled.");
                    const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
                    senderIdentity = JSON.parse(decryptedStr);
                }
            }

            const cipher = await SecureCrypto.encryptAsymmetric(data, El.asym.keyInput.value.trim(), ttl, file?.name, file?.type, senderIdentity);
            let isImageResult = false;
            if (State.asym.stego && El.asym.stegoInput.files[0]) {
                out = await Stego.hide(await Stego.prepareImage(El.asym.stegoInput.files[0]), cipher);
                downloadFile(out, `share_${Date.now()}.png`);
                out = 'Secure payload hidden in image. Ready for sharing.';
                isImageResult = true;
            } else out = cipher;

            // UI State Correction: Show/Hide based on type
            if (isImageResult) {
                El.asym.copy.classList.add('hidden');
                El.asym.copyLink.classList.add('hidden');
                El.asym.download.classList.remove('hidden');
                const save = () => downloadFile(out.startsWith('data:') ? out : null, `share_image_${Date.now()}.png`);
                El.asym.download.onclick = save;
            } else {
                El.asym.copy.classList.remove('hidden');
                El.asym.copyLink.classList.remove('hidden');
                El.asym.download.classList.add('hidden');
            }

            // Update Badge
            if (El.asym.resBadge) {
                El.asym.resBadge.classList.remove('hidden', 'portable', 'locked');
                El.asym.resBadge.classList.add('portable');
                El.asym.resBadge.innerHTML = El.asym.signToggle?.checked ?
                    '<i class="ph ph-duotone ph-signature"></i> Signed by You' :
                    '<i class="ph ph-duotone ph-user-circle-dashed"></i> Anonymous';
            }
        } else {
            let cipher;
            const file = El.asym.fileInputReceive.files[0];

            if (file) {
                const ext = file.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                    cipher = await Stego.reveal(await Stego.prepareImage(file));
                } else {
                    cipher = await file.text();
                }
            } else {
                cipher = El.asym.msgReceive.value.trim();
            }

            const idData = await localforage.getItem('my_identity');
            if (!idData) throw new Error("No Identity found. Please generate one in the Identity tab before reading secure messages.");

            let pkData;
            if (typeof idData === 'object' && idData.privateKeyBase64) {
                pkData = idData.privateKeyBase64;
            } else {
                const pass = await customPrompt("Enter your Vault PIN to unlock your Identity:", "Secure Payload Detected");
                if (!pass) throw new Error("PIN entry cancelled.");
                const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
                const idObj = JSON.parse(decryptedStr);
                pkData = idObj.privateKeyBase64;

                // Cache it for the session
                if (typeof startPrivateKeyTimer === 'function') startPrivateKeyTimer(idObj.publicKeyBase64, idObj.privateKeyBase64);
                updateIdentityStatus();
            }

            const res = await SecureCrypto.decryptAsymmetric(cipher, pkData);
            const isFile = res && typeof res === 'object' && res.is_file;
            const dec = res.data;

            // Update Verification Badge
            if (El.asym.resBadge) {
                El.asym.resBadge.classList.remove('hidden', 'portable', 'locked');
                if (res.verified) {
                    El.asym.resBadge.classList.add('portable');
                    El.asym.resBadge.innerHTML = res.pq_verified ?
                        '<i class="ph ph-duotone ph-seal-check"></i> Verified (PQ)' :
                        '<i class="ph ph-duotone ph-check-circle"></i> Verified';
                } else {
                    El.asym.resBadge.classList.add('hidden');
                }
            }

            if (isFile) {
                const url = URL.createObjectURL(new Blob([dec], { type: res.type }));
                const save = () => downloadFile(url, res.name);
                save();
                El.asym.download.onclick = save;
                El.asym.download.classList.remove('hidden');
                El.asym.copy.classList.add('hidden');
                El.asym.copyLink.classList.add('hidden');
                out = `FILE RESTORED: ${res.name}`;
            } else if (dec instanceof Uint8Array || (dec && dec.constructor && dec.constructor.name === 'Uint8Array')) {
                // Fallback: raw binary without metadata
                let isReadableText = false;
                let textContent = '';
                try {
                    textContent = new TextDecoder('utf-8', { fatal: true }).decode(dec);
                    const printableRatio = textContent.split('').filter(c => {
                        const code = c.charCodeAt(0);
                        return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
                    }).length / textContent.length;
                    isReadableText = printableRatio > 0.90 && textContent.length > 0;
                } catch (e) { /* not valid UTF-8 */ }

                if (isReadableText) {
                    El.asym.copy.classList.remove('hidden');
                    El.asym.copyLink.classList.remove('hidden');
                    El.asym.download.classList.add('hidden');
                    out = textContent;
                } else {
                    const url = URL.createObjectURL(new Blob([dec], { type: 'application/octet-stream' }));
                    const fallbackName = `decrypted_${Date.now()}.bin`;
                    const save = () => downloadFile(url, fallbackName);
                    save();
                    El.asym.download.onclick = save;
                    El.asym.download.classList.remove('hidden');
                    El.asym.copy.classList.add('hidden');
                    El.asym.copyLink.classList.add('hidden');
                    out = `BINARY DATA RESTORED: ${fallbackName}`;
                }
            } else {
                El.asym.copy.classList.remove('hidden');
                El.asym.copyLink.classList.remove('hidden');
                El.asym.download.classList.add('hidden');
                out = dec;
            }
        }

        El.asym.resultText.textContent = (typeof out === 'string') ? out : 'Decryption successful.';
        El.asym.resultArea.classList.remove('hidden');
        toast("Success! Your message is ready.", "success");
        if (window.AuditLog) AuditLog.log(State.asym.mode === 'encrypt' ? AuditLog.EventType.ENCRYPT_SUCCESS : AuditLog.EventType.DECRYPT_SUCCESS, { mode: 'asymmetric' });
    } catch (e) {
        toast(`Something went wrong: ${e.message}`, "error");
        if (window.AuditLog && State.asym.mode === 'decrypt') {
            const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'asymmetric', error: e.message });
            if (isAnomaly) toast('Warning: Unusual activity detected.', "warning");
        }
    }
    finally {
        El.asym.action.disabled = false;
        if (El.asym.actionReceive) El.asym.actionReceive.disabled = false;
        if (typeof sim !== 'undefined') sim.finish();
        else hideLoader();
    }
}

function runCustomModal(title, message, isPrompt = false, confirmText = "Confirm", cancelText = "Cancel", inputType = "password") {
    return new Promise((resolve) => {
        const modalId = 'custom-modal-' + Date.now();
        const html = `
        <div id="${modalId}" class="install-modal hidden">
            <div class="install-modal-backdrop"></div>
            <div class="install-modal-card" style="text-align: center;">
                <h2 class="install-modal-title" style="margin-top:0;">${title}</h2>
                <p class="install-modal-subtitle">${message}</p>
                ${isPrompt ? `<div class="form-group" style="margin-top: 15px; text-align: left;">
                    <input type="${inputType}" id="${modalId}-input" class="form-input" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; padding: 12px; border-radius: 8px;" placeholder="Type here..."/>
                </div>` : ''}
                <div style="margin-top: 24px; display: flex; gap: 10px; justify-content: center;">
                    <button id="${modalId}-cancel" class="action-btn" style="background: var(--bg-hover); color: var(--text-secondary); flex: 1; border: 1px solid var(--border); ${!cancelText ? 'display: none;' : ''}">
                        ${cancelText}
                    </button>
                    <button id="${modalId}-confirm" class="action-btn primary-action" style="background: var(--accent); flex: 1; min-width: 0 !important; width: auto !important; margin: 0 !important;">
                        ${confirmText}
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById(modalId);
        const input = isPrompt ? document.getElementById(`${modalId}-input`) : null;
        const btnCancel = document.getElementById(`${modalId}-cancel`);
        const btnConfirm = document.getElementById(`${modalId}-confirm`);

        const cleanup = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            document.querySelector('.app-shell')?.classList.remove('shell-modal-active');
        };

        const onCancel = () => { cleanup(); resolve(isPrompt ? null : false); };
        const onConfirm = () => { cleanup(); resolve(isPrompt ? (input ? input.value : '') : true); };

        btnCancel.addEventListener('click', onCancel);
        btnConfirm.addEventListener('click', onConfirm);
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') onConfirm();
                if (e.key === 'Escape') onCancel();
            });
        }

        // Show modal with animation
        requestAnimationFrame(() => {
            modal.classList.remove('hidden');
            document.querySelector('.app-shell')?.classList.add('shell-modal-active');
            requestAnimationFrame(() => {
                modal.classList.add('active');
                if (input) input.focus();
            });
        });
    });
}


const customConfirm = (message, title = "Confirm Action", confirmText = "Proceed", cancelText = "Cancel") => runCustomModal(title, message, false, confirmText, cancelText);
const customAlert = (message, title = "Security Notice", btnText = "OK") => runCustomModal(title, message, false, btnText, "");
const customPrompt = (message, title = "Vault Input", type = "password", confirmText = "Submit", cancelText = "Cancel") => runCustomModal(title, message, true, confirmText, cancelText, type);

async function rotateId() {
    if (await customConfirm("Replace your current ID? This cannot be undone.", "Rotate Identity")) {
        const pass = await customPrompt("Create a Vault PIN or Password to encrypt your local ID at rest:", "Set Vault PIN");
        if (!pass) return toast("Identity generation cancelled.", "info");

        let sim;
        try {
            El.id.gen.disabled = true;
            showLoader("Generating Identity", "Computing post-quantum key pair...", true);
            sim = simulateProgress(3000);

            // Brief timeout to let the loader render before heavy CPU work
            await new Promise(r => setTimeout(r, 150));

            const id = await SecureCrypto.generateKeyPair();
            const encryptedId = await SecureCrypto.encryptSymmetric(JSON.stringify(id), pass);

            await localforage.setItem('my_identity', encryptedId);
            await localforage.setItem('my_public_id', id.publicKeyBase64); // Save public unencrypted
            await updateIdentityStatus();

            // Unified Core Reveal
            startPrivateKeyTimer(id.publicKeyBase64, id.privateKeyBase64);

            if (window.AuditLog) AuditLog.log(AuditLog.EventType.KEY_GENERATED, { hasPQ: !!id.pqSigningPublicKey });
            toast("NEW Identity Core Generated! Backup now.", "warning");
        } catch (e) {
            toast("Identity generation failed: " + e.message, "error");
        } finally {
            El.id.gen.disabled = false;
            if (sim) sim.finish();
            else hideLoader();
        }
    }
}

async function fillMyKey() {
    const idData = await localforage.getItem('my_identity');
    if (!idData) return toast("No ID found. Please generate one first.", "warning");

    if (typeof idData === 'object' && idData.privateKeyBase64) {
        // Legacy Plaintext Upgrade
        const pass = await customPrompt("Your ID is currently insecure. Enter a new Vault PIN to encrypt it now:", "Secure Your Identity");
        if (!pass) return toast("Identity setup cancelled.", "info");
        const encryptedId = await SecureCrypto.encryptSymmetric(JSON.stringify(idData), pass);
        await localforage.setItem('my_identity', encryptedId);
        toast("Identity locked successfully!", "success");
        await updateIdentityStatus();
        El.asym.keyInput.value = idData.privateKeyBase64;
        checkAsym();
        return;
    }

    // Encrypted Flow
    const pass = await customPrompt("Enter your Vault PIN to unlock your Identity:", "Unlock Identity");
    if (!pass) return;

    let sim;
    try {
        if (El.id.unlock) El.id.unlock.disabled = true;
        showLoader("Unlocking Identity", "Decrypting secure vault...", true);
        sim = simulateProgress(1200);

        // Minimal delay to let loader show before Argon2 starts
        await new Promise(r => setTimeout(r, 100));

        const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
        const id = JSON.parse(decryptedStr);

        // Unified Core Reveal
        startPrivateKeyTimer(id.publicKeyBase64, id.privateKeyBase64);

        // Auto-fill Asymmetric if in use
        if (State.view === 'asymmetric' && El.asym.keyInput) {
            El.asym.keyInput.value = State.asym.mode === 'encrypt' ? id.publicKeyBase64 : id.privateKeyBase64;
            checkAsym();
        }

        updateIdentityStatus();
        toast("Identity UNLOCKED! Purging in 2 minutes.", "success");
    } catch (e) {
        toast("Incorrect PIN. Please try again.", "error");
    } finally {
        if (El.id.unlock) El.id.unlock.disabled = false;
        if (sim) sim.finish();
        else hideLoader();
    }
}

async function renderAuditTrail() {
    if (!El.id.audit.list) return;

    try {
        const stats = await AuditLog.getStats();
        const logs = await AuditLog.getRecent(30);

        // Update Stats
        El.id.audit.total.textContent = stats.total || 0;
        El.id.audit.anomalies.textContent = stats.ANOMALY_DETECTED || 0;
        El.id.audit.last.textContent = stats.lastEntry ? new Date(stats.lastEntry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never';

        if (El.id.audit.integrity) {
            El.id.audit.integrity.classList.toggle('hidden', !stats.integrityOk);
            El.id.audit.integrityText.textContent = stats.integrityOk ? 'Secure' : 'Tampered';
            El.id.audit.integrityText.style.color = stats.integrityOk ? 'var(--green)' : 'var(--red)';
        }

        if (logs.length === 0) {
            El.id.audit.list.innerHTML = '<div class="audit-empty">No security events recorded yet.</div>';
            return;
        }

        const iconMap = {
            KEY_GENERATED: 'ph ph-fingerprint',
            ENCRYPT_SUCCESS: 'ph ph-lock-key',
            DECRYPT_SUCCESS: 'ph ph-lock-key-open',
            DECRYPT_FAILED: 'ph ph-warning-circle',
            ANOMALY_DETECTED: 'ph ph-shield-warning',
            WIPE_EXECUTED: 'ph ph-trash'
        };

        const html = logs.reverse().map(log => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const icon = iconMap[log.type] || 'ph ph-info';
            const isAnomaly = log.type === 'ANOMALY_DETECTED' || log.type === 'DECRYPT_FAILED';

            let desc = '';
            if (log.type === 'DECRYPT_FAILED') desc = 'Incorrect password attempt';
            else if (log.type === 'ENCRYPT_SUCCESS') desc = 'Data successfully locked';
            else if (log.type === 'DECRYPT_SUCCESS') desc = 'Data successfully unlocked';
            else if (log.type === 'ANOMALY_DETECTED') desc = `CRITICAL: ${log.details.failureCount} failed attempts detected`;
            else if (log.type === 'KEY_GENERATED') desc = 'New identity core created';
            else if (log.type === 'WIPE_EXECUTED') desc = 'Full data wipe triggered';

            return `
                <div class="audit-item ${log.type === 'ANOMALY_DETECTED' ? 'anomaly' : ''}">
                    <div class="audit-item-icon">
                        <i class="ph ph-bold ${icon}" style="color: ${isAnomaly ? 'var(--red)' : 'var(--accent)'}"></i>
                    </div>
                    <div class="audit-item-content">
                        <div class="audit-item-header">
                            <span class="audit-item-type" style="color: ${isAnomaly ? 'var(--red)' : 'var(--text-primary)'}">${log.type.replace(/_/g, ' ')}</span>
                            <span class="audit-item-time">${timeStr}</span>
                        </div>
                        <div class="audit-item-desc">${desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        El.id.audit.list.innerHTML = html;
    } catch (e) {
        El.id.audit.list.innerHTML = `<div class="audit-empty">Error loading logs: ${e.message}</div>`;
    }
}

let _toastTimer;
function toast(m, type = 'info') {
    const iconMap = {
        success: 'ph ph-check-circle',
        error: 'ph ph-warning-circle',
        warning: 'ph ph-warning',
        info: 'ph ph-info'
    };
    const colorMap = {
        success: 'var(--green)',
        error: 'var(--red)',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    const iconName = iconMap[type] || 'ph ph-info';
    const color = colorMap[type] || '#3b82f6';
    const iconHtml = `<i class="ph ph-duotone ${iconName}" style="font-size:22px; color:${color}"></i>`;

    El.toast.innerHTML = `${iconHtml}<span>${m}</span>`;
    El.toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => El.toast.classList.remove('show'), 3500);
}

let _clipboardClearTimer;
function copyText(t, msg = "Copied to clipboard", btn = null) {
    const performCopy = () => {
        if (btn) {
            const span = btn.querySelector('span');
            const originalText = span ? span.textContent : btn.textContent;
            btn.classList.add('success');
            if (span) span.textContent = "COPIED!";
            else if (btn.tagName === 'BUTTON') btn.dataset.original = originalText;

            setTimeout(() => {
                btn.classList.remove('success');
                if (span) span.textContent = originalText;
                else if (btn.dataset.original) btn.textContent = btn.dataset.original;
            }, 1500);
        }
        toast(msg, "success");

        // SECURITY: Auto-clear clipboard after 60 seconds
        if (t && t.length > 0) {
            clearTimeout(_clipboardClearTimer);
            _clipboardClearTimer = setTimeout(() => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(" ").then(() => {
                        console.log("[Security] Clipboard cleared automatically.");
                    }).catch(() => { });
                }
            }, 60000);
        }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(performCopy).catch(() => {
            fallbackCopy(t, performCopy);
        });
    } else {
        fallbackCopy(t, performCopy);
    }
}

// Keep copyTxt for legacy compatibility
const copyTxt = (t, b) => copyText(t, "Copied!", b);

function fallbackCopy(text, callback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) callback();
    } catch (e) {
        /* copy failed silently */
    }
    document.body.removeChild(textArea);
}

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }, 100);
}
window.onPanicWipe = async () => {
    if (await customConfirm("ERASE EVERYTHING? All keys and data will be lost forever.", "Panic Wipe", "Wipe Everything", "Cancel")) {
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.WIPE_EXECUTED);
        
        const oldId = State.pass.vaultId;
        // Signal other tabs and devices to wipe
        if (oldId) broadcastWipe(oldId);
        
        localforage.clear().then(() => location.reload());
    }
};

async function broadcastWipe(vaultId) {
    if (!vaultId) return;
    console.log("[Security] Broadcasting WIPE_SIGNAL for ID:", vaultId);
    
    // 1. Local Broadcast (Same browser, other tabs)
    SyncRelay.postMessage({ type: 'WIPE_SIGNAL', vaultId });
    
    // 2. Cloud Broadcast (Other devices / browsers)
    if (navigator.onLine) {
        try {
            const relayUrl = `https://ntfy.sh/vaultzero-pulse-${vaultId}`;
            const fetcher = window._nativeFetch || fetch;
            
            // Send both a WIPE signal (for active sessions) and a TOMBSTONE (for future sessions)
            const tombstone = { 
                type: 'TOMBSTONE', 
                vaultId, 
                timestamp: Date.now(),
                reason: 'USER_INITIATED_WIPE'
            };
            
            await fetcher(relayUrl, {
                method: 'POST',
                body: JSON.stringify(tombstone)
            });
            console.log("[Security] Cloud Tombstone broadcasted for ID:", vaultId);
        } catch (e) {
            console.error("Cloud wipe broadcast failed:", e);
        }
    }
}

// --- SECURE VERSION CONTROL ---
// version.json is the SINGLE source of truth for app version.
// To trigger an update: only edit version.json on the server.


/**
 * Compare version strings (e.g., '1.9' vs '2.0').
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 * tensorhub.pk
 */
function compareVersions(a, b) {
    // Helper to normalize strings for comparison (remove 'V' prefix)
    const normalize = (v) => v.trim().replace(/^v/i, '');
    const na = normalize(a);
    const nb = normalize(b);

    const pa = na.split('.');
    const pb = nb.split('.');
    const len = Math.max(pa.length, pb.length);

    for (let i = 0; i < len; i++) {
        const segA = pa[i] || "0";
        const segB = pb[i] || "0";


        const numA = parseInt(segA, 10);
        const numB = parseInt(segB, 10);

        // If both segments start with numbers, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
            if (numA < numB) return -1;
            if (numA > numB) return 1;
        }

        // If numeric parts are equal or one is non-numeric, fall back to string comparison for this segment
        const cmp = segA.localeCompare(segB, undefined, { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return cmp;
    }

    return 0;
}
/**
 * Compute SHA-256 hash of a text string (for script integrity verification).
 */
async function sha256Text(text) {
    // Normalize CRLF to LF and strip BOM to match signing tool.
    let normalized = text.replace(/\r\n/g, '\n');
    if (normalized.charCodeAt(0) === 0xFEFF) normalized = normalized.slice(1);
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(normalized));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getManifestIntegrityToken(manifest) {
    if (!manifest || !manifest.hashes) return "";
    // Create a stable string representation of all hashes to detect any change
    const hashString = JSON.stringify(Object.keys(manifest.hashes).sort().map(k => ({ k, h: manifest.hashes[k] })));
    return await sha256Text(hashString);
}

/**
 * Hardcoded trusted public key for verifying update manifest signatures.
 * Generated by internal-tools/sign-updates.js. Must match the signing keypair.
 */
const TRUSTED_UPDATE_PUBLIC_KEY = 'JYoLNivx4//GnefoBS0EldrriK0eLpfSb0JfuktIlbI=';

/**
 * Verify Ed25519 signature of the manifest payload.
 */


function verifyManifestSignature(manifest) {
    if (!TRUSTED_UPDATE_PUBLIC_KEY) {
        return true;
    }
    if (!manifest.signature || !manifest.signerPublicKey) {
        return false;
    }
    // Verify signer matches trusted key
    if (manifest.signerPublicKey !== TRUSTED_UPDATE_PUBLIC_KEY) {
        return false;
    }
    // Build the same signable payload the signing tool uses
    const signable = {
        version: manifest.version,
        released: manifest.released,
        timestamp: manifest.timestamp,
        expires: manifest.expires,
        hashes: manifest.hashes || {}
    };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(signable));

    // Stage 1: Classical Ed25519 Verification
    const isValid = SecureCrypto.verifySignature(
        payloadBytes,
        manifest.signature,
        manifest.signerPublicKey
    );

    if (!isValid) {
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.SIGNATURE_INVALID, { version: manifest.version, type: 'Ed25519' });
        return false;
    }

    return true;
}

/**
 * Verify SHA-256 hashes of critical scripts against manifest.
 * Also verifies manifest signature first.
 * Uses cache-busting to fetch from NETWORK (not SW cache) so we verify 
 * the actual server files, not stale cached versions.
 */
async function verifyScriptIntegrity(manifest) {
    // Stage 1: Verify the cryptographic signature of the manifest itself
    // If the manifest is signed by the trusted key, we trust the hashes inside it.
    const signatureOk = verifyManifestSignature(manifest);
    if (!signatureOk) return false;

    // Stage 2: Sync these trusted hashes to the Service Worker
    // The Service Worker will perform the actual file hashing during the download phase.
    await syncHashesToWorker(manifest.hashes);

    return true;
}

/**
 * Sends trusted hashes from the signed manifest to the Service Worker.
 */
async function syncHashesToWorker(hashes) {
    if (!hashes || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;

    return new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        navigator.serviceWorker.controller.postMessage({
            type: 'SET_TRUSTED_HASHES',
            hashes: hashes
        }, [channel.port2]);

        // Fallback resolve after 500ms if SW doesn't respond
        setTimeout(resolve, 500);
    });
}

async function initVersionControl() {
    // 1. Load installed version from localforage
    let installedVersion = await localforage.getItem('app_version');

    // 2. First load ever â€” read version from cached version.json
    if (!installedVersion) {
        try {
            const fetcher = window._nativeFetch || window.fetch;
            const cached = await fetcher('update-info.json');
            if (cached.ok) {
                const data = await cached.json();
                installedVersion = data.version;
            }
        } catch (e) { /* offline — use default */ }
        if (!installedVersion) installedVersion = '3.0 Stable';
        await localforage.setItem('app_version', installedVersion);
    }
    APP_VERSION = installedVersion;
    if (El.version.desktopVText) El.version.desktopVText.textContent = `V${APP_VERSION}`;
    if (El.version.mobileVText) El.version.mobileVText.textContent = `V${APP_VERSION}`;

    // 3. Network check — fetch latest update-info.json from server
    let serverVersion = null;
    let manifest = null;
    try {
        const fetcher = window._nativeFetch || fetch;
        // Add a 5s timeout to the fetch to prevent hanging on flaky mobile networks
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetcher('update-info.json?t=' + Date.now(), {
            cache: 'no-cache',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            manifest = await res.json();
            serverVersion = manifest.version;
        }
    } catch (e) {
        /* offline or timeout — skip update check */
    }

    // Re-lock fetch if offline lockdown was active
    if (window._offlineLocked) {
        const blockedFetch = () => Promise.reject(new Error('OFFLINE_LOCKDOWN: Network access disabled for this session.'));
        Object.defineProperty(window, 'fetch', { value: blockedFetch, writable: false, configurable: true });
    }

    // 4. Verify Manifest Cryptographic Integrity
    if (El.id.audit.heartbeat) El.id.audit.heartbeat.classList.add('syncing');

    if (!manifest) {
        if (El.id.audit.heartbeat) setTimeout(() => El.id.audit.heartbeat.classList.remove('syncing'), 1000);
        return;
    }

    const integrityOk = await verifyScriptIntegrity(manifest);

    // --- TUF: EXPIRATION & FREEZE PROTECTION ---
    const lastSeenTs = await localforage.getItem('last_seen_timestamp') || 0;
    const isExpired = manifest.expires && manifest.expires < Date.now();
    const isFrozen = manifest.timestamp && manifest.timestamp < lastSeenTs;

    if (isFrozen) {
        toast("Security Alert: Freeze Attack detected. Update manifest is older than previously seen.", "error");
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.ANOMALY_DETECTED, { detail: 'FREEZE_ATTACK_DETECTED' });
        return;
    }

    if (isExpired) {
        toast("Warning: Security Feed is stale. The update manifest has expired.", "warning");
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.ANOMALY_DETECTED, { detail: 'STALE_MANIFEST_EXPIRED' });
    }

    await localforage.setItem('last_seen_timestamp', manifest.timestamp || 0);

    // --- SECURITY: PUBLIC KEY PINNING ---
    // Prevent an attacker from simply replacing the hardcoded key in app.js
    const savedPubKey = await localforage.getItem('pinned_public_key');
    if (!savedPubKey) {
        await localforage.setItem('pinned_public_key', TRUSTED_UPDATE_PUBLIC_KEY);
    } else if (savedPubKey !== TRUSTED_UPDATE_PUBLIC_KEY) {
        console.error("CRITICAL: Public Key Pinning failed. The hardcoded key was modified.");
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.INTEGRITY_FAIL, { detail: 'KEY_PINNING_FAILED' });
        await customConfirm(
            "🚨 Critical Security Breach",
            "The fundamental security key of this vault has been unauthorizedly modified. This is a severe tamper attempt. The app will now lock down to protect your data.",
            "Lock Vault", "Lock Vault"
        );
        goOffline();
        return;
    }

    // --- NEW: DEEP FILE INTEGRITY SCAN ---
    // Physically check if app.js on the server matches the signed manifest
    let deepIntegrityOk = true;
    try {
        const fetcher = window._nativeFetch || fetch;
        const appRes = await fetcher('app.js?t=' + Date.now());
        if (appRes.ok) {
            const appText = await appRes.text();
            const actualAppHash = await sha256Text(appText);
            const expectedAppHash = manifest.hashes['app.js']?.sha256;

            if (expectedAppHash && actualAppHash !== expectedAppHash) {
                console.error("Deep Scan: HASH MISMATCH detected in app.js on server!");
                deepIntegrityOk = false;
            }
        }
    } catch (e) {
        console.warn("Deep Scan: Could not reach server for file verification.");
    }

    if (El.id.audit.heartbeat) setTimeout(() => El.id.audit.heartbeat.classList.remove('syncing'), 1000);

    // 4. Determine Update Availability via Cryptographic Hashes
    let updateAvailable = false;

    if (serverVersion) {
        // --- SENSITIVE UPDATE & TAMPER DETECTION ---
        const lastManifestToken = await localforage.getItem('last_manifest_token') || "";
        const currentManifestToken = await getManifestIntegrityToken(manifest);
        const hashesChanged = currentManifestToken !== lastManifestToken;

        console.log("Update Check: Hashes Changed?", hashesChanged, "Tokens:", currentManifestToken.slice(0, 8), "vs", lastManifestToken.slice(0, 8));

        if (hashesChanged || !deepIntegrityOk) {
            console.log("Update Check: Trigger condition met. Verifying signature...");
            if (!integrityOk || !deepIntegrityOk) {
                console.error("Update Check: INTEGRITY BREACH - Manifest invalid or File Mismatch.");

                // User-Optional Lockdown
                if (window.AuditLog) AuditLog.log(AuditLog.EventType.ANOMALY_DETECTED, { detail: 'SECURITY_BREACH_DETECTED' });

                const shouldLock = await customConfirm(
                    "A security mismatch was detected between the server and your local vault. This could be a development tool (like Live Server) or a potential tampering attempt.\n\nWould you like to enter Isolation Mode (Offline) for maximum protection?",
                    "🚨 Security Alert",
                    "Isolation Mode",
                    "Continue Anyway"
                );

                if (shouldLock) {
                    setAirGap(true);
                    toast("Isolation Mode activated.", "warning");
                } else {
                    toast("Security warning bypassed. Use with caution.", "info");
                }
                // We don't return here anymore, allowing the app to continue if the user chose to.
            } else {
                updateAvailable = true;
            }
        }
    }


    // 6. Execute Update Flow
    if (updateAvailable) {
        if (integrityOk) {
            // SHOW UPDATE BUTTON instead of auto-updating
            if (El.version.headerNavBtn) El.version.headerNavBtn.classList.remove('hidden');
            if (El.version.mobileNavBtn) El.version.mobileNavBtn.classList.remove('hidden');
            toast("New security update available. Click 'Update' to apply.", "info");
        } else {
            // PROMPT FOR TAMPER (Integrity Breach)
            const choice = await customConfirm(
                "🚨 Integrity Breach Detected",
                "A modification was detected in the vault code, but it lacks a valid security signature. This could indicate a malicious tamper attempt. Do you want to perform a Secure Recovery Sync?",
                "Secure Recovery", "Lock Vault"
            );
            if (choice) {
                triggerAppUpdate();
            } else {
                goOffline();
            }
        }
    }

    // Global message listener for Service Worker communications
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'RECACHE_COMPLETE') {
                if (event.data.success) {
                    window._isUpdateReadyToApply = true;
                    // Finish the update by saving state and reloading
                    if (window._isUserInitiatedUpdate) {
                        finishAtomicUpdate();
                    }
                } else {
                    hideLoader();
                    toast("Security Sync failed. Please try again.", "error");
                }
            }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Automatic reload if update was successfully pre-verified
            if (window._isUpdateReadyToApply) {
                window.location.reload();
            }
        });
    }

    // 6. Register Service Worker with proper lifecycle handling
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('./service-worker.js', { updateViaCache: 'none' });
            swRegistration = reg;

            // Listen for waiting worker (update ready)
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // NEW: Proactively show loader for the final swap
                        showLoader("Security Sync", "Applying verified update...", true);
                        updateLoaderProgress(95);
                        setTimeout(() => finishAtomicUpdate(), 800);
                    }
                });
            });

            reg.update();

            // Set up aggressive background polling every 1 minute
            if (window._updatePollTimer) clearInterval(window._updatePollTimer);
            window._updatePollTimer = setInterval(checkForUpdates, 60 * 1000);

        } catch (err) { }
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Automatic reload if update was successfully pre-verified
        if (window._isUpdateReadyToApply) {
            window.location.reload();
        }
    });

    // Start the Idle Watcher for Seamless Updates
    initIdleWatcher();
    
    // Load vault metadata
    State.pass.vaultIdCreatedAt = await localforage.getItem('vaultzero_vault_id_created') || 0;
}

/**
 * Idle Watcher: Reloads the app ONLY when the user is inactive 
 * and no sensitive data is currently being typed.
 */
function initIdleWatcher() {
    let idleTimer;
    const resetTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(checkAndApplyUpdate, 5 * 60 * 1000); // 5 mins idle
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();

    // Password Manager Inactivity Lock
    let passInactivityTimer;
    const resetPassTimer = () => {
        clearTimeout(passInactivityTimer);
        if (State.pass.unlocked) {
            passInactivityTimer = setTimeout(() => {
                if (State.view === 'passwords') {
                    lockPasswords();
                    toast("Vault auto-locked due to inactivity.", "warning");
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
    };
    window.addEventListener('mousemove', resetPassTimer);
    window.addEventListener('keydown', resetPassTimer);
    resetPassTimer();
}

function checkAndApplyUpdate() {
    if (!window._isUpdateReadyToApply) return;

    // Safety: Check if inputs are empty to prevent data loss
    const hasUnsavedSym = (El.sym.msg.value.length > 0) || (El.sym.pass.value.length > 0);
    const hasUnsavedAsym = (El.asym.msg.value.length > 0) || (El.asym.msgReceive.value.length > 0);

    if (!hasUnsavedSym && !hasUnsavedAsym) {
        console.log("Idle Watcher: Applying verified update seamlessly.");
        finishAtomicUpdate();
    }
}

async function finishAtomicUpdate() {
    window._isUpdateReadyToApply = true;

    // Save the manifest token to mark this version as "Applied"
    // This prevents re-updating to the same hashes over and over
    try {
        const fetcher = window._nativeFetch || fetch;
        const res = await fetcher('update-info.json?t=' + Date.now());
        if (res.ok) {
            const manifest = await res.json();
            const token = await getManifestIntegrityToken(manifest);
            await localforage.setItem('app_version', manifest.version);
            await localforage.setItem('last_manifest_token', token);
            console.log("[Update] Version state finalized:", manifest.version);
        }
    } catch (e) {
        console.warn("Failed to save update state", e);
    }

    if (swRegistration && swRegistration.waiting) {
        swRegistration.waiting.postMessage('SKIP_WAITING');
    } else {
        window.location.reload();
    }
}

async function triggerAppUpdate() {
    window._isUserInitiatedUpdate = true;
    showLoader("Security Sync", "Applying verified update...", true);

    try {
        if (swRegistration) {
            // Force a check for a new service worker version (v13)
            await swRegistration.update();
        }


        if (navigator.serviceWorker.controller) {
            // Fetch latest hashes before recache to ensure integrity verification in SW
            const res = await fetch('update-info.json?t=' + Date.now());
            let hashes = {};
            if (res.ok) {
                const manifest = await res.json();
                hashes = manifest.hashes || {};
            }

            navigator.serviceWorker.controller.postMessage({
                type: 'FORCE_RECACHE',
                hashes: hashes
            });
        } else {
            window.location.reload();
        }
    } catch (e) {
        window.location.reload();
    }
}

// Sidebar collapse toggle
window.toggleSidebar = () => {
    const sidebar = document.getElementById('desktop-sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
};

// --- PWA INSTALLATION LOGIC ---

// Platform detection helpers
function getInstallPlatform() {
    const ua = navigator.userAgent || '';
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
    if (isStandalone) return 'installed';

    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
}

// Capture the native install prompt (Chrome/Edge on desktop & Android)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    updateInstallUI();
});

// Opens the install modal and shows the correct section
function openInstallModal() {
    const modal = document.getElementById('install-modal');
    if (!modal) return;

    // Hide all sections first
    ['install-native', 'install-ios', 'install-android', 'install-desktop', 'install-done']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

    const platform = getInstallPlatform();

    if (platform === 'installed') {
        document.getElementById('install-done')?.classList.remove('hidden');
    } else if (deferredInstallPrompt) {
        // Native prompt is available (Chrome/Edge)
        document.getElementById('install-native')?.classList.remove('hidden');
    } else if (platform === 'ios') {
        document.getElementById('install-ios')?.classList.remove('hidden');
    } else if (platform === 'android') {
        document.getElementById('install-android')?.classList.remove('hidden');
    } else {
        document.getElementById('install-desktop')?.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
    // Animate in
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closeInstallModal() {
    const modal = document.getElementById('install-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// Handle the native install button inside the modal
async function handleNativeInstall() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;
    closeInstallModal();
    if (outcome === 'accepted') {
        toast('VaultZero installed successfully!');
    }
}

// Wire up the native install button
document.addEventListener('DOMContentLoaded', () => {
    const nativeBtn = document.getElementById('btn-install-native');
    if (nativeBtn) nativeBtn.addEventListener('click', handleNativeInstall);
});

// Both sidebar and mobile buttons open the modal
function triggerInstallPrompt() {
    openInstallModal();
}

function updateInstallUI() {
    const platform = getInstallPlatform();
    const isInstalled = platform === 'installed';

    // Desktop
    if (El.install.sidebar) {
        if (isInstalled && !window._isUpdateWaiting) {
            El.install.sidebar.classList.add('hidden');
        } else {
            El.install.sidebar.classList.remove('hidden');
        }
    }

    // Mobile
    if (El.install.mobile) {
        if (isInstalled && !window._isUpdateWaiting) {
            El.install.mobile.classList.add('hidden');
        } else if (window._isUpdateWaiting) {
            // Keep hidden in mobile nav for the 4th button instead
            El.install.mobile.classList.add('hidden');
        } else {
            // Always show on mobile if not installed so people can see instructions
            El.install.mobile.classList.remove('hidden');
        }
    }
}

window.addEventListener('appinstalled', () => {
    if (window.AuditLog) AuditLog.log('APP_INSTALLED');
    closeInstallModal();
    updateInstallUI();
    toast('VaultZero installed successfully!');
});

// --- HEADER SCROLL LOGIC ---
const desktopHeader = document.querySelector('.desktop-header');
const mobileHeader = document.querySelector('.mobile-header');
let scrollTicking = false;
let lastScrollY = window.scrollY || document.documentElement.scrollTop;

window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
            const currentScrollY = window.scrollY || document.documentElement.scrollTop;

            // Hide immediately on scroll down
            if (currentScrollY > lastScrollY && currentScrollY > 5) {
                if (desktopHeader) desktopHeader.classList.add('header-hidden');
                if (mobileHeader) mobileHeader.classList.add('header-hidden');
            } else if (currentScrollY < lastScrollY) {
                if (desktopHeader) desktopHeader.classList.remove('header-hidden');
                if (mobileHeader) mobileHeader.classList.remove('header-hidden');
            }
            lastScrollY = currentScrollY;
            scrollTicking = false;
        });
    }
}, { passive: true });

// --- CACHE AGE CHECK (48 HOURS FOR SECURITY) ---
function checkCacheAge() {
    const CACHE_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours security limit
    const now = Date.now();
    let lastLoad = localStorage.getItem('vaultzero_last_load');

    if (!lastLoad) {
        localStorage.setItem('vaultzero_last_load', now.toString());
        lastLoad = now.toString();
    }

    const diffMs = now - parseInt(lastLoad, 10);
    const delay = CACHE_MAX_AGE_MS - diffMs;

    // Clear any existing timer to prevent duplicates
    if (window._cacheAgeTimer) clearTimeout(window._cacheAgeTimer);

    if (delay <= 0) {
        // Already expired
        showCacheReloadPrompt();
        localStorage.setItem('vaultzero_last_load', now.toString());
    } else {
        // Log exactly how much time is left until the trigger
        const hours = Math.floor(delay / 3600000);
        const mins = Math.floor((delay % 3600000) / 60000);

        window._cacheAgeTimer = setTimeout(() => {
            showCacheReloadPrompt();
            localStorage.setItem('vaultzero_last_load', Date.now().toString());
        }, delay);
    }
}

function showCacheReloadPrompt() {
    // Show the floating button and proactively trigger the modal
    if (El.version && El.version.floatingBtn) {
        showUpdatePrompt();
        El.version.floatingBtn.setAttribute('title', 'Security Notice: Reload App');

        // Proactively show the update modal to catch user attention
        const modal = document.getElementById('update-confirm-modal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => modal.classList.add('active'), 100);
        }
    }

    // Always show feedback
    toast("Security Session Notice: App is over 48 hours old. Please reload for the latest updates.", "warning");
}

// --- NETWORK STATUS ---
function initNetworkStatus() {
    const update = () => {
        // If the offline shield is already active, don't overwrite it
        if (window._offlineLocked) return;

        const isOnline = navigator.onLine;
        if (El.version.statusText) {
            El.version.statusText.textContent = isOnline ? 'Online' : 'Secure Offline';
            El.version.statusText.style.color = isOnline ? '#22c55e' : '#f87171';
        }
        El.version.statusDots.forEach(dot => {
            dot.classList.toggle('online', isOnline);
            dot.classList.toggle('offline', !isOnline);
        });
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
}

async function setAirGap(enabled) {
    State.airGap = enabled;
    await localforage.setItem('vaultzero_airgap', enabled);

    if (enabled) {
        await localforage.setItem('vaultzero_airgap_timestamp', Date.now());
    } else {
        await localforage.removeItem('vaultzero_airgap_timestamp');
    }

    // Update UI Elements
    if (El.id.audit.airGap) El.id.audit.airGap.checked = enabled;
    [El.version.airGapDesktop, El.version.airGapMobile].forEach(btn => {
        btn?.classList.toggle('active', enabled);
    });

    if (enabled) {
        if (window._updatePollTimer) clearInterval(window._updatePollTimer);
        // Strict fetch lockdown
        const blockedFetch = () => Promise.reject(new Error('AIR_GAP_MODE: All network access disabled.'));
        Object.defineProperty(window, 'fetch', { value: blockedFetch, writable: false, configurable: true });
        if (window._nativeFetch) window._nativeFetch = blockedFetch;

        if (El.version.isolationContainer) El.version.isolationContainer.classList.remove('hidden');
        if (El.version.statusText) {
            El.version.statusText.textContent = 'ISOLATION ACTIVE';
            El.version.statusText.style.color = 'var(--accent)';
        }
        if (El.version.statusDots) {
            El.version.statusDots.forEach(dot => {
                dot.classList.remove('online');
                dot.style.background = 'var(--accent)';
                dot.style.boxShadow = '0 0 10px var(--accent-glow)';
            });
        }
        toast("Isolation Mode Enabled. All network requests blocked.", "info");
    } else {
        // Restore if possible (requires page reload to cleanly restore native fetch)
        location.reload();
    }
}


// --- PASSWORD MANAGER LOGIC ---

async function checkPassVaultStatus() {
    const encryptedData = await localforage.getItem('vaultzero_passwords');
    const hasVault = !!encryptedData;

    if (State.pass.unlocked) {
        showPassState('active');
    } else if (hasVault) {
        showPassState('locked');
    } else {
        showPassState('choice');
    }
}

function showPassState(s) {
    const states = {
        choice: El.pass.choice,
        setup: El.pass.setup,
        locked: El.pass.locked,
        active: El.pass.active
    };
    Object.keys(states).forEach(k => {
        if (states[k]) states[k].classList.toggle('hidden', k !== s);
    });

    // Focus input field for convenience
    if (s === 'locked' && El.pass.pin) setTimeout(() => El.pass.pin.focus(), 100);
    if (s === 'setup' && El.pass.setupPin) setTimeout(() => El.pass.setupPin.focus(), 100);

    // Broadcast "HELLO" on unlock to catch up with other tabs
    if (s === 'active') {
        console.log("[Local Mesh] Sending HELLO handshake...");
        SyncRelay.postMessage({ type: 'HELLO' });
    }
}

async function unlockPasswords(pin, isSetup = false) {
    if (!pin || (isSetup && pin.length < 10)) {
        return toast(isSetup ? "Master Password must be at least 10 characters." : "Please enter your password.", "warning");
    }

    let sim;
    try {
        const encryptedData = await localforage.getItem('vaultzero_passwords');

        // Safeguard: Check if we are overwriting an existing vault
        if (isSetup && encryptedData) {
            const confirmWipe = await customConfirm(
                "A local password vault already exists on this device. Creating a new one will PERMANENTLY delete all current entries.\n\nAre you sure you want to proceed?",
                "⚠️ Warning: Existing Vault Found",
                "Delete & Create New",
                "Cancel"
            );
            if (!confirmWipe) return;
            
            // 1. Signal other devices to wipe the OLD vault (Local + Cloud)
            if (State.pass.vaultId) {
                broadcastWipe(State.pass.vaultId);
            }
            // 2. Generate a fresh ID for the new vault
            await generateNewVaultId();
        }

        showLoader(isSetup ? "Initializing Vault" : "Decrypting Vault", isSetup ? "Creating secure local container..." : "Verifying master credential...", true);
        sim = simulateProgress(isSetup ? 800 : 400); // Faster unlock/setup

        if (isSetup || !encryptedData) {
            // New Vault Setup or First Unlock on Linked Device
            State.pass.masterKey = pin;
            State.pass.unlocked = true;

            if (State.pass.vaultId && !encryptedData) {
                // If we have an ID but no data, we are linking. 
                // DON'T push an empty vault yet. Pull first.
                State.pass.entries = [];
                toast("Linking to Cloud Vault...", "info");
                // Await the pulse so the user sees the data immediately upon finishUnlock
                await performCloudPulse();
            } else {
                // Standard new setup
                State.pass.entries = [];
                await savePasswords();
                toast("Secure Password Vault Initialized!", "success");
            }

            finishUnlock();
            return;
        }

        const res = await SecureCrypto.decryptSymmetric(encryptedData, pin);
        const decryptedStr = typeof res === 'string' ? res : res.data;
        State.pass.entries = JSON.parse(decryptedStr);
        State.pass.masterKey = pin;
        State.pass.unlocked = true;
        finishUnlock();
        toast("Password Vault Unlocked.", "success");
    } catch (e) {
        toast("Incorrect Password. Access Denied.", "error");
    } finally {
        if (sim) sim.finish();
        El.pass.pin.value = '';
        El.pass.setupPin.value = '';
    }
}

function finishUnlock() {
    showPassState('active');
    renderPasswords();
}

function lockPasswords() {
    State.pass.unlocked = false;
    State.pass.entries = [];
    State.pass.masterKey = null;
    checkPassVaultStatus();
    toast("Vault Locked. Memory Purged.", "info");
}

function renderPasswords(filter = "") {
    if (!El.pass.list) return;
    const query = typeof filter === 'string' ? filter.toLowerCase() : '';
    const filtered = State.pass.entries.filter(e =>
        !e.deleted && (
            e.title.toLowerCase().includes(query) ||
            e.username.toLowerCase().includes(query) ||
            (e.url && e.url.toLowerCase().includes(query))
        )
    );

    if (filtered.length === 0) {
        El.pass.list.innerHTML = `
            <div class="vp-empty">
                <i class="${query ? 'ph-duotone ph-magnifying-glass' : 'ph-duotone ph-vault'}" style="font-size: 64px; color: rgba(255,255,255,0.1); margin-bottom: 20px;"></i>
                <p style="font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 6px;">${query ? 'No matches found' : 'Vault is Empty'}</p>
                <span style="font-size: 16px; color: rgba(255,255,255,0.4);">${query ? 'Try a different search term.' : 'Click + to add a credential.'}</span>
            </div>`;
        return;
    }

    const getServiceIcon = (title) => {
        const t = title.toLowerCase();
        if (t.includes('google')) return 'ph-duotone ph-google-logo';
        if (t.includes('github')) return 'ph-duotone ph-github-logo';
        if (t.includes('facebook') || t.includes('fb')) return 'ph-duotone ph-facebook-logo';
        if (t.includes('twitter') || t.includes('x')) return 'ph-duotone ph-twitter-logo';
        if (t.includes('linkedin')) return 'ph-duotone ph-linkedin-logo';
        if (t.includes('microsoft')) return 'ph-duotone ph-microsoft-logo';
        if (t.includes('amazon')) return 'ph-duotone ph-amazon-logo';
        if (t.includes('netflix')) return 'ph-duotone ph-television';
        if (t.includes('apple')) return 'ph-duotone ph-apple-logo';
        if (t.includes('bank') || t.includes('paypal') || t.includes('card')) return 'ph-duotone ph-credit-card';
        return 'ph-duotone ph-fingerprint';
    };

    El.pass.list.innerHTML = filtered.map((e, i) => {
        const escapedPass = (e.password || '').replace(/'/g, "\\'");
        return `
        <div class="vp-item" style="animation-delay: ${i * 40}ms" onclick="editPasswordEntry('${e.id}')">
            <div class="vp-item-icon">
                <i class="${getServiceIcon(e.title)}"></i>
            </div>
            <div class="vp-item-body">
                <div class="vp-item-title">${e.title}</div>
                <div class="vp-item-sub">${e.username || '—'}</div>
            </div>
            <div class="vp-item-actions">
                <button class="vp-action copy" title="Copy Password" onclick="event.stopPropagation(); copyText('${escapedPass}', 'Password copied')">
                    <i class="ph-duotone ph-copy"></i>
                </button>
                <button class="vp-action delete" title="Delete" onclick="event.stopPropagation(); deletePasswordEntry('${e.id}')">
                    <i class="ph-duotone ph-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

async function addPasswordEntry() {
    const entry = await showPassEntryModal();
    if (entry) {
        State.pass.entries.push({ ...entry, id: Date.now().toString(), updatedAt: Date.now() });
        renderPasswords();
        savePasswords(); // No await to prevent UI lag
        toast("Password saved locally.", "success");
    }
}

async function editPasswordEntry(id) {
    const idx = State.pass.entries.findIndex(e => e.id === id);
    if (idx === -1) return;

    const entry = await showPassEntryModal(State.pass.entries[idx]);
    if (entry) {
        State.pass.entries[idx] = { ...State.pass.entries[idx], ...entry, updatedAt: Date.now() };
        renderPasswords();
        savePasswords(); // Instant
        toast("Entry updated.", "success");
    }
}

async function deletePasswordEntry(id) {
    if (await customConfirm("Are you sure you want to delete this credential?", "Delete Entry")) {
        const idx = State.pass.entries.findIndex(e => e.id === id);
        if (idx !== -1) {
            State.pass.entries[idx].deleted = true;
            State.pass.entries[idx].updatedAt = Date.now();
            renderPasswords();
            await new Promise(r => setTimeout(r, 50));
            await savePasswords();
            toast("Entry deleted.", "info");
        }
    }
}

async function savePasswords() {
    if (!State.pass.unlocked || !State.pass.masterKey) return;
    
    try {
        const payload = JSON.stringify(State.pass.entries);
        const encrypted = await SecureCrypto.encryptSymmetric(payload, State.pass.masterKey);
        await localforage.setItem('vaultzero_passwords', encrypted);
        State.pass.lastSync = Date.now();
        performCloudPulse();
    } catch (e) {
        console.error("Save failed:", e);
    }
}

function showPassEntryModal(existing = null) {
    return new Promise((resolve) => {
        const modalId = 'pass-entry-modal-' + Date.now();
        const html = `
        <div id="${modalId}" class="install-modal" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);">
            <div class="install-modal-backdrop"></div>
            <div class="vault-pro-container" style="max-width: 500px; margin: auto; border: 1px solid rgba(255,255,255,0.1); background: #0d0d12; min-height: auto; padding-bottom: 20px;">
                <div class="vp-topbar">
                    <span class="vp-topbar-title">${existing ? 'Edit Credential' : 'New Credential'}</span>
                </div>
                <div style="padding: 24px;">
                    <div class="form-group">
                        <label class="form-label" style="color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Service / Title</label>
                        <input type="text" id="${modalId}-title" class="vp-input" style="text-align: left; padding: 0 20px; font-size: 16px;" value="${existing ? existing.title : ''}" placeholder="e.g. Google, GitHub">
                    </div>
                    <div class="pass-modal-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                        <div class="form-group">
                            <label class="form-label" style="color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Username</label>
                            <input type="text" id="${modalId}-user" class="vp-input" style="text-align: left; padding: 0 16px; font-size: 14px; height: 48px;" value="${existing ? existing.username : ''}" placeholder="email or handle">
                        </div>
                        <div class="form-group">
                            <label class="form-label" style="color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Password</label>
                            <input type="text" id="${modalId}-pass" class="vp-input" style="text-align: left; padding: 0 16px; font-size: 14px; height: 48px;" value="${existing ? existing.password : ''}" placeholder="secret string">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 16px;">
                        <label class="form-label" style="color: rgba(255,255,255,0.5); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Website URL (Optional)</label>
                        <input type="text" id="${modalId}-url" class="vp-input" style="text-align: left; padding: 0 20px; font-size: 14px; height: 48px;" value="${existing ? existing.url : ''}" placeholder="https://example.com">
                    </div>
                    <div style="margin-top: 32px; display: flex; gap: 12px;">
                        <button id="${modalId}-cancel" class="vp-footer-action" style="flex: 1; height: 52px;">Cancel</button>
                        <button id="${modalId}-save" class="vp-btn-primary green" style="flex: 1.5; height: 52px; max-width: none; border-radius: 12px;">Save Entry</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById(modalId);

        const close = (data = null) => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            document.querySelector('.app-shell')?.classList.remove('shell-modal-active');
            resolve(data);
        };

        document.getElementById(`${modalId}-cancel`).onclick = () => close();
        document.getElementById(`${modalId}-save`).onclick = () => {
            const title = document.getElementById(`${modalId}-title`).value;
            const username = document.getElementById(`${modalId}-user`).value;
            const password = document.getElementById(`${modalId}-pass`).value;
            const url = document.getElementById(`${modalId}-url`).value;
            if (!title || !password) return toast("Title and Password are required.", "warning");
            close({ title, username, password, url });
        };

        requestAnimationFrame(() => {
            modal.classList.remove('hidden');
            document.querySelector('.app-shell')?.classList.add('shell-modal-active');
            requestAnimationFrame(() => modal.classList.add('active'));
        });
    });
}

async function syncPasswords() {
    if (!State.pass.unlocked || !State.pass.masterKey) {
        // If locked, allow linking via Vault ID
        const vId = await customPrompt("Enter your Vault ID to link this device:", "Link Existing Vault", "text");
        if (vId) {
            State.pass.vaultId = vId;
            State.pass.lastSync = 0; // Force a full pull on next pulse
            State.pass.vaultIdCreatedAt = Date.now();
            await localforage.setItem('vaultzero_vault_id', vId);
            await localforage.setItem('vaultzero_vault_id_created', State.pass.vaultIdCreatedAt);

            // Update UI immediately
            const display = document.getElementById('pass-vault-id-display');
            if (display) display.textContent = vId;

            // PROACTIVE: Immediately ask for Password to pull data
            const pin = await customPrompt("Enter your Master Password to unlock and sync your data:", "Security Challenge");
            if (pin) {
                unlockPasswords(pin);
            }
        }
        return;
    }

    // If already unlocked, show Sync Status & Vault ID
    const msg = `Your Vault ID: ${State.pass.vaultId}\n\nUse this ID on other devices to link them. Your data is always encrypted with your PIN before syncing.`;
    await customConfirm(msg, "Cloud Sync Status");

    // Manual sync button: force a pull and ignore the 15s debounce
    toast("Syncing with cloud...", "info");
    await performCloudPulse();
    if (State.pass.syncStatus === 'success') {
        toast("Cloud sync completed successfully.", "success");
        renderPasswords(); // Refresh UI in case of background updates
    } else {
        toast("Cloud relay unreachable. Try again later.", "warning");
    }
}

/**
 * Generates a unique, user-friendly Vault ID if one doesn't exist.
 */
async function ensureVaultId() {
    if (State.pass.vaultId) return;
    let storedId = await localforage.getItem('vaultzero_vault_id');
    if (!storedId) {
        storedId = await generateNewVaultId();
    }
    State.pass.vaultId = storedId;
    State.pass.vaultIdCreatedAt = await localforage.getItem('vaultzero_vault_id_created') || 0;
    const display = document.getElementById('pass-vault-id-display');
    if (display) display.textContent = storedId;
}

async function generateNewVaultId() {
    const r = (n) => Math.random().toString(36).substring(2, 2 + n).toUpperCase();
    const newId = `VZ-${r(4)}-${r(4)}`;
    const now = Date.now();
    State.pass.vaultId = newId;
    State.pass.vaultIdCreatedAt = now;
    await localforage.setItem('vaultzero_vault_id', newId);
    await localforage.setItem('vaultzero_vault_id_created', now);
    
    const display = document.getElementById('pass-vault-id-display');
    if (display) display.textContent = newId;
    console.log("[Security] New Vault ID Generated:", newId);
    return newId;
}

/**
 * Background "Pulse" that pushes or pulls data based on network state.
 * User-friendly: handles everything automatically.
 */
let _isSyncingPulse = false;
async function performCloudPulse() {
    if (_isSyncingPulse) return; 
    if (!State.pass.vaultId) return;

    _isSyncingPulse = true;
    try {
        const vaultId = State.pass.vaultId;
        const localData = await localforage.getItem('vaultzero_passwords');
        const canPush = State.pass.unlocked && localData;
        const payload = {
            type: 'SYNC',
            data: localData, 
            timestamp: Date.now(),
            vaultId: vaultId
        };

        // 1. BROADCAST LOCALLY (Instant Cross-Tab Sync)
        SyncRelay.postMessage({ type: 'PULSE', vaultId, payload });

        // 2. ATTEMPT CLOUD RELAY (Cross-Browser / Cross-Device Sync)
        if (navigator.onLine) {
            try {
                // Use ntfy.sh as a high-performance, anonymous, zero-knowledge relay
                const relayUrl = `https://ntfy.sh/vaultzero-pulse-${vaultId}`;

                const fetcher = window._nativeFetch || fetch;

                // PUSH to relay (Only if unlocked and has data)
                if (canPush && State.pass.lastPushData !== payload.data) {
                    await fetcher(relayUrl, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    State.pass.lastPushData = payload.data;
                    State.pass.lastSync = payload.timestamp; 
                }

                // PULL from relay (Get latest messages)
                const pullResponse = await fetcher(`${relayUrl}/json?poll=1`);
                if (pullResponse.ok) {
                    const rawText = await pullResponse.text();
                    const messages = rawText.split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                            try { return JSON.parse(line); } catch (e) { return null; }
                        })
                        .filter(msg => msg && msg.message);

                    if (messages.length > 0) {
                        // Process messages from latest to oldest
                        for (let i = messages.length - 1; i >= 0; i--) {
                            const latest = messages[i];
                            if (latest.message) {
                                try {
                                    const remotePayload = JSON.parse(latest.message);
                                    
                                    // SECURITY: Handle Global Wipe Signal (Only if sent AFTER we created/linked this ID)
                                    if (remotePayload.type === 'WIPE_SIGNAL' && 
                                        remotePayload.vaultId === State.pass.vaultId &&
                                        remotePayload.timestamp > (State.pass.vaultIdCreatedAt || 0)) {
                                        localforage.clear().then(() => location.reload());
                                        return;
                                    }
                                    
                                    // SECURITY: Handle Tombstone (Vault Permanently Deleted)
                                    if (remotePayload.type === 'TOMBSTONE' && remotePayload.vaultId === State.pass.vaultId) {
                                        toast("CRITICAL: This Vault ID has been permanently deleted and cannot be used.", "error");
                                        localforage.clear().then(() => {
                                            setTimeout(() => location.reload(), 3000);
                                        });
                                        return;
                                    }

                                    if (State.pass.unlocked && remotePayload.data && remotePayload.timestamp > State.pass.lastSync) {
                                        handleRemotePulse(remotePayload);
                                        break; 
                                    }
                                } catch (e) { }
                            }
                        }
                    }
                }
            } catch (cloudErr) {
                console.warn("Cloud relay (ntfy) error:", cloudErr);
            }
        }

        updateSyncUI('success');
    } catch (e) {
        console.error("Pulse error:", e);
        updateSyncUI('error');
    } finally {
        _isSyncingPulse = false;
    }
}

async function handleRemotePulse(remote) {
    if (!remote || !remote.data || !State.pass.unlocked || !State.pass.masterKey) return;

    // Safety: ignore pulses from the past or self-echoes
    if (remote.timestamp <= State.pass.lastSync) return;

    try {
        console.log("[Local Mesh] Decrypting incoming pulse...");
        const remoteEncrypted = remote.data;
        const res = await SecureCrypto.decryptSymmetric(remoteEncrypted, State.pass.masterKey);
        const decryptedStr = typeof res === 'string' ? res : res.data;
        const remoteEntries = JSON.parse(decryptedStr);

        // Merge entries (Latest wins per entry ID)
        const localMap = new Map(State.pass.entries.map(e => [e.id, e]));
        let hasChanges = false;

        remoteEntries.forEach(e => {
            const local = localMap.get(e.id);
            // Critical: If remote is newer, update local
            if (!local || e.updatedAt > local.updatedAt) {
                localMap.set(e.id, e);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            console.log("[Local Mesh] Changes detected. Merging and re-sealing vault...");
            State.pass.entries = Array.from(localMap.values());

            // SECURITY: We must RE-ENCRYPT the merged state because our local state might have
            // had changes that weren't in the remote pulse.
            const mergedEncrypted = await SecureCrypto.encryptSymmetric(JSON.stringify(State.pass.entries), State.pass.masterKey);

            await localforage.setItem('vaultzero_passwords', mergedEncrypted);
            State.pass.lastPushData = mergedEncrypted;
            State.pass.lastSync = remote.timestamp;

            renderPasswords();
            toast("Mesh Sync: Vault updated from cloud.", "success");
        } else {
            State.pass.lastSync = remote.timestamp;
            console.log("[Local Mesh] Pulse received but no new changes detected.");
        }
    } catch (e) {
        console.warn("[Local Mesh] Pulse merge failed. Master Password mismatch or corrupt payload.");
    }
}

function updateSyncUI(status) {
    State.pass.syncStatus = status;
    const btn = document.getElementById('btn-sync-passwords');
    if (!btn) return;

    const icons = {
        idle: 'ph-duotone ph-cloud-arrow-up',
        syncing: 'ph-duotone ph-arrows-clockwise ph-spin',
        success: 'ph-duotone ph-cloud-check',
        error: 'ph-duotone ph-cloud-warning',
        offline: 'ph-duotone ph-cloud-slash'
    };

    const colors = {
        idle: '',
        syncing: '#3b82f6',
        success: '#10b981',
        error: '#ef4444',
        offline: 'rgba(255,255,255,0.3)'
    };

    btn.innerHTML = `<i class="${icons[status]}" style="color: ${colors[status]}"></i> ${status === 'success' ? 'Synced' : 'Sync'}`;
}

// Auto-Pulse on focus or network restore
window.addEventListener('online', performCloudPulse);
window.addEventListener('focus', performCloudPulse);
setInterval(performCloudPulse, 15000); // High-frequency Pulse (15 seconds)


// --- START APPLICATION ---
start();
