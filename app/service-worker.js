/**
 * VaultZero — Zero-Knowledge Offline Encryption
 * Copyright (c) 2026 VaultZero Contributors
 * SPDX-License-Identifier: MIT
 */

const CACHE_NAME = 'vault-v4';

// Core assets to pre-cache (no '/' — it can 301 on CDN/redirect hosts and kill cache.addAll)
const ASSETS_TO_CACHE = [
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
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache each asset individually so one failure doesn't abort the entire install
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn('[SW] Failed to cache:', url, err.message);
          })
        )
      );
    })
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
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests that aren't CDNs we care about
  const allowedCDNs = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com', 'raw.githubusercontent.com', 'bestpractices.dev', 'www.bestpractices.dev'];
  if (url.origin !== self.location.origin && !allowedCDNs.includes(url.hostname)) {
    return;
  }

  // Network-first for update manifest (update checks must bypass cache)
  if (url.pathname.endsWith('/update-info.json') || url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For navigation requests (page loads from shortcut/address bar)
  // Cache-first with network fallback for offline support
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(cached => {
        if (cached) {
          return cached;
        }
        // Not in cache by exact URL — try vault.html directly
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
        // Cache ALL successful GET responses for full offline support
        if (networkResponse && networkResponse.ok) {
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
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'FORCE_RECACHE') {
    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then(cache => {
        Promise.allSettled(
          ASSETS_TO_CACHE.map(url => cache.add(url).catch(() => {}))
        );
      });
    });
  }
});
