'use client';

import { Suspense, useEffect } from 'react';
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { CategoryProvider } from "@/components/providers/CategoryProvider";
import { ApiKeyProvider } from "@/components/providers/ApiKeyProvider";
import { ToolProvider } from "@/components/providers/ToolProvider";
import { Toaster } from "@/components/ui/toaster";
import ThemeApplier from "@/components/ThemeApplier";
import GlobalDialog from "@/components/GlobalDialog";
import FloatingButton from "@/components/FloatingButton";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/layout/BottomNav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu only for inputs and textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
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

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);

  return (
    <FirebaseClientProvider>
      <ApiKeyProvider>
        <ToolProvider>
          <CategoryProvider>
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
      </ApiKeyProvider>
    </FirebaseClientProvider>
  );
}
