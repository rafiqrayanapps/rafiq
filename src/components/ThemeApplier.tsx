'use client';

import { useEffect, useState } from 'react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ThemeApplier() {
  const firestore = useFirestore();
  const themeRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'theme'), [firestore]);
  const { data: theme } = useDoc(themeRef);
  const [activeTheme, setActiveTheme] = useState<any>(null);

  // 1. Initial load from localStorage (Offline Fallback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached-app-theme');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setActiveTheme(parsed);
        } catch (e) {
          console.error("Error parsing cached theme", e);
        }
      }
    }
  }, []);

  // 2. Save fetched Firestore theme to localStorage and set it as active
  useEffect(() => {
    if (theme) {
      localStorage.setItem('cached-app-theme', JSON.stringify(theme));
      setActiveTheme(theme);
    }
  }, [theme]);

  // 3. Apply active theme settings
  useEffect(() => {
    if (activeTheme) {
      const mode = activeTheme.themeMode || 'light';
      const isDarkFirestore = mode === 'dark';
      const isHighContrast = mode === 'high-contrast';
      
      // Apply theme mode class from Firestore (initial sync)
      document.documentElement.classList.remove('dark', 'high-contrast');
      if (isDarkFirestore) document.documentElement.classList.add('dark');
      if (isHighContrast) document.documentElement.classList.add('high-contrast');

      const updateColors = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const primaryColor = isDark ? (activeTheme.darkPrimaryColor || activeTheme.primaryColor || '#3B82F6') : (activeTheme.primaryColor || '#3B82F6');
        
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--main-color', primaryColor);
        document.documentElement.style.setProperty('--accent', primaryColor);
        document.documentElement.style.setProperty('--ring', primaryColor);

        // Dynamically update browser's theme-color meta tag
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', primaryColor);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = primaryColor;
          document.head.appendChild(meta);
        }

        // Apply gradient if enabled
        if (activeTheme.useGradient) {
          const start = isDark ? (activeTheme.darkGradientStart || activeTheme.gradientStart || primaryColor) : (activeTheme.gradientStart || primaryColor);
          const end = isDark ? (activeTheme.darkGradientEnd || activeTheme.gradientEnd || primaryColor) : (activeTheme.gradientEnd || primaryColor);
          document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${start}, ${end})`);
        } else {
          document.documentElement.style.setProperty('--primary-gradient', primaryColor);
        }

        // Apply background and card colors if they exist in theme
        if (activeTheme.backgroundColor) {
          document.documentElement.style.setProperty('--background', isDark ? (activeTheme.darkBackgroundColor || '#020617') : activeTheme.backgroundColor);
        }
        if (activeTheme.cardColor) {
          document.documentElement.style.setProperty('--card', isDark ? (activeTheme.darkCardColor || '#020617') : activeTheme.cardColor);
        }
        if (activeTheme.bottomNavColor || activeTheme.darkBottomNavColor) {
          document.documentElement.style.setProperty('--bottom-nav', isDark ? (activeTheme.darkBottomNavColor || '#020617') : (activeTheme.bottomNavColor || '#ffffff'));
        }

        // Simple brightness check to set foreground
        try {
          let r = 0, g = 0, b = 0;
          
          if (primaryColor.startsWith('#')) {
            const hex = primaryColor.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
          } else if (primaryColor.startsWith('rgb')) {
            const match = primaryColor.match(/\d+/g);
            if (match) {
              r = parseInt(match[0]);
              g = parseInt(match[1]);
              b = parseInt(match[2]);
            }
          }
          
          document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
          
          const brightness = (r * 299 + g * 587 + b * 114) / 1000;
          const foreground = brightness > 180 ? '#020617' : '#ffffff';
          document.documentElement.style.setProperty('--primary-foreground', foreground);
        } catch (e) {
          document.documentElement.style.setProperty('--primary-foreground', '#ffffff');
        }
      };

      // Initial color application
      updateColors();

      // Apply custom CSS if it exists
      const existingCustomStyle = document.getElementById('custom-theme-css');
      if (existingCustomStyle) {
        existingCustomStyle.remove();
      }
      if (activeTheme.customCss) {
        const styleEl = document.createElement('style');
        styleEl.id = 'custom-theme-css';
        styleEl.innerHTML = activeTheme.customCss;
        document.head.appendChild(styleEl);
      }

      // Observe class changes on html to update colors when dark mode is toggled
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            updateColors();
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
  }, [activeTheme]);

  return null;
}
