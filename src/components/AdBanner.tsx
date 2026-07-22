'use client';

import { Suspense, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDoc } from '@/hooks/useFirebase';

interface AdBannerProps {
  height?: string;
  className?: string;
  type?: 'banner' | 'inline';
}

function AdBannerContent({ height = '60px', className = '', type = 'banner' }: AdBannerProps) {
  const { data: adsConfig, loading } = useDoc('appConfig', 'ads');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Detect which page we are on
  const pageType = useMemo(() => {
    if (pathname === '/home' && !searchParams.get('tab')) return 'home';
    if (pathname?.startsWith('/categories')) return 'lists';
    if (pathname?.startsWith('/subcategory')) return 'content';
    return 'other';
  }, [pathname, searchParams]);

  // Determine whether to display the ad based on type and page placement settings
  const adDisplay = useMemo(() => {
    if (loading || !adsConfig || !adsConfig.showAds) {
      return { shouldShow: false, script: '' };
    }

    if (type === 'banner') {
      const banner = adsConfig.banner;
      // If new nested schema doesn't exist, fallback to legacy fields
      if (!banner) {
        const isEnabledOnPage = 
          (pageType === 'home' && (adsConfig.showHomeAd ?? true)) ||
          ((pageType === 'lists' || pageType === 'content') && (adsConfig.showContentAds ?? true));
        return { 
          shouldShow: isEnabledOnPage && !!adsConfig.adScript, 
          script: adsConfig.adScript || '' 
        };
      }

      // Check new nested schema
      if (!banner.show) return { shouldShow: false, script: '' };
      
      let showOnPage = false;
      if (pageType === 'home' && banner.showOnHome) showOnPage = true;
      else if (pageType === 'lists' && banner.showOnLists) showOnPage = true;
      else if (pageType === 'content' && banner.showOnContent) showOnPage = true;
      else if (pageType === 'other') showOnPage = true; // allow on other pages by default if banner is on

      return { 
        shouldShow: showOnPage && !!(banner.script || adsConfig.adScript), 
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
      
      return { 
        shouldShow: showOnPage && !!(inline.script || adsConfig.adScript), 
        script: inline.script || adsConfig.adScript || '' 
      };
    }
  }, [adsConfig, loading, type, pageType]);

  if (!adDisplay.shouldShow || !adDisplay.script) {
    return null;
  }

  // We wrap the ad script inside an isolated iframe's srcDoc.
  const srcDocHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            box-sizing: border-box;
          }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #ad-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50px;
          }
          #ad-container iframe, #ad-container img {
            max-width: 100% !important;
          }
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
