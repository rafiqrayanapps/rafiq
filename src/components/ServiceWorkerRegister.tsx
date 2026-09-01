'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          if (registration.installing) {
            console.log('PWA ServiceWorker installing');
          } else if (registration.active) {
            console.log('PWA ServiceWorker active');
          }
        } catch (err) {
          // Gracefully log without breaking the app
          console.warn('PWA ServiceWorker registration skipped/failed:', err);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }
  }, []);

  return null;
}
