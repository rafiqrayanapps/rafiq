'use client';

import { useEffect } from 'react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ThemeApplier() {
  const firestore = useFirestore();
  const themeRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'theme'), [firestore]);
  const { data: theme } = useDoc(themeRef);

  useEffect(() => {
    if (theme) {
      const mode = theme.themeMode || 'light';
      const isDarkFirestore = mode === 'dark';
      const isHighContrast = mode === 'high-contrast';
      
      // Apply theme mode class from Firestore (initial sync)
      document.documentElement.classList.remove('dark', 'high-contrast');
      if (isDarkFirestore) document.documentElement.classList.add('dark');
      if (isHighContrast) document.documentElement.classList.add('high-contrast');

      const updateColors = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const primaryColor = isDark ? (theme.darkPrimaryColor || theme.primaryColor || '#3B82F6') : (theme.primaryColor || '#3B82F6');
        
        document.documentElement.style.setProperty('--primary', primaryColor);
        document.documentElement.style.setProperty('--accent', primaryColor);
        document.documentElement.style.setProperty('--ring', primaryColor);

        // Apply gradient if enabled
        if (theme.useGradient) {
          const start = isDark ? (theme.darkGradientStart || theme.gradientStart || primaryColor) : (theme.gradientStart || primaryColor);
          const end = isDark ? (theme.darkGradientEnd || theme.gradientEnd || primaryColor) : (theme.gradientEnd || primaryColor);
          document.documentElement.style.setProperty('--primary-gradient', `linear-gradient(135deg, ${start}, ${end})`);
        } else {
          document.documentElement.style.setProperty('--primary-gradient', primaryColor);
        }

        // Apply background and card colors if they exist in theme
        if (theme.backgroundColor) {
          document.documentElement.style.setProperty('--background', isDark ? (theme.darkBackgroundColor || '#020617') : theme.backgroundColor);
        }
        if (theme.cardColor) {
          document.documentElement.style.setProperty('--card', isDark ? (theme.darkCardColor || '#020617') : theme.cardColor);
        }
        if (theme.bottomNavColor || theme.darkBottomNavColor) {
          document.documentElement.style.setProperty('--bottom-nav', isDark ? (theme.darkBottomNavColor || '#020617') : (theme.bottomNavColor || '#ffffff'));
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
      if (theme.customCss) {
        const styleEl = document.createElement('style');
        styleEl.id = 'custom-theme-css';
        styleEl.innerHTML = theme.customCss;
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
  }, [theme]);

  return null;
}
