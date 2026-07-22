'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceWorkerRegister() {
  const router = useRouter();

  useEffect(() => {
    // Register Service Worker for PWA support
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

    // Handle chunk load errors (e.g. after dev server rebuild or deployment update)
    const handleChunkError = (event: ErrorEvent) => {
      const errorMsg = event.message || event.error?.message || '';
      if (
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('Chunk load error detected, reloading page to fetch latest assets...');
        const hasReloaded = sessionStorage.getItem('chunk_reload_retry');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk_reload_retry', 'true');
          window.location.reload();
        }
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const errorMsg = reason?.message || String(reason || '');
      if (
        errorMsg.includes('ChunkLoadError') ||
        errorMsg.includes('Loading chunk') ||
        errorMsg.includes('Failed to fetch dynamically imported module') ||
        reason?.name === 'ChunkLoadError'
      ) {
        console.warn('Unhandled ChunkLoadError detected, reloading page...');
        const hasReloaded = sessionStorage.getItem('chunk_reload_retry');
        if (!hasReloaded) {
          sessionStorage.setItem('chunk_reload_retry', 'true');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Reset retry flag after 10 seconds of successful running
    const timer = setTimeout(() => {
      sessionStorage.removeItem('chunk_reload_retry');
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      clearTimeout(timer);
    };
  }, [router]);

  return null;
}
