'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { Home, Heart, Bell, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCollection, useDoc } from '@/hooks/useFirebase';
import AdBanner from '@/components/AdBanner';

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);
  const { data: notifications } = useCollection('notifications');
  const [readIds, setReadIds] = useState<string[]>([]);
  const { data: adsConfig } = useDoc('appConfig', 'ads');

  const showBottomAd = useMemo(() => {
    return pathname === '/home' && 
      !searchParams.get('tab') && 
      adsConfig?.showAds === true && 
      adsConfig?.showHomeAd === true && 
      !!adsConfig?.adScript;
  }, [pathname, searchParams, adsConfig]);

  useEffect(() => {
    // Check initial dark mode state
    setIsDark(document.documentElement.classList.contains('dark'));

    const syncReadIds = () => {
      const stored = localStorage.getItem('read_notifications');
      if (stored) {
        try {
          setReadIds(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing read notifications", e);
        }
      }
    };

    // Load initial status
    syncReadIds();

    // Listen for updates from other components
    window.addEventListener('notifications_updated', syncReadIds);
    return () => window.removeEventListener('notifications_updated', syncReadIds);
  }, []);

  const unreadCount = useMemo(() => {
    if (!notifications) return 0;
    // Count notifications that are NOT in the readIds list
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const isToolPage = [
    '/chat',
    '/image-generation',
    '/image-to-prompt',
    '/ai-story-generator',
    '/remove-bg'
  ].some(path => pathname.startsWith(path));

  if (pathname === '/' || isToolPage) {
    return null;
  }

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/home' },
    { icon: Heart, label: 'المفضلة', path: '/home?tab=favorites' },
    { icon: Bell, label: 'الإشعارات', path: '/home?tab=notifications' },
  ];

  return (
    <>
      <div className={cn(
        "fixed left-0 right-0 z-50 px-4 flex justify-center pointer-events-none transition-all duration-300",
        showBottomAd ? "bottom-[88px]" : "bottom-4"
      )}>
        <nav 
          className="relative flex items-stretch h-16 w-full max-w-md backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[2rem] pointer-events-auto px-2 transition-colors duration-500"
          style={{ backgroundColor: 'var(--bottom-nav, white)' }}
        >
          {navItems.map((item) => {
            const isActive = pathname === '/home' && (
              (item.path === '/home' && !searchParams.get('tab')) ||
              (item.path.includes('tab=') && searchParams.get('tab') === item.path.split('=')[1])
            );
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className="flex-1 flex flex-col items-center justify-center relative group"
              >
                <motion.div 
                  animate={item.icon === Bell && unreadCount > 0 ? {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={item.icon === Bell && unreadCount > 0 ? {
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2
                  } : {}}
                  className={cn(
                    "p-2 rounded-2xl transition-all duration-300 relative",
                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                  )}
                  style={isActive ? { color: 'var(--primary)' } : {}}
                >
                  <item.icon size={24} />
                  
                  {item.icon === Bell && unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[8px] font-black text-white items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </span>
                  )}
                </motion.div>
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-1 h-2 w-2 rounded-full shadow-sm" 
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                )}
              </Link>
            );
          })}
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="flex-1 flex flex-col items-center justify-center relative group"
            >
              <div className="p-2 rounded-2xl transition-all duration-300 text-gray-400 hover:text-gray-600">
                {isDark ? <Sun size={24} /> : <Moon size={24} />}
              </div>
            </button>
          </nav>
        </div>

        {showBottomAd && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-950/95 border-t border-gray-200/30 dark:border-zinc-800/30 flex justify-center items-center py-1.5 px-4 h-[76px] pointer-events-auto">
            <div className="w-full max-w-md">
              <AdBanner height="60px" className="my-0" />
            </div>
          </div>
        )}
      </>
  );
}

export default function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
