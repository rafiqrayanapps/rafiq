// Service Worker for "رفيق المصمم" (Rafiq Designer) PWA
const CACHE_VERSION = 'rafiq-pwa-v8';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGES_CACHE = `${CACHE_VERSION}-pages`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Essential core routes and assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/home',
  '/manifest.json',
  '/offline.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-192-maskable.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
  '/apple-touch-icon.png',
  '/favicon.ico'
];

// 1. Install Event: Precache essential assets resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Use individual caching with allSettled so one 404/network blip never breaks the whole cache
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'reload' });
            if (res.ok) {
              await cache.put(url, res);
            }
          } catch (err) {
            console.warn(`[PWA SW] Precache skipped for ${url}:`, err?.message || err);
          }
        })
      );
    })
  );
  // Force activating the newly installed service worker immediately
  self.skipWaiting();
});

// 2. Activate Event: Purge old cache versions and take immediate control of clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            console.log('[PWA SW] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Message Event: Allow web clients to trigger instant update or clear cache
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Support on-demand cache purge from settings or user action
  if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, version: CACHE_VERSION });
      }
    });
  }

  // Provide cache diagnostics
  if (event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then((keys) => {
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          version: CACHE_VERSION,
          activeCaches: keys,
        });
      }
    });
  }
});

// Helper: Normalize URL to key without volatile query params
function normalizeUrlKey(requestUrl) {
  try {
    const url = new URL(requestUrl);
    // Remove Next.js router prefetch queries and random cachebusters
    url.searchParams.delete('_rsc');
    url.searchParams.delete('v');
    return url.pathname;
  } catch {
    return requestUrl;
  }
}

// 4. Fetch Event: Multi-tiered offline-first caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP(S) GET requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // A. Strictly bypass Admin pages, API mutations, Firebase Auth & Firestore
  // We NEVER cache admin pages or sensitive credentials in service worker
  if (
    url.pathname === '/admin' ||
    url.pathname.startsWith('/admin/') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // B. Next.js React Server Component (RSC) prefetch & data payloads
  // Next.js App Router fetches RSC payloads (_rsc) when navigating between pages.
  // If offline, we MUST cache these or serve the cached RSC payload so client-side navigation doesn't crash!
  const isRscRequest =
    url.searchParams.has('_rsc') ||
    request.headers.get('RSC') === '1' ||
    request.headers.get('x-nextjs-data') === '1';

  if (isRscRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          // 1. Try exact match
          const cached = await caches.match(request);
          if (cached) return cached;

          // 2. Try match ignoring search params
          const cache = await caches.open(PAGES_CACHE);
          const matchWithoutSearch = await cache.match(request, { ignoreSearch: true });
          if (matchWithoutSearch) return matchWithoutSearch;

          // 3. Return an empty RSC stream/payload so Next router handles gracefully
          return new Response('', {
            status: 200,
            headers: {
              'Content-Type': 'text/x-component',
              'Cache-Control': 'no-store'
            }
          });
        })
    );
    return;
  }

  // C. HTML Navigation Requests (Network-First with dynamic offline caching & multi-tier fallbacks)
  const isHtmlNav =
    request.mode === 'navigate' ||
    (request.destination === 'document' && !url.pathname.endsWith('.js') && !url.pathname.endsWith('.css'));

  if (isHtmlNav) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Dynamically cache any visited valid HTML page
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PAGES_CACHE).then((cache) => {
              cache.put(request, clone);
              // Also store under plain pathname (e.g. '/home' without search params)
              if (url.pathname !== request.url) {
                cache.put(url.pathname, clone.clone());
              }
            });
          }
          return response;
        })
        .catch(async () => {
          // 1. Try matching the exact request URL in PAGES_CACHE or STATIC_CACHE
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;

          // 2. Try matching the pathname without query string
          const pathMatch = await caches.match(url.pathname, { ignoreSearch: true });
          if (pathMatch) return pathMatch;

          // 3. Try /home fallback
          const homeCached = await caches.match('/home') || await caches.match('/');
          if (homeCached) return homeCached;

          // 4. Ultimate offline page fallback
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;

          // 5. Final fallback plain text HTML
          return new Response(
            `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>غير متصل</title></head><body style="font-family:sans-serif;text-align:center;padding:50px;"><h2>أنت غير متصل بالإنترنت</h2><p>يرجى إعادة الاتصال بالشبكة للمتابعة.</p></body></html>`,
            {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        })
    );
    return;
  }

  // D. Google Fonts, Local Fonts, and Web Fonts (Cache-First)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.pathname.match(/\.(woff2|woff|ttf|eot|otf)$/i) ||
    url.pathname.includes('/_next/static/media/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // If offline and font not cached, let browser fall back to system font
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // E. Next.js Static Chunks, CSS, and JS (Stale-While-Revalidate with Cache Fallback)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              // Guard: NEVER return or cache an HTML error response for a script or stylesheet!
              // This is the direct root cause of "SyntaxError: Unexpected token '<'"
              if ((url.pathname.endsWith('.js') || request.destination === 'script') && contentType.includes('text/html')) {
                if (cachedResponse) return cachedResponse;
                return new Response('/* Script failed to load (server returned HTML) */', {
                  status: 404,
                  headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
                });
              }

              const clone = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
              return networkResponse;
            }

            // If server returned a 404 or 500 HTML page for a script, do not pass HTML to the script tag
            if (networkResponse && (url.pathname.endsWith('.js') || request.destination === 'script')) {
              const contentType = networkResponse.headers.get('content-type') || '';
              if (contentType.includes('text/html')) {
                if (cachedResponse) return cachedResponse;
                return new Response('/* Script not found */', {
                  status: networkResponse.status,
                  headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
                });
              }
            }

            return networkResponse;
          })
          .catch(() => {
            if (cachedResponse) return cachedResponse;
            if (url.pathname.endsWith('.js') || request.destination === 'script') {
              return new Response('/* Script offline */', {
                status: 503,
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
              });
            }
            return new Response('', { status: 404 });
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // F. Images, Media, Manifest, and Icons (Cache-First with Dynamic Runtime Caching)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|gif|avif)$/i) ||
    url.pathname === '/manifest.json' ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => {
            // Return empty 204 or transparent 1x1 if image fails offline
            return new Response('', { status: 408 });
          });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback for any other resource
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
