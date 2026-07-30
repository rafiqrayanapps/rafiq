'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface FontConfig {
  fontType?: 'preset' | 'custom_file' | 'custom_url' | 'default';
  presetFont?: string;
  customFontName?: string;
  customFontDataUrl?: string;
  customFontUrl?: string;
  fontFormat?: string; // 'truetype', 'opentype', 'woff', 'woff2'
  updatedAt?: string;
}

export default function FontApplier() {
  const firestore = useFirestore();
  const fontRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'font'), [firestore]);
  const { data: fontData } = useDoc(fontRef);
  const [activeFont, setActiveFont] = useState<FontConfig | null>(null);

  // 1. Initial load from localStorage (Instant offline / zero-FUT load)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('cached-app-font');
      if (cached) {
        try {
          setActiveFont(JSON.parse(cached));
        } catch (e) {
          console.error('Error parsing cached font config', e);
        }
      }
    }
  }, []);

  // 2. Save fetched Firestore font config to localStorage and state
  useEffect(() => {
    if (fontData) {
      try {
        localStorage.setItem('cached-app-font', JSON.stringify(fontData));
      } catch (e) {
        console.warn('LocalStorage full, font settings applied without local caching', e);
      }
      setActiveFont(fontData as FontConfig);
    }
  }, [fontData]);

  // 3. Apply active font dynamically to document
  const applyFont = useCallback((fontConfig: FontConfig | null) => {
    if (typeof window === 'undefined') return;

    // Clean up previous dynamic style tag & google font link
    const existingStyle = document.getElementById('custom-app-font-style');
    if (existingStyle) existingStyle.remove();

    const existingLink = document.getElementById('custom-app-font-link');
    if (existingLink) existingLink.remove();

    if (!fontConfig || !fontConfig.fontType || fontConfig.fontType === 'default') {
      // Revert to default Cairo & Tajawal font variables
      document.documentElement.style.removeProperty('--app-custom-font');
      return;
    }

    const { fontType, presetFont, customFontName, customFontDataUrl, customFontUrl, fontFormat } = fontConfig;

    if (fontType === 'custom_file' && customFontDataUrl) {
      const fontName = customFontName || 'AppUploadedFont';
      const format = fontFormat || 'truetype';

      const styleEl = document.createElement('style');
      styleEl.id = 'custom-app-font-style';
      styleEl.innerHTML = `
        @font-face {
          font-family: '${fontName}';
          src: url('${customFontDataUrl}') format('${format}');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }
        :root, html, body {
          --font-arabic: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
          --font-body: '${fontName}', 'Tajawal', sans-serif !important;
          --font-sans: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
        }
        html, body, body *, button, input, select, textarea, p, h1, h2, h3, h4, h5, h6, span, a, label, div, li, ul, ol, article, section, main, blockquote, figure, figcaption, mark, small, strong, b, em, td, th, dt, dd {
          font-family: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
        }
      `;
      document.head.appendChild(styleEl);
    } else if (fontType === 'preset' && presetFont) {
      const googleFontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(presetFont)}:wght@300;400;500;600;700;800;900&display=swap`;
      
      const linkEl = document.createElement('link');
      linkEl.id = 'custom-app-font-link';
      linkEl.rel = 'stylesheet';
      linkEl.href = googleFontUrl;
      document.head.appendChild(linkEl);

      const styleEl = document.createElement('style');
      styleEl.id = 'custom-app-font-style';
      styleEl.innerHTML = `
        :root, html, body {
          --font-arabic: '${presetFont}', 'Cairo', 'Tajawal', sans-serif !important;
          --font-body: '${presetFont}', 'Tajawal', sans-serif !important;
          --font-sans: '${presetFont}', 'Cairo', 'Tajawal', sans-serif !important;
        }
        html, body, body *, button, input, select, textarea, p, h1, h2, h3, h4, h5, h6, span, a, label, div, li, ul, ol, article, section, main, blockquote, figure, figcaption, mark, small, strong, b, em, td, th, dt, dd {
          font-family: '${presetFont}', 'Cairo', 'Tajawal', sans-serif !important;
        }
      `;
      document.head.appendChild(styleEl);
    } else if (fontType === 'custom_url' && customFontUrl) {
      const fontName = customFontName || 'ExternalCustomFont';

      if (customFontUrl.includes('fonts.googleapis.com') || customFontUrl.endsWith('.css')) {
        const linkEl = document.createElement('link');
        linkEl.id = 'custom-app-font-link';
        linkEl.rel = 'stylesheet';
        linkEl.href = customFontUrl;
        document.head.appendChild(linkEl);
      }

      const styleEl = document.createElement('style');
      styleEl.id = 'custom-app-font-style';
      styleEl.innerHTML = `
        @font-face {
          font-family: '${fontName}';
          src: url('${customFontUrl}');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }
        :root, html, body {
          --font-arabic: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
          --font-body: '${fontName}', 'Tajawal', sans-serif !important;
          --font-sans: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
        }
        html, body, body *, button, input, select, textarea, p, h1, h2, h3, h4, h5, h6, span, a, label, div, li, ul, ol, article, section, main, blockquote, figure, figcaption, mark, small, strong, b, em, td, th, dt, dd {
          font-family: '${fontName}', 'Cairo', 'Tajawal', sans-serif !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
  }, []);

  useEffect(() => {
    applyFont(activeFont);
  }, [activeFont, applyFont]);

  return null;
}
