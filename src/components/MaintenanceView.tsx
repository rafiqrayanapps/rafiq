'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  RotateCw, 
  Clock, 
  MessageCircle, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  LogIn,
  AlertTriangle,
  RefreshCw,
  Rocket
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/hooks/useFirebase';

interface MaintenanceViewProps {
  title?: string;
  message?: string;
  estimatedTime?: string;
  showSocialLinks?: boolean;
  isFullPage?: boolean;
}

export default function MaintenanceView({ 
  title, 
  message, 
  estimatedTime,
  showSocialLinks,
  isFullPage = true
}: MaintenanceViewProps) {
  const router = useRouter();
  const { data: maintenanceConfig } = useDoc('appConfig', 'maintenance');
  const { data: aboutConfig } = useDoc('appConfig', 'about');
  const { data: socialConfig } = useDoc('appConfig', 'social');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Resolved config values with fallback defaults
  const displayTitle = title || maintenanceConfig?.title || "الموقع قيد الصيانة والتحديث";
  const displayMessage = message || maintenanceConfig?.message || "نعمل حالياً على إجراء تحديثات وتطويرات مهمة لنقدم لكم أفضل تجربة تصميم وأداء. يرجى العودة لاحقاً.";
  const displayEstimatedTime = estimatedTime !== undefined ? estimatedTime : maintenanceConfig?.estimatedTime;
  const displayShowSocial = showSocialLinks !== undefined ? showSocialLinks : (maintenanceConfig?.showSocialLinks !== false);

  const whatsappNum = maintenanceConfig?.whatsappNumber || aboutConfig?.whatsappNumber || aboutConfig?.phoneNumber || '01029892573';
  const telegramLink = maintenanceConfig?.telegramUsername || socialConfig?.telegram || 'https://t.me/rayanapp';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const nextClicks = logoClicks + 1;
    if (nextClicks >= 7) {
      setLogoClicks(0);
      router.push('/login');
    } else {
      setLogoClicks(nextClicks);
      clickTimeoutRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 3000);
    }
  };

  const content = (
    <div className="relative w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center text-center z-10 dir-rtl">
      {/* Background ambient lighting powered by site primary theme color */}
      <div 
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full blur-[100px] pointer-events-none opacity-30 dark:opacity-25 transition-all duration-700"
        style={{ background: 'var(--primary)' }}
      />
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[120px] pointer-events-none opacity-20 transition-all duration-700"
        style={{ background: 'var(--primary)' }}
      />

      {/* Brand Logo - Rafeeq Al Musammim with Secret 7-clicks Admin Login Trigger */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={handleLogoClick}
        className="relative cursor-pointer select-none group mb-8 transition-all duration-300 hover:scale-105 active:scale-95"
        title="رفيق المصمم (اضغط 7 مرات لتسجيل دخول المشرفين)"
      >
        <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-card/80 dark:bg-card/50 border border-primary/20 backdrop-blur-xl shadow-xl shadow-primary/10 hover:border-primary/40 transition-all">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-md shrink-0"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Rocket size={22} className="animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-2xl sm:text-3xl font-black">
            <span className="text-foreground tracking-tight">رفيق</span>
            <span 
              className="px-3.5 py-1 rounded-xl text-white font-black text-xl sm:text-2xl shadow-md"
              style={{ background: 'var(--primary-gradient)' }}
            >
              المصمم
            </span>
          </div>
        </div>

        {/* Visual tap feedback indicator when getting close to 7 clicks */}
        {logoClicks > 1 && logoClicks < 7 && (
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-black shadow-lg z-20 pointer-events-none whitespace-nowrap flex items-center gap-1"
          >
            <Sparkles size={12} />
            <span>متبقي {7 - logoClicks} ضغطات للوصول للوحة التحكم</span>
          </motion.div>
        )}
      </motion.div>

      {/* Top Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-md mb-8 text-primary shadow-sm"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="text-xs sm:text-sm font-black tracking-wide">
          جاري أعمال الصيانة والتطوير
        </span>
        <Sparkles size={14} className="animate-pulse" />
      </motion.div>

      {/* Hero Animated Icon Badge */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="relative mb-8 group"
      >
        {/* Glowing outer ring */}
        <div 
          className="absolute -inset-3 rounded-[3rem] opacity-40 blur-xl group-hover:opacity-60 transition duration-500"
          style={{ background: 'var(--primary-gradient)' }}
        />

        {/* Main card icon container */}
        <div 
          className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 overflow-hidden border border-white/20"
          style={{ background: 'var(--primary-gradient)' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
          
          {/* Animated Main Wrench */}
          <motion.div
            animate={{ 
              rotate: [0, 15, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Wrench size={58} className="drop-shadow-lg text-primary-foreground" />
          </motion.div>

          {/* Decorative spinning background ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none"
          >
            <div className="w-28 h-28 border-2 border-dashed border-white rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Info */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4 mb-8"
      >
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-snug">
          {displayTitle}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed font-medium">
          {displayMessage}
        </p>
      </motion.div>

      {/* Estimated Time Badge (if provided) */}
      {displayEstimatedTime && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full max-w-md mb-8 p-4 rounded-2xl border border-primary/20 bg-card/80 dark:bg-card/50 backdrop-blur-md shadow-sm flex items-center justify-between gap-3 text-right"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">الوقت المتوقع للانتهاء</p>
              <p className="text-sm font-black text-foreground">{displayEstimatedTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>قيد العمل</span>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-10"
      >
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-full sm:flex-1 h-13 px-6 rounded-2xl font-black text-sm text-primary-foreground flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-75"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          <span>{isRefreshing ? 'جاري الفحص...' : 'إعادة محاولة الاتصال'}</span>
        </button>

        {displayShowSocial && (
          <a
            href={telegramLink.startsWith('http') ? telegramLink : `https://t.me/${telegramLink.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 h-13 px-6 rounded-2xl font-bold text-sm bg-card hover:bg-accent border border-border text-foreground flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <Send size={18} className="text-sky-500" />
            <span>قناة التحديثات (تلجرام)</span>
          </a>
        )}
      </motion.div>

      {/* Support / Contact details */}
      {displayShowSocial && whatsappNum && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground font-medium mb-8"
        >
          <span>تواصل مباشر مع الدعم الفني:</span>
          <a 
            href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            <MessageCircle size={15} />
            <span>واتساب ({whatsappNum})</span>
          </a>
        </motion.div>
      )}

      {/* Footer Branding */}
      <div className="pt-6 border-t border-border/40 w-full max-w-md flex items-center justify-center text-[11px] text-muted-foreground font-medium text-center">
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-primary" />
          <span>رفيق المصمم - جميع الحقوق محفوظة</span>
        </div>
      </div>
    </div>
  );

  if (!isFullPage) {
    return content;
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center relative overflow-hidden select-none">
      {content}
    </div>
  );
}
