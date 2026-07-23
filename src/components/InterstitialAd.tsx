'use client';

import { useEffect, useMemo, Suspense } from 'react';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import { useDoc, useCollection } from '@/hooks/useFirebase';

function InterstitialAdContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { data: adsConfig } = useDoc('appConfig', 'ads');
  const { data: categories } = useCollection('categories');

  const pageType = useMemo(() => {
    if (pathname === '/home' || pathname === '/' || (!searchParams.get('tab') && pathname === '/home')) return 'home';
    if (pathname?.startsWith('/categories')) return 'lists';
    if (pathname?.startsWith('/subcategory')) return 'content';
    return 'other';
  }, [pathname, searchParams]);

  const categoryIdFromRoute = useMemo(() => {
    if (params?.id) return params.id as string;
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean);
      if ((parts[0] === 'categories' || parts[0] === 'subcategory') && parts[1]) {
        return parts[1];
      }
    }
    return null;
  }, [params, pathname]);

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

    // Check category targeting
    if ((pageType === 'lists' || pageType === 'content') && interstitial.categoryMode === 'specific') {
      const targetIds: string[] = interstitial.targetCategories || [];
      if (targetIds.length > 0) {
        if (!categoryIdFromRoute) return;
        const currentCat = (categories || []).find((c: any) => c.id === categoryIdFromRoute);
        const match = targetIds.includes(categoryIdFromRoute) || (currentCat?.parentId && targetIds.includes(currentCat.parentId));
        if (!match) return; // Skip if category does not match!
      }
    }

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
  }, [pageType, adsConfig, categoryIdFromRoute, categories]);

  return null;
}

export default function InterstitialAd() {
  return (
    <Suspense fallback={null}>
      <InterstitialAdContent />
    </Suspense>
  );
}
