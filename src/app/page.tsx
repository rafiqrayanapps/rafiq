'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type SplashState = 'loading' | 'welcoming';

const AppLogo = () => {
   return (
       <div className="flex flex-col items-center justify-center text-white text-center w-full max-w-xs leading-tight">
            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 fill-mode-forwards">
               <h1 className="font-black text-7xl md:text-8xl tracking-tighter drop-shadow-2xl">رفيق</h1>
               <div className="bg-white text-primary rounded-[2rem] px-12 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform -rotate-2">
                   <span className="text-3xl md:text-4xl font-black tracking-tight">المصمم</span>
               </div>
           </div>
       </div>
   )
};

const WelcomeLoader = () => (
   <div className="flex gap-2">
       <div className="h-2.5 w-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
       <div className="h-2.5 w-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
       <div className="h-2.5 w-2.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
   </div>
);

const WelcomeMessage = () => {
   return (
       <div className="animate-fade-in-up">
           <h2 className="text-3xl font-black text-white/90 tracking-tight">مرحباً بكم</h2>
       </div>
   )
};

export default function SplashPage() {
  const router = useRouter();
  const [splashState, setSplashState] = useState<SplashState>('loading');
  
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
    }, 2200);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(redirectTimer);
      clearTimeout(safetyTimer);
    };
  }, [router]);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden p-6 bg-primary" style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #3B82F6, #2563EB))' }}>
        <div className="z-10 flex flex-col items-center justify-center gap-20">
            <AppLogo />
            
            <div className="h-12 flex items-center justify-center">
                {splashState === 'loading' ? <WelcomeLoader /> : <WelcomeMessage />}
            </div>
        </div>
    </div>
  );
}
