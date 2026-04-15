'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Menu, Search } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  extraContent?: React.ReactNode;
}

export default function Header({ title = "رفيق المصمم", showBackButton, onBackClick, onMenuClick, extraContent }: HeaderProps) {
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
          className="w-full text-primary-foreground pt-4 pb-12 rounded-b-[2.5rem] overflow-hidden shadow-lg"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <div className="container max-w-6xl mx-auto px-6 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {onMenuClick ? (
                  <button 
                    onClick={onMenuClick}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                  >
                    <Menu size={20} strokeWidth={2.5} />
                  </button>
                ) : showBackButton ? (
                  <button 
                    onClick={handleBack}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
                  >
                    <ArrowLeft size={20} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {/* Reserved for future right-side buttons if needed */}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="font-bold text-4xl flex flex-col items-center gap-1 leading-tight">
                <span className="text-white tracking-tighter text-5xl font-black uppercase drop-shadow-2xl mb-1">رفيق</span>
                <div className="bg-white px-6 py-1.5 rounded-2xl shadow-xl transform -rotate-1">
                  <span className="text-xl font-black text-primary tracking-tight">
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
      <div className={extraContent ? "h-[290px]" : "h-[210px]"} />
    </>
  );
}
