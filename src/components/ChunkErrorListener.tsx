'use client';

import { useEffect } from 'react';

export default function ChunkErrorListener() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        (event.reason.name === 'ChunkLoadError' ||
          (typeof event.reason.message === 'string' && event.reason.message.includes('Loading chunk')))
      ) {
        console.warn('ChunkLoadError detected, reloading window...');
        const reloadKey = 'last_chunk_error_reload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        // Avoid infinite reload loop: reload only if not reloaded in last 10 seconds
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
        }
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (
        event.error &&
        (event.error.name === 'ChunkLoadError' ||
          (typeof event.message === 'string' && event.message.includes('Loading chunk')))
      ) {
        console.warn('Chunk error detected, reloading window...');
        const reloadKey = 'last_chunk_error_reload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString());
          window.location.reload();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
