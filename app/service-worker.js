/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */

const CACHE_NAME = 'vault-v2';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'vault.html',
  'vault-design.css',
  'home-design.css',
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
  'assets/fevicon.jpeg',
  'assets/og-image.jpeg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for update manifest (update checks must bypass cache)
  if (url.pathname.endsWith('/update-info.json') || url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for all other requests, with dynamic CDN caching
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      // 1. Fire off the network fetch to update CDNs or just fetch if no cache
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.ok && event.request.method === 'GET') {
          const urlObj = new URL(event.request.url);
          const isCDN = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'raw.githubusercontent.com'].includes(urlObj.hostname);
          if (isCDN) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
        }
        return networkResponse;
      }).catch(err => {
        // Network failed (offline). Return null so we can check it later.
        return null; 
      });

      // 2. If we found a cached response, return it immediately!
      if (cachedResponse) {
        return cachedResponse;
      }

      // 3. If NOT in cache, wait for the network response.
      return fetchPromise.then(networkResponse => {
        if (networkResponse) {
          return networkResponse; // Network succeeded
        }
        // 4. Network failed AND not in cache. Fallback for navigation requests.
        if (event.request.mode === 'navigate') {
          return caches.match('./vault.html', { ignoreSearch: true }).then(fallbackResponse => {
             // Return fallback if exists, otherwise a generic error to prevent crash
             return fallbackResponse || new Response('Offline and not cached.', { status: 503, statusText: 'Service Unavailable' });
          });
        }
        // For images/css, just return a generic error instead of crashing
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
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
