self.options = {
    "domain": "5gvci.com",
    "zoneId": 11367598
};
self.lary = "";
importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');

const CACHE_NAME = 'rafiq-designer-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// 1. Caching & Offline Capabilities
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
  if (
    url.pathname.includes('/_next/') || 
    url.pathname.includes('/__next/') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1' ||
    event.request.headers.get('x-nextjs-data')
  ) {
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
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  }
});

// 2. Firebase Cloud Messaging (FCM) Background Notification Support
// Import Firebase Scripts (compat version is best suited for Service Worker context)
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// Config object template - replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase App
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'رسالة جديدة من رفيق المصمم';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك محتوى جديد بانتظارك!',
    icon: payload.notification?.icon || 'https://picsum.photos/seed/rafiq-icon/192/192',
    badge: 'https://picsum.photos/seed/rafiq-icon/192/192',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
