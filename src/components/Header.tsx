'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Menu, Search, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  extraContent?: React.ReactNode;
  compact?: boolean;
}

export default function Header({ title = "رفيق المصمم", showBackButton, onBackClick, onMenuClick, extraContent, compact }: HeaderProps) {
  const router = useRouter();

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
                {onMenuClick ? (
                  <button 
                    onClick={onMenuClick}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                  >
                    <Menu size={18} strokeWidth={2.5} />
                  </button>
                ) : showBackButton ? (
                  <button 
                    onClick={handleBack}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                  >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={cn(
              "flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-4 duration-700",
              compact ? "mt-0" : "mt-2"
            )}>
              <div className={cn(
                "font-bold flex flex-col items-center gap-1 leading-tight transition-all",
                compact ? "text-2xl" : "text-4xl"
              )}>
                {!compact && (
                  <div className="flex items-center gap-2">
                    <span className="text-white tracking-tighter text-4xl font-black uppercase drop-shadow-2xl">رفيق</span>
                  </div>
                )}
                <div className={cn(
                  "bg-white rounded-2xl shadow-xl transform transition-all flex items-center justify-center",
                  compact ? "px-4 py-1 -rotate-0" : "px-5 py-1 -rotate-1"
                )}>
                  <span className={cn(
                    "font-black tracking-tight",
                    compact ? "text-base" : "text-xl"
                  )} style={{ color: 'var(--primary)' }}>
                    {title === "رفيق المصمم" ? "المصمم" : title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        {extraContent}
      </div>
      {/* Spacer to push content down since header is fixed */}
      <div className={extraContent ? "h-[240px]" : compact ? "h-[120px]" : "h-[180px]"} />
    </>
  );
}
