'use client';

import { useEffect } from 'react';

export default function ChunkErrorListener() {
  useEffect(() => {
    const isChunkError = (err: any) => {
      if (!err) return false;
      const msg = typeof err === 'string' ? err : err.message || '';
      const name = err.name || '';
      return (
        name === 'ChunkLoadError' ||
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch dynamically imported module') ||
        (msg.includes('timeout:') && msg.includes('/_next/static/chunks/'))
      );
    };

    const triggerReload = () => {
      const reloadKey = 'last_chunk_error_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Avoid infinite reload loops: reload only if not reloaded in last 6 seconds
      if (!lastReload || now - parseInt(lastReload, 10) > 6000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkError(event.reason)) {
        console.warn('ChunkLoadError detected in rejection, reloading window...');
        triggerReload();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkError(event.error) || isChunkError(event.message)) {
        console.warn('ChunkLoadError detected in error event, reloading window...');
        triggerReload();
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
