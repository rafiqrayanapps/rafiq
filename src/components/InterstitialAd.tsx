'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDoc } from '@/hooks/useFirebase';

export default function InterstitialAd() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: adsConfig } = useDoc('appConfig', 'ads');

  const pageType = useMemo(() => {
    if (pathname === '/home' && !searchParams.get('tab')) return 'home';
    if (pathname?.startsWith('/categories')) return 'lists';
    if (pathname?.startsWith('/subcategory')) return 'content';
    return 'other';
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!adsConfig || !adsConfig.showAds) return;

    // Check if interstitial ads are enabled
    const interstitial = adsConfig.interstitial;
    if (!interstitial || !interstitial.show || !interstitial.script) return;

    // Check placement
    let shouldShow = false;
    if (pageType === 'home' && interstitial.showOnHome) shouldShow = true;
    else if (pageType === 'lists' && interstitial.showOnLists) shouldShow = true;
    else if (pageType === 'content' && interstitial.showOnContent) shouldShow = true;

    if (!shouldShow) return;

    // Inject the script into the document head/body
    const container = document.createElement('div');
    container.id = 'interstitial-ad-container';
    container.style.display = 'none';
    
    try {
      const range = document.createRange();
      range.selectNode(document.body);
      const documentFragment = range.createContextualFragment(interstitial.script);
      container.appendChild(documentFragment);
      document.body.appendChild(container);
    } catch (e) {
      console.error("Error loading interstitial ad:", e);
    }

    return () => {
      const existing = document.getElementById('interstitial-ad-container');
      if (existing) {
        existing.remove();
      }
    };
  }, [pageType, adsConfig]);

  return null;
}
