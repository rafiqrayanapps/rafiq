'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceWorkerRegister() {
  const router = useRouter();

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        } catch (err) {
          console.log('ServiceWorker registration failed: ', err);
        }
      };

      registerSW();
    }

    // Handle online/offline events
    const handleOnline = () => {
      console.log('Network connection restored. Refreshing...');
      // Use window.location.reload() for a hard refresh to ensure everything is updated
      // or router.refresh() for a Next.js soft refresh.
      // User asked for "automatically updates/refreshes", window.location.reload() is more robust for connection recovery.
      window.location.reload();
    };

    const handleOffline = () => {
      console.log('Network connection lost.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  return null;
}
