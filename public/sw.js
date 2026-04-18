const CACHE_NAME = 'rafiq-designer-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strictly Bypassing Service Worker for ALL Next.js internal and development requests
  // This is critical to avoid "Failed to load chunk" errors where the SW might intercept
  // but fail to fetch dynamic JS chunks during development or after a redeploy.
  if (
    url.pathname.includes('/_next/') || 
    url.pathname.includes('/__next/') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('x-nextjs-data')
  ) {
    // By not calling event.respondWith, we tell the browser to fetch it normally 
    // without any service worker intervention.
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          return response || caches.match('/') || caches.match('/offline.html');
        });
      })
    );
  } else {
    // For non-Next.js assets (images, fonts, etc.), use simple match or fetch
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          // If offline and not in cache, just let it fail naturally
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  }
});

// Broadcast online status if needed, but client handles window.online
