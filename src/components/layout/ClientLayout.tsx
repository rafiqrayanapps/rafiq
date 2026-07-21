'use client';

import { Suspense, useEffect } from 'react';
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CategoryProvider } from "@/components/providers/CategoryProvider";
import { ToolProvider } from "@/components/providers/ToolProvider";
import { Toaster } from "@/components/ui/toaster";
import ThemeApplier from "@/components/ThemeApplier";
import GlobalDialog from "@/components/GlobalDialog";
import FloatingButton from "@/components/FloatingButton";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/layout/BottomNav";
import InterstitialAd from "@/components/InterstitialAd";
import { useDoc } from '@/hooks/useFirebase';

function SecurityApplier() {
  const { data: securityConfig } = useDoc('appConfig', 'security');

  useEffect(() => {
    const preventCopy = securityConfig?.preventCopy ?? true;
    const preventContextMenu = securityConfig?.preventContextMenu ?? true;

    const handleContextMenu = (e: MouseEvent) => {
      if (!preventContextMenu) return;
      // Allow context menu only for inputs and textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!preventCopy) return;
      // Allow copy only if triggered by custom events (buttons) or in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      // If it's a standard copy event without our custom flag, block it
      // @ts-ignore
      if (!window.__allowCopy) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    if (preventCopy) {
      // Remove any existing copy style to prevent duplicates
      document.getElementById('prevent-copy-style')?.remove();

      const styleEl = document.createElement('style');
      styleEl.id = 'prevent-copy-style';
      styleEl.innerHTML = `
        body {
          user-select: none !important;
          -webkit-user-select: none !important;
        }
        input, textarea, [contenteditable="true"] {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
      `;
      document.head.appendChild(styleEl);
    } else {
      document.getElementById('prevent-copy-style')?.remove();
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.getElementById('prevent-copy-style')?.remove();
    };
  }, [securityConfig]);

  return null;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <ToolProvider>
        <CategoryProvider>
            <SecurityApplier />
            <InterstitialAd />
            <ServiceWorkerRegister />
            <ThemeApplier />
            <GlobalDialog />
            <FloatingButton />
            <div className="relative min-h-screen flex flex-col">
                <main className="flex-1">
                    {children}
                </main>
                <Suspense fallback={null}>
                  <BottomNav />
                </Suspense>
            </div>
            <Toaster />
          </CategoryProvider>
        </ToolProvider>
    </FirebaseClientProvider>
  );
}
