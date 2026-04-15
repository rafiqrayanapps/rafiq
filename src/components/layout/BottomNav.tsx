'use client';

import { Home, Heart, Bell, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  if (pathname === '/') {
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
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
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
              <div 
                className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                )}
                style={isActive ? { color: 'var(--primary)' } : {}}
              >
                <item.icon size={24} />
              </div>
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
  );
}
