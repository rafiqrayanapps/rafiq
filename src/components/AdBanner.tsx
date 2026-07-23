'use client';

import { Suspense, useMemo } from 'react';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import { useDoc, useCollection } from '@/hooks/useFirebase';

interface AdBannerProps {
  height?: string;
  className?: string;
  type?: 'banner' | 'inline';
  categoryId?: string;
}

function AdBannerContent({ height = '60px', className = '', type = 'banner', categoryId }: AdBannerProps) {
  const { data: adsConfig, loading } = useDoc('appConfig', 'ads');
  const { data: categories } = useCollection('categories');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();

  // Detect which page we are on
  const pageType = useMemo(() => {
    if (pathname === '/home' || pathname === '/' || (!searchParams.get('tab') && pathname === '/home')) return 'home';
    if (pathname?.startsWith('/categories')) return 'lists';
    if (pathname?.startsWith('/subcategory')) return 'content';
    return 'other';
  }, [pathname, searchParams]);

  // Detect category ID from prop, params, or route
  const currentCategoryId = useMemo(() => {
    if (categoryId) return categoryId;
    if (params?.id) return params.id as string;
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean);
      if ((parts[0] === 'categories' || parts[0] === 'subcategory') && parts[1]) {
        return parts[1];
      }
    }
    return null;
  }, [categoryId, params, pathname]);

  // Determine whether to display the ad based on type, page placement, and category targeting
  const adDisplay = useMemo(() => {
    if (loading || !adsConfig || !adsConfig.showAds) {
      return { shouldShow: false, script: '' };
    }

    if (type === 'banner') {
      const banner = adsConfig.banner;
      if (!banner) {
        const isEnabledOnPage = 
          (pageType === 'home' && (adsConfig.showHomeAd ?? true)) ||
          ((pageType === 'lists' || pageType === 'content') && (adsConfig.showContentAds ?? true));
        return { 
          shouldShow: isEnabledOnPage && !!adsConfig.adScript, 
          script: adsConfig.adScript || '' 
        };
      }

      if (!banner.show) return { shouldShow: false, script: '' };
      
      let showOnPage = false;
      if (pageType === 'home' && banner.showOnHome) showOnPage = true;
      else if (pageType === 'lists' && banner.showOnLists) showOnPage = true;
      else if (pageType === 'content' && banner.showOnContent) showOnPage = true;
      else if (pageType === 'other') showOnPage = true;

      if (!showOnPage) return { shouldShow: false, script: '' };

      // Category targeting check for banner
      if ((pageType === 'lists' || pageType === 'content') && banner.categoryMode === 'specific') {
        const targetIds: string[] = banner.targetCategories || [];
        if (targetIds.length > 0) {
          if (!currentCategoryId) return { shouldShow: false, script: '' };
          const currentCat = (categories || []).find((c: any) => c.id === currentCategoryId);
          const match = targetIds.includes(currentCategoryId) || (currentCat?.parentId && targetIds.includes(currentCat.parentId));
          if (!match) return { shouldShow: false, script: '' };
        }
      }

      return { 
        shouldShow: !!(banner.script || adsConfig.adScript), 
        script: banner.script || adsConfig.adScript || '' 
      };
    } else {
      // Inline Ads
      const inline = adsConfig.inline;
      if (!inline) {
        const isEnabledOnPage = (pageType === 'lists' || pageType === 'content') && (adsConfig.showContentAds ?? true);
        return { 
          shouldShow: isEnabledOnPage && !!adsConfig.adScript, 
          script: adsConfig.adScript || '' 
        };
      }

      if (!inline.show) return { shouldShow: false, script: '' };

      let showOnPage = false;
      if (pageType === 'home' && inline.showOnHome) showOnPage = true;
      else if (pageType === 'lists' && inline.showOnLists) showOnPage = true;
      else if (pageType === 'content' && inline.showOnContent) showOnPage = true;

      if (!showOnPage) return { shouldShow: false, script: '' };

      // Category targeting check for inline
      if ((pageType === 'lists' || pageType === 'content') && inline.categoryMode === 'specific') {
        const targetIds: string[] = inline.targetCategories || [];
        if (targetIds.length > 0) {
          if (!currentCategoryId) return { shouldShow: false, script: '' };
          const currentCat = (categories || []).find((c: any) => c.id === currentCategoryId);
          const match = targetIds.includes(currentCategoryId) || (currentCat?.parentId && targetIds.includes(currentCat.parentId));
          if (!match) return { shouldShow: false, script: '' };
        }
      }

      return { 
        shouldShow: !!(inline.script || adsConfig.adScript), 
        script: inline.script || adsConfig.adScript || '' 
      };
    }
  }, [adsConfig, loading, type, pageType, currentCategoryId, categories]);

  if (!adDisplay.shouldShow || !adDisplay.script) {
    return null;
  }

  const srcDocHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; }
          #ad-container { width: 100%; display: flex; justify-content: center; align-items: center; min-height: 50px; }
          #ad-container iframe, #ad-container img { max-width: 100% !important; }
        </style>
      </head>
      <body>
        <div id="ad-container">
          ${adDisplay.script}
        </div>
      </body>
    </html>
  `;

  return (
    <div className={`w-full flex justify-center items-center my-0.5 animate-in fade-in duration-500 ${className}`}>
      <iframe
        srcDoc={srcDocHtml}
        title="Advertisement"
        width="100%"
        height={height}
        style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full max-w-full transition-all duration-300"
      />
    </div>
  );
}

export default function AdBanner(props: AdBannerProps) {
  return (
    <Suspense fallback={null}>
      <AdBannerContent {...props} />
    </Suspense>
  );
}
