'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { usePathname, useParams, useSearchParams } from 'next/navigation';
import { useDoc, useCollection } from '@/hooks/useFirebase';
import { X } from 'lucide-react';

function PopupAdContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const { data: adsConfig, loading } = useDoc('appConfig', 'ads');
  const { data: categories } = useCollection('categories');
  const [isOpen, setIsOpen] = useState(false);

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
    if (loading || !adsConfig || !adsConfig.showAds) return;

    const popup = adsConfig.popup;
    if (!popup || !popup.show || !popup.script) return;

    // Check placement
    let showOnPage = false;
    if (pageType === 'home' && popup.showOnHome) showOnPage = true;
    else if (pageType === 'lists' && popup.showOnLists) showOnPage = true;
    else if (pageType === 'content' && popup.showOnContent) showOnPage = true;

    if (!showOnPage) return;

    // Check category targeting
    if ((pageType === 'lists' || pageType === 'content') && popup.categoryMode === 'specific') {
      const targetIds: string[] = popup.targetCategories || [];
      if (targetIds.length > 0) {
        if (!categoryIdFromRoute) return;
        const currentCat = (categories || []).find((c: any) => c.id === categoryIdFromRoute);
        const match = targetIds.includes(categoryIdFromRoute) || (currentCat?.parentId && targetIds.includes(currentCat.parentId));
        if (!match) return; // Do not show if category does not match!
      }
    }

    // Check if user already dismissed popup in this session for this path
    const popupDismissed = sessionStorage.getItem(`popup_dismissed_${pathname}`);
    if (!popupDismissed) {
      setIsOpen(true);
    }

    // Inject popup script for direct script execution if needed
    const container = document.createElement('div');
    container.id = 'popup-ad-script-container';
    container.style.display = 'none';
    try {
      const range = document.createRange();
      range.selectNode(document.body);
      const frag = range.createContextualFragment(popup.script);
      container.appendChild(frag);
      document.body.appendChild(container);
    } catch (e) {
      console.error("Error executing popup ad script:", e);
    }

    return () => {
      document.getElementById('popup-ad-script-container')?.remove();
    };
  }, [adsConfig, loading, pageType, categoryIdFromRoute, categories, pathname]);

  if (!isOpen || !adsConfig?.popup?.script) return null;

  const handleClose = () => {
    sessionStorage.setItem(`popup_dismissed_${pathname}`, 'true');
    setIsOpen(false);
  };

  const srcDocHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; display: flex; justify-content: center; align-items: center; }
          #ad-container { width: 100%; display: flex; justify-content: center; align-items: center; }
          #ad-container iframe, #ad-container img { max-width: 100% !important; }
        </style>
      </head>
      <body>
        <div id="ad-container">
          ${adsConfig.popup.script}
        </div>
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center">
        <button 
          onClick={handleClose}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-muted/80 hover:bg-muted text-foreground flex items-center justify-center transition-colors shadow-sm z-10"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full text-center text-xs font-bold text-muted-foreground mb-3">
          إعلان
        </div>
        <div className="w-full min-h-[180px] flex items-center justify-center">
          <iframe
            srcDoc={srcDocHtml}
            title="Popup Advertisement"
            width="100%"
            height="280px"
            style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            className="w-full rounded-2xl"
          />
        </div>
        <button
          onClick={handleClose}
          className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          متابعة للتطبيق
        </button>
      </div>
    </div>
  );
}

export default function PopupAd() {
  return (
    <Suspense fallback={null}>
      <PopupAdContent />
    </Suspense>
  );
}
