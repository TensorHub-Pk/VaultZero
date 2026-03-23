/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */

const CACHE_NAME = 'vault-v2.1'; // Update version to trigger cache refresh
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './vault.html',
  './vault-design.css',
  './home-design.css',
  './app-identity.json',
  './app.js',
  './encryption.js',
  './image-hide.js',
  './security-logs.js',
  './libs/localforage.min.js',
  './libs/sodium.js',
  './libs/argon2-bundled.min.js',
  './libs/argon2.wasm',
  './libs/kyber.js',
  './assets/logo.png',
  './assets/fevicon.jpeg',
  './assets/og-image.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Bypass cache for update manifests (Always network-first)
  if (url.pathname.endsWith('/update-info.json') || url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. Main Logic: Cache-first with Stale-While-Revalidate for CDNs
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If valid response, check if it's a CDN or remote asset we should cache dynamically
          if (networkResponse && networkResponse.status === 200) {
            const isCDN = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'raw.githubusercontent.com'].includes(url.hostname);
            
            if (isCDN) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
          }
          return networkResponse;
        }).catch(() => {
          // Fallback if network is down — do NOT return null here as it crashes the page load
          return null; 
        });

        // Return cached version immediately if available, otherwise wait for network
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, we MUST return the fetch promise, 
        // but we need to handle the case where the fetch itself fails and returns null
        return fetchPromise.then(res => {
          if (res) return res;
          // Absolute last resort: if it's a navigation request, we could show an offline page, 
          // but for now we just let the browser handle the error.
          throw new Error('Network error and asset not in cache');
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'FORCE_RECACHE') {
    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE));
    });
  }
});
