'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { useDoc } from '@/hooks/useFirebase';
import PlatformButton from './PlatformButton';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { data: aboutConfig } = useDoc('appConfig', 'about');

  // Config values with fallbacks
  const appName = aboutConfig?.appName || aboutConfig?.title || 'رفيق المصمم';
  const subtitle = aboutConfig?.subtitle || 'شريكك الإبداعي في كل خطوة';
  const developerName = aboutConfig?.developerName || 'YOSSEF / تطوير';
  const phoneNumber = aboutConfig?.phoneNumber || '01029892573';
  const versionStatus = aboutConfig?.versionStatus || 'إصدار مكتمل ومستقر';
  
  // WhatsApp settings (showWhatsapp defaults to true if not explicitly false)
  const showWhatsapp = aboutConfig?.showWhatsapp !== false;
  const whatsappNumber = aboutConfig?.whatsappNumber || phoneNumber || '01029892573';
  const whatsappText = aboutConfig?.whatsappText || `تواصل عبر واتساب مباشر (${whatsappNumber})`;
  
  const ratingStars = typeof aboutConfig?.rating === 'number' ? aboutConfig.rating : 5;
  
  // Link 1 (Primary Button)
  const webLink = aboutConfig?.webLink || '';
  const webLinkText = aboutConfig?.webLinkText || 'زيارة الموقع الإلكتروني';
  const webLinkPlatform = aboutConfig?.webLinkPlatform || 'auto';

  // Link 2 (Secondary / Additional Button)
  const secondaryLink = aboutConfig?.secondaryLink || '';
  const secondaryLinkText = aboutConfig?.secondaryLinkText || 'رابط إضافي / القناة';
  const secondaryLinkPlatform = aboutConfig?.secondaryLinkPlatform || 'auto';

  const logoImage = aboutConfig?.logoImage || '';

  const handleOpenWhatsapp = () => {
    if (!whatsappNumber) return;
    const cleanedNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const formatted = cleanedNumber.startsWith('0') ? `2${cleanedNumber}` : cleanedNumber;
    const url = `https://wa.me/${formatted}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[40px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800 text-center z-10 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors z-20"
              aria-label="إغلاق"
            >
              <X size={18} strokeWidth={2.5} />
            </button>

            {/* Header Icon / Logo - Dynamic Primary Gradient */}
            <div className="flex justify-center mt-2 mb-3">
              <div 
                className="w-20 h-20 rounded-[24px] flex items-center justify-center shadow-lg transition-all"
                style={{
                  background: 'var(--primary-gradient)',
                  boxShadow: '0 10px 25px -5px color-mix(in srgb, var(--primary) 40%, transparent)'
                }}
              >
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="w-12 h-12 object-contain rounded-xl" />
                ) : (
                  /* "رفيق المصمم" Brand Logo Badge */
                  <div className="flex flex-col items-center justify-center gap-0.5 select-none">
                    <span className="text-white text-xs font-black tracking-widest uppercase drop-shadow-sm">
                      رفيق
                    </span>
                    <div className="bg-white rounded-md px-2 py-0.5 shadow-sm">
                      <span className="font-black text-[11px] tracking-tight block leading-none" style={{ color: 'var(--primary)' }}>
                        المصمم
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Star Rating */}
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-full text-amber-400 mb-3">
              {Array.from({ length: ratingStars }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" className="text-amber-400" />
              ))}
            </div>

            {/* App Title */}
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
              {appName}
            </h2>

            {/* Subtitle - Dynamic color */}
            <p className="text-xs md:text-sm font-bold mt-1 mb-5" style={{ color: 'var(--primary)' }}>
              {subtitle}
            </p>

            {/* Info Table / Card Box - Dynamic Primary Background Tint */}
            <div 
              className="rounded-2xl p-4 space-y-3 mb-6 text-right transition-colors"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--primary) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)'
              }}
            >
              {/* Row 1: Developer */}
              <div 
                className="flex items-center justify-between gap-2 pb-2.5"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}
              >
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  تطوير وتصميم:
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 dir-ltr">
                  {developerName}
                </span>
              </div>

              {/* Row 2: Phone */}
              <div 
                className="flex items-center justify-between gap-2 pb-2.5"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}
              >
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  رقم الهاتف:
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-gray-100 font-mono">
                  {phoneNumber}
                </span>
              </div>

              {/* Row 3: Update Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  حالة التحديث:
                </span>
                <span 
                  className="text-[11px] font-black px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                    color: 'var(--primary)'
                  }}
                >
                  {versionStatus}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary External Link Button */}
              {webLink && (
                <PlatformButton
                  url={webLink}
                  text={webLinkText}
                  platform={webLinkPlatform}
                />
              )}

              {/* Secondary / Additional Button */}
              {secondaryLink && (
                <PlatformButton
                  url={secondaryLink}
                  text={secondaryLinkText}
                  platform={secondaryLinkPlatform}
                />
              )}

              {/* WhatsApp Button (Toggleable) */}
              {showWhatsapp && whatsappNumber && (
                <PlatformButton
                  url={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                  text={whatsappText}
                  platform="whatsapp"
                  onClick={handleOpenWhatsapp}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
