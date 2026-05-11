/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */


const CACHE_NAME = 'vault-v3.0-stable';

// Core assets to pre-cache (no '/' — it can 301 on CDN/redirect hosts and kill cache.addAll)
// ASSETS_TO_CACHE: Everything needed for offline operation.
const ASSETS_TO_CACHE = [
  'vault.html',
  'vault-design.css',
  'vault-pro.css',
  'app-identity.json',
  'app.js',
  'encryption.js',
  'image-hide.js',
  'security-logs.js',
  'libs/localforage.min.js',
  'libs/sodium.js',
  'libs/argon2-bundled.min.js',
  'libs/argon2.wasm',
  'libs/kyber.js',
  'assets/logo.png',
  'assets/pulse.svg',
  'assets/fevicon.jpeg',
  'assets/og-image.jpeg'
];

// SECURITY_CRITICAL_ASSETS: Absolute core files that MUST match the cryptographic signature.
// These are the only files that will trigger a security lockdown if they mismatch.
const SECURITY_CRITICAL_ASSETS = [
  'app.js',
  'encryption.js',
  'service-worker.js',
  'libs/localforage.min.js',
  'libs/sodium.js',
  'libs/argon2-bundled.min.js',
  'libs/argon2.wasm',
  'libs/kyber.js'
];

// In-memory store for hashes verified by the main thread's manifest signature check
let trustedHashes = {};

/**
 * Broadcasts security anomalies to all active clients (tabs)
 */
async function notifySecurityAnomaly(url, expected, actual, isCritical) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      _vz: true,
      type: 'SECURITY_ANOMALY',
      asset: url,
      expected: expected,
      actual: actual,
      isCritical: isCritical,
      timestamp: Date.now()
    });
  });
}

// Helper to cache assets and bypass Chrome's restriction on caching redirected responses.
// Also performs cryptographic integrity verification if trustedHashes are available.
async function cacheAsset(cache, url) {
  try {
    // Force network fetch to bypass edge CDN caching during installations/updates
    const fetchUrl = new URL(url, self.location.href);
    const response = await fetch(fetchUrl.toString(), { cache: 'no-store' });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    // Stage 2: Integrity Verification
    // Strip query params and fragments to get the base filename for hash lookup
    const filename = url.split('/').pop().split('?')[0].split('#')[0];
    const extension = filename.split('.').pop().toLowerCase();
    const hashData = trustedHashes[url] || trustedHashes[filename];

    if (hashData) {
      const filename = url.split('/').pop().split('?')[0].split('#')[0];
      const extension = filename.split('.').pop().toLowerCase();
      const isText = ['js', 'html', 'css', 'json', 'xml', 'txt', 'svg'].includes(extension);

      let buf;
      if (isText) {
        let text = await response.clone().text();
        // Strip UTF-8 BOM and normalize CRLF to LF to match the signing tool
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        text = text.replace(/\r\n/g, '\n');
        buf = new TextEncoder().encode(text);
      } else {
        buf = await response.clone().arrayBuffer();
      }

      // Double Verification: SHA-256 + SHA-512
      const [h256, h512] = await Promise.all([
        crypto.subtle.digest('SHA-256', buf),
        crypto.subtle.digest('SHA-512', buf)
      ]);

      const actual256 = Array.from(new Uint8Array(h256)).map(b => b.toString(16).padStart(2, '0')).join('');
      const actual512 = Array.from(new Uint8Array(h512)).map(b => b.toString(16).padStart(2, '0')).join('');

      const expected256 = typeof hashData === 'object' ? hashData.sha256 : hashData;
      const expected512 = typeof hashData === 'object' ? hashData.sha512 : null;

      if (actual256 === expected256 && (!expected512 || actual512 === expected512)) {
        console.log(`[SW] Double-Hash Verified: ${url}`);
      } else {
        const isSecurityCritical = SECURITY_CRITICAL_ASSETS.some(a => url.includes(a)) || url.endsWith('.js');

        // Notify the UI about the anomaly so it appears in the Audit Log
        notifySecurityAnomaly(url, expected256, actual256, isSecurityCritical);

        if (isSecurityCritical) {
          console.error(`[SW] Integrity Check Failed for Critical Asset: ${url}.`);
          throw new Error(`Integrity mismatch for security-critical asset: ${url}`);
        } else {
          console.warn(`[SW] Integrity Mismatch for non-critical asset: ${url}. Skipping strict verification.`);
        }
      }
    } else if (Object.keys(trustedHashes).length > 0) {
      // SECURITY POLICY: If the manifest is loaded, but a JS file is missing its hash,
      // it is a potential Shadow Script attack.
      const isJS = url.endsWith('.js');
      if (isJS) {
        notifySecurityAnomaly(url, 'MISSING_HASH', 'UNKNOWN', true);
        console.error(`[SW] Security Policy Breach: Missing trusted hash for script ${url}`);
        throw new Error(`Security Policy: Missing hash for ${url}`);
      }
    }

    // If the response is redirected (e.g. vault.html -> /vault via Clean URLs),
    // we MUST reconstruct the response. Chrome rejects `cache.put` for redirected responses.
    if (response.redirected) {
      const cleanResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      await cache.put(url, cleanResponse);
    } else {
      await cache.put(url, response);
    }
  } catch (err) {
    console.warn('[SW] Failed to cache:', url, err.message);
    throw err; // MUST throw to fail the install phase if critical files are missing
  }
}

self.addEventListener('install', event => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Installing and pre-caching assets');
      // Cache each asset individually using our custom redirect-safe fetcher
      return Promise.all(
        ASSETS_TO_CACHE.map(url => cacheAsset(cache, url))
      );
    })
  );
});

self.addEventListener('activate', event => {
  console.log('SW: Activated');
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Become the controller for all clients immediately
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Clearing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests that aren't CDNs we care about
  const allowedCDNs = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'raw.githubusercontent.com', 'bestpractices.dev', 'www.bestpractices.dev', 'cdn.lordicon.com'];
  if (url.origin !== self.location.origin && !allowedCDNs.includes(url.hostname)) {
    return;
  }

  // Network-first for update manifest and any requests with cache-busting timestamps
  // Also BYPASS for robots.txt and sitemap.xml to prevent them from being redirected to vault.html
  if (url.pathname.endsWith('/update-info.json') || 
      url.pathname.endsWith('/robots.txt') || 
      url.pathname.endsWith('/sitemap.xml') || 
      url.searchParams.has('t') || 
      url.searchParams.has('nocache')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For navigation requests (page loads from shortcut/address bar)
  // Network-first for landing pages (Home/Protocol) to ensure they are never stale
  // Cache-first for the Vault App to ensure instant offline startup
  if (event.request.mode === 'navigate') {
    const isLandingPage = url.pathname.endsWith('/') ||
      url.pathname.endsWith('index.html') ||
      url.pathname.endsWith('protocol.html');

    if (isLandingPage) {
      event.respondWith(fetch(event.request));
      return;
    }

    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(cached => {
        if (cached) {
          return cached;
        }
        // Not in cache by exact URL — try multiple potential paths
        return caches.match('vault.html', { ignoreSearch: true });
      }).then(cached => {
        if (cached) {
          return cached;
        }
        // Nothing in cache — try network
        return fetch(event.request);
      }).catch(() => {
        // Both cache and network failed
        return new Response(
          '<!DOCTYPE html><html><body><h1>VaultZero Offline</h1><p>Please connect to the internet to load VaultZero for the first time.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Cache-first for all other assets (CSS, JS, images, fonts, WASM)
  // On cache miss, fetch from network and cache the response for offline use
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(networkResponse => {
        // Cache ALL successful GET responses (including opaque no-cors responses from CDNs) for full offline support
        if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SET_TRUSTED_HASHES') {
    trustedHashes = event.data.hashes || {};
    console.log('[SW] Trusted hashes updated:', Object.keys(trustedHashes).length, 'files');
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ _vz: true, status: 'ok' });
    }
  }
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'FORCE_RECACHE') {
    if (event.data.hashes) {
      trustedHashes = event.data.hashes;
      console.log('[SW] Hashes refreshed for Force Recache:', Object.keys(trustedHashes).length);
    }

    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then(async cache => {
        const results = await Promise.allSettled(
          ASSETS_TO_CACHE.map(url => cacheAsset(cache, url))
        );

        // Count actual failures from our cacheAsset results
        const failed = results.filter(r =>
          r.status === 'rejected' ||
          (r.value && r.value.success === false)
        ).length;

        if (event.source) {
          event.source.postMessage({
            _vz: true,
            type: 'RECACHE_COMPLETE',
            success: failed === 0,
            failedCount: failed
          });
        }
      });
    });
  }
});
