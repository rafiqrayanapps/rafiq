'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';
    const isIframe = window.self !== window.top;

    // In development or when embedded in the AI Studio preview iframe,
    // unregister any active service worker and clear caches to prevent chunk mismatch and Unexpected token '<'
    if (isDev || isIframe) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // Immediately check for updates
        registration.update().catch(() => {});

        // Check for updates on load
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New content is available; sending SKIP_WAITING.');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Listen for controlling service worker change to refresh stale caches safely
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          console.log('[PWA] Controller changed; refreshing to apply updates.');
          // Don't reload if the user is currently offline to preserve active state
          if (navigator.onLine) {
            window.location.reload();
          }
        });

        if (registration.active) {
          console.log('[PWA] ServiceWorker registered and active with scope:', registration.scope);
        }

        // Re-check for new versions when the user returns to the app tab or regains connectivity
        const checkForUpdates = () => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        };

        window.addEventListener('online', checkForUpdates);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkForUpdates();
          }
        });
      } catch (err) {
        console.warn('[PWA] ServiceWorker registration skipped/failed:', err);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }
  }, []);

  return null;
}
