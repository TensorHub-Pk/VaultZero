/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */

/**
 * app.js — VaultZero UI Controller
 * Dual-UI: Mobile App + Desktop Command Center
 */

let APP_VERSION = 'â€”';
let deferredInstallPrompt = null;
let swRegistration = null;

const State = {
    view: 'symmetric',
    sym: { mode: 'encrypt', type: 'text', stego: false, timer: false },
    asym: { mode: 'encrypt', type: 'text', stego: false, timer: false }
};

const El = {
    // Initialized in start()
    nav: {}, sideNav: {}, views: {}, sym: {}, asym: {}, version: {}
};

async function initElements() {
    El.nav = { 
        sym: document.getElementById('nav-symmetric'), 
        asym: document.getElementById('nav-asymmetric'),
        id: document.getElementById('nav-identity')
    };
    El.sideNav = { 
        sym: document.getElementById('header-nav-sym'), 
        asym: document.getElementById('header-nav-asym'),
        id: document.getElementById('header-nav-identity')
    };
    El.views = { 
        sym: document.getElementById('view-symmetric'), 
        asym: document.getElementById('view-asymmetric'),
        id: document.getElementById('view-identity')
    };
    El.topbarTitle = document.getElementById('desktop-view-title');
    El.toast = document.getElementById('status-toast');

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
        autofill: document.getElementById('btn-load-my-key-asym'),
        stegoToggle: document.getElementById('stego-toggle-asym'),
        stegoBox: document.getElementById('stego-file-container-asym'),
        stegoInput: document.getElementById('stego-file-asym'),
        stegoDropZone: document.getElementById('stego-drop-zone-asym'),
        stegoLabel: document.getElementById('stego-label-asym'),
        timerToggle: document.getElementById('timer-toggle-asym'),
        timerBox: document.getElementById('timer-options-asym'),
        timerSelect: document.getElementById('timer-select-asym'),
        action: document.getElementById('btn-action-asym'),
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
        fileLabel: document.getElementById('file-label-asym')
    };

    El.id = {
        gen: document.getElementById('btn-generate-keys-id'),
        pubDisplay: document.getElementById('my-public-key-id'),
        copyPub: document.getElementById('btn-copy-public-id'),
        shareLink: document.getElementById('btn-share-link-id'),
        badge: document.getElementById('identity-status-badge'),
    };

    El.install = {
        sidebar: document.getElementById('btn-install-header'),
        mobile: document.getElementById('btn-install-mobile')
    };

    El.version = {
        floatingBtn: document.getElementById('floating-update-btn'),
        confirmUpdateBtn: document.getElementById('btn-confirm-update'),
        overlay: document.getElementById('updating-overlay'),
        desktopVText: document.getElementById('header-version-text'),
        mobileVText: document.getElementById('mobile-v-text'),
        statusText: document.getElementById('header-status-text'),
        statusDots: document.querySelectorAll('.status-dot')
    };
}

// --- INITIALIZE ---
async function start() {
    await initElements();
    initNetworkStatus();

    // Setup install button listeners
    if (El.install.sidebar) El.install.sidebar.addEventListener('click', triggerInstallPrompt);
    if (El.install.mobile) El.install.mobile.addEventListener('click', triggerInstallPrompt);

    updateInstallUI();

    listeners();
    theme();
    await updateIdentityStatus();
    await SecureCrypto.init();
    await initVersionControl();
    checkCacheAge();

    // Check URL for #payload or ?payload
    const urlParams = new URLSearchParams(window.location.search);
    let payload = urlParams.get('payload');
    
    if (!payload && window.location.hash.startsWith('#payload=')) {
        payload = decodeURIComponent(window.location.hash.substring(9));
    }

    if (payload) {
        if (El.asym.keyInput) El.asym.keyInput.value = payload;
        if (El.sym.msg) El.sym.msg.value = payload;
        switchMainTab(payload.startsWith('vVault') ? 'asymmetric' : 'symmetric');
        if (payload.startsWith('vVault')) setOpModeAsym('decrypt');
        else setOpMode('decrypt');
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.search;
        window.history.replaceState({path: cleanUrl}, '', cleanUrl);
        setTimeout(checkAsym, 100);
    } else if (urlParams.get('pubkey')) {
        const urlKey = urlParams.get('pubkey');
        if (urlKey && urlKey.length > 20) {
            El.asym.keyInput.value = urlKey;
            switchMainTab('asymmetric');
            setOpModeAsym('encrypt');
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({path: cleanUrl}, '', cleanUrl);
            setTimeout(checkAsym, 100);
        }
    } else if (window.location.hash.startsWith('#pubkey=')) {
        switchMainTab('symmetric');
        setOpMode('encrypt');
    }

    const idData = await localforage.getItem('my_identity');
    if (idData) {
        if (typeof idData === 'object' && idData.publicKeyBase64) {
             El.id.pubDisplay.value = idData.publicKeyBase64;
        } else if (typeof idData === 'string') {
             El.id.pubDisplay.value = idData; // Assuming raw ID string
        }
    } else {
        El.id.pubDisplay.value = "Identity not generated. Click the button below to secure your identity.";
    }
    updateIdentityStatus();

    // --- FINAL LOCKDOWN ---
    // Wait a brief moment for any pending SW updates to settle then cut the cord
    setTimeout(goOffline, 2000);
}

function goOffline() {
    const blockedFn = (name) => () => { throw new Error('OFFLINE_LOCKDOWN: ' + name + ' blocked.'); };
    const blockedFetch = () => Promise.reject(new Error('OFFLINE_LOCKDOWN: Network access disabled for this session.'));

    if (!window._nativeFetch) window._nativeFetch = window.fetch;

    // Harden: use Object.defineProperty to prevent reassignment/deletion
    // fetch stays configurable so version-control can temporarily use _nativeFetch then re-lock
    Object.defineProperty(window, 'fetch', { value: blockedFetch, writable: false, configurable: true });
    Object.defineProperty(window, 'XMLHttpRequest', { value: blockedFn('XHR'), writable: false, configurable: false });
    Object.defineProperty(window, 'WebSocket', { value: blockedFn('WebSocket'), writable: false, configurable: false });
    Object.defineProperty(window, 'EventSource', { value: blockedFn('EventSource'), writable: false, configurable: false });

    if (navigator.sendBeacon) {
        Object.defineProperty(navigator, 'sendBeacon', { value: () => false, writable: false, configurable: false });
    }

    window._offlineLocked = true;

    if (El.version.statusText) {
        El.version.statusText.textContent = 'OFFLINE SHIELD';
        El.version.statusText.style.fontWeight = '900';
        El.version.statusText.style.color = '#22c55e';
    }
    if (El.version.statusDots) {
        El.version.statusDots.forEach(dot => {
            dot.style.background = '#22c55e';
            dot.style.boxShadow = '0 0 15px rgba(34, 197, 94, 0.6)';
            dot.classList.add('secure-pulse');
            dot.classList.remove('offline');
            dot.classList.add('online');
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
    if (!text || text.includes('downloads')) return toast("No message to share. Please encrypt something first.");
    const baseUrl = window.location.origin + window.location.pathname;
    const link = baseUrl + "?payload=" + encodeURIComponent(text);
    nativeShare({
        title: 'Secure Message',
        text: 'I sent you a secure message. Open it here:',
        url: link
    }, btn);
};

function listeners() {
    [El.sym.pass, El.sym.msg].forEach(i => i.addEventListener('input', checkSym));

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

    [El.asym.keyInput, El.asym.msg].forEach(i => i.addEventListener('input', checkAsym));

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

    El.sym.action.addEventListener('click', runSym);
    El.asym.action.addEventListener('click', runAsym);
    
    El.sym.copy.addEventListener('click', () => copyTxt(El.sym.resultText.textContent, El.sym.copy));
    El.sym.copyLink.addEventListener('click', () => sharePayload(El.sym.resultText.textContent, El.sym.copyLink));

    El.id.copyPub.addEventListener('click', () => copyTxt(El.id.pubDisplay.value, El.id.copyPub));
    
    if (El.asym.copy) {
        El.asym.copy.addEventListener('click', () => copyTxt(El.asym.resultText.textContent, El.asym.copy));
    }
    if (El.asym.copyLink) {
        El.asym.copyLink.addEventListener('click', () => sharePayload(El.asym.resultText.textContent, El.asym.copyLink));
    }

    El.id.shareLink.addEventListener('click', () => {
        const pk = El.id.pubDisplay.value;
        if (!pk || pk.includes('LOCKED')) return toast("ID not ready. Please generate one.");
        const link = window.location.origin + window.location.pathname + "?pubkey=" + encodeURIComponent(pk);
        nativeShare({
            title: 'My Secure ID',
            text: 'Here is my public ID for VaultZero:',
            url: link
        }, El.id.shareLink);
    });

    El.id.gen.addEventListener('click', rotateId);
    El.asym.autofill.addEventListener('click', fillMyKey);

    if (El.version.confirmUpdateBtn) {
        El.version.confirmUpdateBtn.addEventListener('click', triggerAppUpdate);
    }
    if (El.version.sideBtn) El.version.sideBtn.addEventListener('click', triggerAppUpdate);
    if (El.version.mobileBtn) El.version.mobileBtn.addEventListener('click', triggerAppUpdate);


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
    setupDrag(El.sym.stegoDropZone, El.sym.stegoInput, 'image');
    setupDrag(El.asym.stegoDropZone, El.asym.stegoInput, 'image');

    // Handle context-specific validation in drag/drop
    El.sym.fileBox.addEventListener('drop', () => { if(State.sym.mode === 'decrypt') checkSym(); });
    El.asym.fileBox.addEventListener('drop', () => { if(State.asym.mode === 'decrypt') checkAsym(); });

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

window.switchMainTab = (v) => {
    State.view = v;
    const isSym = v === 'symmetric';

    // Mobile bottom nav
    El.nav.sym.classList.toggle('active', v === 'symmetric');
    El.nav.asym.classList.toggle('active', v === 'asymmetric');
    El.nav.id.classList.toggle('active', v === 'identity');

    // Desktop sidebar nav
    if (El.sideNav.sym) El.sideNav.sym.classList.toggle('active', v === 'symmetric');
    if (El.sideNav.asym) El.sideNav.asym.classList.toggle('active', v === 'asymmetric');
    if (El.sideNav.id) El.sideNav.id.classList.toggle('active', v === 'identity');

    // View sections
    El.views.sym.classList.toggle('hidden', v !== 'symmetric');
    El.views.asym.classList.toggle('hidden', v !== 'asymmetric');
    El.views.id.classList.toggle('hidden', v !== 'identity');

    // Desktop topbar title
    if (El.topbarTitle) {
        if (v === 'symmetric') El.topbarTitle.textContent = 'Secret Vault';
        else if (v === 'asymmetric') El.topbarTitle.textContent = 'Secure Share';
        else El.topbarTitle.textContent = 'My Identity';
    }

    // Clear memory & state on context switch
    [El.sym.pass, El.sym.msg, El.asym.keyInput, El.asym.msg].forEach(e => { if (e) e.value = ''; });
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
    El.asym.keyLabel.textContent = m === 'encrypt' ? "Friend's Public ID" : "My Private ID";
    El.asym.autofill.classList.toggle('hidden', m !== 'decrypt');
    El.asym.actionText.textContent = m === 'encrypt' ? 'Secure & Send' : 'Unlock & Open';
    
    // Clear data on switch
    El.asym.msg.value = '';
    El.asym.fileInput.value = '';
    El.asym.stegoInput.value = '';
    El.asym.keyInput.value = '';
    El.asym.fileLabel.textContent = "Click to attach file";
    El.asym.fileBox.classList.remove('success');
    if (El.asym.stegoLabel) El.asym.stegoLabel.textContent = 'Click or drop image here';
    if (El.asym.stegoDropZone) El.asym.stegoDropZone.classList.remove('success');
    El.asym.resultArea.classList.add('hidden');
    El.asym.resultText.textContent = '';

    const isEnc = m === 'encrypt';

    // Hide Toggle Chips in Decrypt
    const chips = El.asym.optionsArea ? El.asym.optionsArea.querySelector('.options-row') : null;
    if (chips) chips.classList.toggle('hidden', !isEnc);

    // Strictly show/hide elements
    // El.asym.optionsArea NO LONGER hidden in decrypt
    // Options
    El.asym.stegoBox.classList.add('hidden');
    El.asym.timerBox.classList.toggle('hidden', !isEnc || !State.asym.timer);
    
    // Key Field Label & Placeholder
    if (El.asym.keyLabel) El.asym.keyLabel.textContent = isEnc ? "Friend's Public ID" : "My Private ID";
    El.asym.keyInput.placeholder = isEnc ? "Paste their ID here" : "Enter your Private Key/ID";

    const asymInputLabel = document.getElementById('asym-msg-label');
    if (asymInputLabel) asymInputLabel.textContent = isEnc ? 'Message or File' : 'Encrypted Volume';
    El.asym.msg.placeholder = isEnc ? 'Only your friend can read this...' : 'Paste ciphertext or share link...';
    El.asym.fileLabel.textContent = isEnc ? "Click to attach file" : "Drop encrypted file or photo";

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
    
    // Check if identity exists in the display field
    const idValue = El.id.pubDisplay.value.trim();
    const isLocked = idValue.includes('LOCKED') || idValue.includes('not generated');
    const hasId = idValue.length > 20 && !isLocked;
    
    const badge = El.id.badge;
    const card = document.querySelector('.identity-profile-card');
    const dot = badge.querySelector('.status-dot');
    const text = badge.querySelector('span');
    const btnGroup = document.querySelector('.id-card-actions');
    const keyContainer = document.querySelector('.key-display-container');
    
    // Toggle Button States
    if (El.id.copyPub) El.id.copyPub.disabled = !hasId;
    if (El.id.shareLink) El.id.shareLink.disabled = !hasId;
    
    if (hasId) {
        badge.style.color = 'var(--green)';
        badge.style.background = 'rgba(34, 197, 94, 0.08)';
        badge.style.borderColor = 'rgba(34, 197, 94, 0.2)';
        if (text) text.textContent = 'IDENTITY ACTIVE';
        if (dot) {
            dot.style.background = 'var(--green)';
            dot.style.boxShadow = '0 0 12px var(--green-glow)';
        }
        if (card) {
            card.style.borderColor = 'rgba(34, 197, 94, 0.3)';
            card.classList.add('identity-active');
            card.classList.remove('identity-inactive');
        }
    } else {
        badge.style.color = 'var(--red)';
        badge.style.background = 'rgba(239, 68, 68, 0.08)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        if (text) text.textContent = 'IDENTITY NOT GENERATED';
        if (dot) {
            dot.style.background = 'var(--red)';
            dot.style.boxShadow = '0 0 12px var(--red-glow)';
        }
        if (card) {
            card.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            card.classList.add('identity-inactive');
            card.classList.remove('identity-active');
        }
        // Ensure textarea shows helpful hint if empty
        if (!idValue) El.id.pubDisplay.value = "Identity not generated. Click the button below to secure your identity.";
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
            toast(`File too large (Max: ${Math.round(maxSize/1024/1024)}MB).`);
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
        ok = (El.sym.pass.value.length >= 4) && inputOk && stegoOk;
    } else {
        ok = (El.sym.pass.value.length >= 4) && (hasText || hasFile);
    }
    El.sym.action.disabled = !ok;
}

function checkAsym() {
    let ok;
    const hasText = El.asym.msg.value.length > 0;
    const hasFile = El.asym.fileInput.files && El.asym.fileInput.files.length > 0;

    // UI Updates for Input Collapse
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

    if (State.asym.mode === 'encrypt') {
        const hasStego = El.asym.stegoInput.files && El.asym.stegoInput.files.length > 0;
        const inputOk = hasText || hasFile;
        const stegoOk = !State.asym.stego || hasStego;
        ok = El.asym.keyInput.value.length > 20 && inputOk && stegoOk;
    } else {
        ok = El.asym.keyInput.value.length > 20 && (hasText || hasFile);
    }
    El.asym.action.disabled = !ok;
}

async function runSym() {
    try {
        El.sym.action.disabled = true;
        const pass = El.sym.pass.value;
        const ttl = State.sym.timer ? Date.now() + parseInt(El.sym.timerSelect.value) : null;

        let out;
        if (State.sym.mode === 'encrypt') {
            const file = El.sym.fileInput.files[0];
            let data = file ? 
                new Uint8Array(await file.arrayBuffer()) : 
                El.sym.msg.value;

            const cipher = await SecureCrypto.encryptSymmetric(data, pass, ttl, file?.name, file?.type);
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
        } else {
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

            const dec = await SecureCrypto.decryptSymmetric(cipher, pass);
            const isFile = dec && typeof dec === 'object' && dec.is_file;
            
            if (isFile) {
                const url = URL.createObjectURL(new Blob([dec.data], {type: dec.type}));
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
                } catch(e) { /* not valid UTF-8 */ }

                if (isReadableText) {
                    // It's actually text â€” show as copyable text
                    El.sym.copy.classList.remove('hidden');
                    El.sym.copyLink.classList.remove('hidden');
                    El.sym.download.classList.add('hidden');
                    out = textContent;
                } else {
                    const url = URL.createObjectURL(new Blob([dec], {type: 'application/octet-stream'}));
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
        toast("Success!");
        if (window.AuditLog) AuditLog.log(State.sym.mode === 'encrypt' ? AuditLog.EventType.ENCRYPT_SUCCESS : AuditLog.EventType.DECRYPT_SUCCESS, { mode: 'symmetric' });
    } catch (e) {
        toast(`Error: ${e.message}`);
        if (window.AuditLog && State.sym.mode === 'decrypt') {
            const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'symmetric', error: e.message });
            if (isAnomaly) toast('\u26A0 Anomalous activity detected');
        }
    }
    finally { El.sym.action.disabled = false; }
}

async function runAsym() {
    try {
        El.asym.action.disabled = true;
        const ttl = State.asym.timer ? Date.now() + parseInt(El.asym.timerSelect.value) : null;
        let out;

        if (State.asym.mode === 'encrypt') {
            const file = El.asym.fileInput.files[0];
            let data = file ? 
                new Uint8Array(await file.arrayBuffer()) : 
                El.asym.msg.value;

            const cipher = await SecureCrypto.encryptAsymmetric(data, El.asym.keyInput.value.trim(), ttl, file?.name, file?.type);
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
        } else {
            // Auto-detect source: Stego Input > File Input > Text Area
            let cipher;
            if (El.asym.stegoInput.files[0]) {
                cipher = await Stego.reveal(await Stego.prepareImage(El.asym.stegoInput.files[0]));
            } else if (El.asym.fileInput.files[0]) {
                const file = El.asym.fileInput.files[0];
                const ext = file.name.split('.').pop().toLowerCase();
                if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
                    cipher = await Stego.reveal(await Stego.prepareImage(file));
                } else {
                    cipher = await file.text();
                }
            } else {
                cipher = El.asym.msg.value.trim();
            }

            const dec = await SecureCrypto.decryptAsymmetric(cipher, El.asym.keyInput.value.trim());
            const isFile = dec && typeof dec === 'object' && dec.is_file;

            if (isFile) {
                const url = URL.createObjectURL(new Blob([dec.data], {type: dec.type}));
                const save = () => downloadFile(url, dec.name);
                save();
                El.asym.download.onclick = save;
                El.asym.download.classList.remove('hidden');
                El.asym.copy.classList.add('hidden');
                El.asym.copyLink.classList.add('hidden');
                out = `FILE RESTORED: ${dec.name}`;
            } else if (dec instanceof Uint8Array || (dec && dec.constructor && dec.constructor.name === 'Uint8Array')) {
                // Fallback: raw binary without metadata (e.g., old format)
                let isReadableText = false;
                let textContent = '';
                try {
                    textContent = new TextDecoder('utf-8', { fatal: true }).decode(dec);
                    const printableRatio = textContent.split('').filter(c => {
                        const code = c.charCodeAt(0);
                        return (code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9;
                    }).length / textContent.length;
                    isReadableText = printableRatio > 0.90 && textContent.length > 0;
                } catch(e) { /* not valid UTF-8 */ }

                if (isReadableText) {
                    El.asym.copy.classList.remove('hidden');
                    El.asym.copyLink.classList.remove('hidden');
                    El.asym.download.classList.add('hidden');
                    out = textContent;
                } else {
                    const url = URL.createObjectURL(new Blob([dec], {type: 'application/octet-stream'}));
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
        toast("Success!");
        if (window.AuditLog) AuditLog.log(State.asym.mode === 'encrypt' ? AuditLog.EventType.ENCRYPT_SUCCESS : AuditLog.EventType.DECRYPT_SUCCESS, { mode: 'asymmetric' });
    } catch (e) {
        toast(`Error: ${e.message}`);
        if (window.AuditLog && State.asym.mode === 'decrypt') {
            const isAnomaly = await AuditLog.log(AuditLog.EventType.DECRYPT_FAILED, { mode: 'asymmetric', error: e.message });
            if (isAnomaly) toast('\u26A0 Anomalous activity detected');
        }
    }
    finally { El.asym.action.disabled = false; }
}

async function rotateId() {
    if (confirm("Replace your current ID? This cannot be undone.")) {
        const pass = prompt("Create a Vault PIN or Password to encrypt your local ID at rest:");
        if (!pass) return toast("Cancelled. Password required.");
        
        const id = await SecureCrypto.generateKeyPair();
        const encryptedId = await SecureCrypto.encryptSymmetric(JSON.stringify(id), pass);
        
        await localforage.setItem('my_identity', encryptedId);
        El.id.pubDisplay.value = id.publicKeyBase64;
        await updateIdentityStatus();
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.KEY_GENERATED, { hasPQ: !!id.pqSigningPublicKey });
        toast("New ID Generated & Secured");
    }
}

async function fillMyKey() {
    const idData = await localforage.getItem('my_identity');
    if (!idData) return toast("No ID found. Generate one first.");

    if (typeof idData === 'object' && idData.privateKeyBase64) {
        // Legacy Plaintext Upgrade
        const pass = prompt("Your ID is currently insecure. Enter a new Vault PIN to encrypt it now:");
        if (!pass) return toast("Cancelled. Cannot proceed without securing ID.");
        const encryptedId = await SecureCrypto.encryptSymmetric(JSON.stringify(idData), pass);
        await localforage.setItem('my_identity', encryptedId);
        toast("ID Secured!");
        await updateIdentityStatus();
        El.asym.keyInput.value = idData.privateKeyBase64;
        checkAsym();
        return;
    }

    // Encrypted Flow
    const pass = prompt("Enter your Vault PIN to unlock your Identity:");
    if (!pass) return;

    try {
        const decryptedStr = await SecureCrypto.decryptSymmetric(idData, pass);
        const id = JSON.parse(decryptedStr);
        El.id.pubDisplay.value = id.publicKeyBase64; // Update display
        El.asym.keyInput.value = id.privateKeyBase64;
        toast("Identity Unlocked");
        checkAsym();
    } catch(e) {
        toast("Incorrect Vault PIN!");
    }
}

let _toastTimer;
function toast(m) {
    El.toast.textContent = m;
    El.toast.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => El.toast.classList.remove('show'), 3000);
}

function copyTxt(t, b) {
    const performCopy = () => {
        const span = b.querySelector('span');
        const originalText = span ? span.textContent : b.textContent;
        let successText = "COPIED!";
        if (b.id.includes('share-link')) successText = "LINK COPIED!";
        if (b.id.includes('copy-link')) successText = "LINK COPIED!";
        
        b.classList.add('success');
        if (span) span.textContent = successText;
        else b.textContent = successText;

        setTimeout(() => {
            b.classList.remove('success');
            if (span) span.textContent = originalText;
            else b.textContent = originalText;
        }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(performCopy).catch(() => {
            fallbackCopy(t, performCopy);
        });
    } else {
        fallbackCopy(t, performCopy);
    }
}

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
window.onPanicWipe = () => {
    if (confirm("ERASE EVERYTHING? All keys and data will be lost forever.")) {
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.WIPE_EXECUTED);
        localforage.clear().then(() => location.reload());
    }
};

// --- SECURE VERSION CONTROL ---
// version.json is the SINGLE source of truth for app version.
// To trigger an update: only edit version.json on the server.


/**
 * Compare version strings (e.g., '1.9' vs '2.0').
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na < nb) return -1;
        if (na > nb) return 1;
    }
    return 0;
}

/**
 * Compute SHA-256 hash of a text string (for script integrity verification).
 */
async function sha256Text(text) {
    const enc = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
        hashes: manifest.hashes || {}
    };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(signable));
    // Verify with Ed25519 via libsodium
    const isValid = SecureCrypto.verifySignature(
        payloadBytes,
        manifest.signature,
        manifest.signerPublicKey
    );
    if (!isValid) {
        if (window.AuditLog) AuditLog.log(AuditLog.EventType.SIGNATURE_INVALID, { version: manifest.version });
    }
    return isValid;
}

/**
 * Verify SHA-256 hashes of critical scripts against manifest.
 * Also verifies manifest signature first.
 * Uses cache-busting to fetch from NETWORK (not SW cache) so we verify 
 * the actual server files, not stale cached versions.
 */
async function verifyScriptIntegrity(manifest) {
    // Step 1: Verify manifest signature
    if (!verifyManifestSignature(manifest)) {
        return false;
    }

    // Step 2: Verify individual file hashes from the NETWORK
    if (!manifest.hashes || Object.keys(manifest.hashes).length === 0) return true;
    const fetcher = window._nativeFetch || fetch;

    // Cache-busting param ensures SW falls through to network
    // (SW only caches exact pathname matches like '/app.js', not '/app.js?_v=...')
    const cacheBuster = `?_v=${Date.now()}`;

    for (const [file, expectedHash] of Object.entries(manifest.hashes)) {
        try {
            const res = await fetcher(file + cacheBuster, { cache: 'no-store' });
            if (!res.ok) continue;
            // Hash raw bytes (ArrayBuffer) to match the Node.js signing tool
            const buf = await res.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
            const actualHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            if (actualHash !== expectedHash) {
                return false;
            }
        } catch(e) {
            /* offline — skip file verification */
        }
    }
    return true;
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
        } catch(e) { /* offline — use default */ }
        if (!installedVersion) installedVersion = '1.0';
        await localforage.setItem('app_version', installedVersion);
    }
    APP_VERSION = installedVersion;
    if (El.version.desktopVText) El.version.desktopVText.textContent = `V${APP_VERSION}`;
    if (El.version.mobileVText) El.version.mobileVText.textContent = `V${APP_VERSION}`;

    // 3. Network check â€” fetch latest update-info.json from server
    let serverVersion = null;
    let manifest = null;
    try {
        const fetcher = window._nativeFetch || fetch;
        const res = await fetcher('update-info.json?t=' + Date.now(), { cache: 'no-cache' });
        if (res.ok) {
            manifest = await res.json();
            serverVersion = manifest.version;
        }
    } catch(e) {
        /* offline — skip update check */
    }

    // Re-lock fetch if offline lockdown was active
    if (window._offlineLocked) {
        const blockedFetch = () => Promise.reject(new Error('OFFLINE_LOCKDOWN: Network access disabled for this session.'));
        Object.defineProperty(window, 'fetch', { value: blockedFetch, writable: false, configurable: true });
    }

    // 4. Compare: server version vs installed version
    // Anti-downgrade: only allow upgrade (server > installed), never downgrade
    let updateAvailable = false;
    if (serverVersion && serverVersion !== installedVersion) {
        if (compareVersions(serverVersion, installedVersion) > 0) {
            updateAvailable = true;

        } else {
            /* downgrade blocked */
        }
    }

    // 5. If update available, verify script integrity before prompting
    if (updateAvailable && manifest) {
        const integrityOk = await verifyScriptIntegrity(manifest);
        if (!integrityOk) {

            updateAvailable = false;
            toast("Update blocked: integrity check failed.");
            if (window.AuditLog) AuditLog.log(AuditLog.EventType.UPDATE_BLOCKED, { version: serverVersion });
        }
    }

    if (updateAvailable) {
        El.version.floatingBtn.classList.remove('hidden');
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
                    // Has network content finished downloading?
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New update is available
                        El.version.floatingBtn.classList.remove('hidden');
                    }
                });
            });

            reg.update();

        } catch(err) {
            /* SW registration failed */
        }
    }
    
    // Listen for the controlling service worker changing (happens after skipWaiting)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
    });
}

async function triggerAppUpdate() {
    if (El.version.overlay) El.version.overlay.classList.remove('hidden');
    
    // Animate modal out and floating button away before applying
    const updateModal = document.getElementById('update-confirm-modal');
    if (updateModal) {
        updateModal.classList.remove('active');
        setTimeout(() => updateModal.classList.add('hidden'), 300);
    }
    El.version.floatingBtn.classList.add('hidden');

    try {
        // Clear stored version so it matches new installation
        await localforage.removeItem('app_version');

        if (!swRegistration || !swRegistration.waiting) {
            // No waiting worker or service workers inherently not supported.
            // Aggressive fallback cache clear
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            if (swRegistration) await swRegistration.unregister();
            window.location.reload(true);
            return;
        }

        // Send SKIP_WAITING to the waiting worker.
        // It will claim clients and trigger the 'controllerchange' event listener
        // defined in initVersionControl to safely reload once activated.
        swRegistration.waiting.postMessage('SKIP_WAITING');
    } catch(e) {
        // Absolute fallback if messaging fails
        window.location.reload(true);
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
        if (isInstalled) {
            El.install.sidebar.classList.add('hidden');
        } else {
            El.install.sidebar.classList.remove('hidden');
        }
    }

    // Mobile
    if (El.install.mobile) {
        if (isInstalled) {
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
            
            // Hide on scroll down, show on scroll up (100px threshold)
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
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

// --- CACHE AGE CHECK (48 HOURS) ---
function checkCacheAge() {
    const CACHE_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours
    const now = Date.now();
    
    // Attempt to get last load time
    let lastLoad = localStorage.getItem('vaultzero_last_load');
    
    if (!lastLoad) {
        // First load or cleared storage
        localStorage.setItem('vaultzero_last_load', now.toString());
        return;
    }
    
    lastLoad = parseInt(lastLoad, 10);
    
    if (now - lastLoad > CACHE_MAX_AGE_MS) {
        // Cache is older than 48 hours, show gentle prompt
        showCacheReloadPrompt();
    } else {
        // Still fresh, update timestamp slightly to prevent aggressive prompting 
        // if they open and close frequently, but we only really reset it 
        // on a true reload. We'll leave it alone here.
    }
}

function showCacheReloadPrompt() {
    // Show the floating button if cache is extremely old
    if (El.version && El.version.floatingBtn) {
        El.version.floatingBtn.classList.remove('hidden');
        El.version.floatingBtn.setAttribute('title', 'Security Notice: Reload App');
    } else {
        // Fallback toast
        toast("App session is over 48 hours old. Please reload for security updates.");
    }
}

// --- NETWORK STATUS ---
function initNetworkStatus() {
    const update = () => {
        const isOnline = navigator.onLine;
        if (El.version.statusText) {
            El.version.statusText.textContent = isOnline ? 'Online' : 'Secure Offline';
            // Use a softer warning color for offline ready state
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

// --- START APPLICATION ---
start();
