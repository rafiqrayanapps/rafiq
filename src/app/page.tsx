'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/hooks/useFirebase';
import Image from 'next/image';

type SplashState = 'loading' | 'welcoming';

export default function SplashPage() {
  const router = useRouter();
  const [splashState, setSplashState] = useState<SplashState>('loading');
  
  const { data: generalConfig } = useDoc('appConfig', 'general');
  const { data: aboutConfig } = useDoc('appConfig', 'about');

  const appName = generalConfig?.appName || aboutConfig?.appName || aboutConfig?.title || "رفيق المصمم";
  const appLogoUrl = generalConfig?.appLogo || aboutConfig?.appLogoImage || aboutConfig?.logoImage || "";
  const appSubtitle = generalConfig?.appSubtitle || aboutConfig?.subtitle || "شريكك الإبداعي في كل خطوة";

  const words = appName.trim().split(/\s+/);
  const topWord = words.length > 1 ? words[0] : '';
  const bottomWord = words.length > 1 ? words.slice(1).join(' ') : words[0];

  useEffect(() => {
    // Safety timer to force redirect if Next.js router hangs
    const safetyTimer = setTimeout(() => {
      window.location.href = '/home';
    }, 4000);

    const loadingTimer = setTimeout(() => {
      setSplashState('welcoming');
    }, 1200);

    const redirectTimer = setTimeout(() => {
      router.push('/home');
    }, 2400);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(redirectTimer);
      clearTimeout(safetyTimer);
    };
  }, [router]);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden p-6 bg-primary" style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #3B82F6, #2563EB))' }}>
        <div className="z-10 flex flex-col items-center justify-center gap-12 text-center">
            {/* Dynamic App Logo / Brand */}
            <div className="flex flex-col items-center justify-center text-white text-center w-full max-w-sm leading-tight">
              <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-forwards">
                {appLogoUrl ? (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-[2.5rem] p-4 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src={appLogoUrl}
                      alt={appName}
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  </div>
                ) : null}

                {topWord ? (
                  <h1 className="font-black text-6xl md:text-8xl tracking-tighter drop-shadow-2xl text-white uppercase">
                    {topWord}
                  </h1>
                ) : null}

                <div className="bg-white text-primary rounded-[2rem] px-10 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform -rotate-2">
                  <span className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--primary, #3B82F6)' }}>
                    {bottomWord}
                  </span>
                </div>

                {appSubtitle ? (
                  <p className="text-sm md:text-base font-bold text-white/80 mt-2 max-w-xs drop-shadow">
                    {appSubtitle}
                  </p>
                ) : null}
              </div>
            </div>
            
            {/* Loading & Welcome status */}
            <div className="h-12 flex items-center justify-center">
                {splashState === 'loading' ? (
                  <div className="flex gap-2.5 items-center">
                    <div className="h-3 w-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="h-3 w-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="h-3 w-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <h2 className="text-2xl md:text-3xl font-black text-white/95 tracking-tight">
                      مرحباً بكم 👋
                    </h2>
                  </div>
                )}
            </div>
        </div>
    </div>
  );
}

