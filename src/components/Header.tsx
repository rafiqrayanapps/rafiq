'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Menu, Search, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import AdBanner from '@/components/AdBanner';
import { useDoc } from '@/hooks/useFirebase';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  extraContent?: React.ReactNode;
  compact?: boolean;
  showAd?: boolean;
}

export default function Header({ title = "رفيق المصمم", showBackButton, onBackClick, onMenuClick, extraContent, compact, showAd }: HeaderProps) {
  const router = useRouter();
  const [logoClicks, setLogoClicks] = useState(0);

  const { data: generalConfig } = useDoc('appConfig', 'general');
  const { data: aboutConfig } = useDoc('appConfig', 'about');

  const configuredAppName = generalConfig?.appName || aboutConfig?.appName || aboutConfig?.title || "رفيق المصمم";

  // Determine top header brand word and badge text
  const isDefaultOrAppName = title === "رفيق المصمم" || title === configuredAppName;
  const targetText = isDefaultOrAppName ? configuredAppName : title;

  const words = configuredAppName.trim().split(/\s+/);
  const brandTopWord = words.length > 1 ? words[0] : '';
  const brandBottomPill = words.length > 1 ? words.slice(1).join(' ') : words[0];

  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    if (nextClicks >= 7) {
      setLogoClicks(0);
      router.push('/login');
    } else {
      setLogoClicks(nextClicks);
    }
  };

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <header 
          className={cn(
            "w-full text-white rounded-b-[2.2rem] overflow-hidden shadow-lg transition-all duration-300",
            compact ? "pt-3 pb-5" : "pt-4 pb-8"
          )}
          style={{ background: 'var(--primary-gradient)' }}
        >
          <div className="container max-w-6xl mx-auto px-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBackButton ? (
                  <button 
                    onClick={handleBack}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                    title="رجوع"
                  >
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </button>
                ) : onMenuClick ? (
                  <button 
                    onClick={onMenuClick}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                    title="القائمة"
                  >
                    <Menu size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            </div>

            <div 
              onClick={handleLogoClick}
              className={cn(
                "flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-4 duration-700 cursor-pointer select-none",
                compact ? "mt-0" : "mt-2"
              )}
            >
              <div className={cn(
                "font-bold flex flex-col items-center gap-1 leading-tight transition-all",
                compact ? "text-2xl" : "text-4xl"
              )}>
                {isDefaultOrAppName ? (
                  !compact && brandTopWord && (
                    <div className="flex items-center gap-2">
                      <span className="text-white tracking-tighter text-4xl font-black uppercase drop-shadow-2xl">{brandTopWord}</span>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn(
                      "text-white font-black tracking-tight drop-shadow-lg opacity-95",
                      compact ? "text-lg" : "text-2xl sm:text-3xl"
                    )}>
                      {configuredAppName}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "bg-white rounded-2xl shadow-xl transform transition-all flex items-center justify-center max-w-[90vw]",
                  compact ? "px-4 py-1 -rotate-0" : "px-5 py-1 -rotate-1"
                )}>
                  <span className={cn(
                    "font-black tracking-tight truncate",
                    compact ? "text-base" : "text-xl"
                  )} style={{ color: 'var(--primary)' }}>
                    {isDefaultOrAppName ? brandBottomPill : title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        {extraContent}
        {showAd && (
          <div className="w-full max-w-2xl mx-auto px-6">
            <AdBanner height="60px" className="my-1" />
          </div>
        )}
      </div>
      {/* Spacer to push content down since header is fixed */}
      <div className={
        showAd 
          ? (extraContent ? "h-[270px]" : compact ? "h-[170px]" : "h-[230px]")
          : (extraContent ? "h-[200px]" : compact ? "h-[100px]" : "h-[160px]")
      } />
    </>
  );
}
