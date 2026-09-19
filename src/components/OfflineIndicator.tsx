'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50 flex items-center justify-between gap-3 bg-amber-600/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-amber-400/30 text-xs sm:text-sm font-semibold"
        dir="rtl"
      >
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <WifiOff size={16} />
          </span>
          <span>أنت الآن في وضع عدم الاتصال — يتم عرض الموارد المخزنة مؤقتاً</span>
        </div>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
