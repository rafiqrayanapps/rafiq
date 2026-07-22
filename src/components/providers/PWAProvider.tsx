'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PWAContextType {
  deferredPrompt: any;
  isStandalone: boolean;
  isInIframe: boolean;
  isIOS: boolean;
  isInstallModalOpen: boolean;
  openInstallModal: () => void;
  closeInstallModal: () => void;
  promptInstall: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  deferredPrompt: null,
  isStandalone: false,
  isInIframe: false,
  isIOS: false,
  isInstallModalOpen: false,
  openInstallModal: () => {},
  closeInstallModal: () => {},
  promptInstall: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if in iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);

    // Check if installed/standalone
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    // Check iOS
    const userAgent = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      console.log('pwa: beforeinstallprompt event captured');
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('pwa: App was successfully installed');
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = () => setIsInstallModalOpen(true);
  const closeInstallModal = () => setIsInstallModalOpen(false);

  const promptInstall = async () => {
    if (isInIframe) {
      // In iframe, direct prompt won't work, so open modal to guide opening in new window
      setIsInstallModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA install prompt');
          setDeferredPrompt(null);
        } else {
          console.log('User dismissed the PWA install prompt');
        }
      } catch (err) {
        console.error('Error triggering PWA install prompt:', err);
        setIsInstallModalOpen(true);
      }
    } else {
      // If no prompt available (e.g. iOS or already installed or prompt consumed), show step modal
      setIsInstallModalOpen(true);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        deferredPrompt,
        isStandalone,
        isInIframe,
        isIOS,
        isInstallModalOpen,
        openInstallModal,
        closeInstallModal,
        promptInstall,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
