'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Star, Eye, EyeOff } from 'lucide-react';
import { useDoc } from '@/hooks/useFirebase';
import PlatformButton from '@/components/PlatformButton';

export default function AboutPage() {
  const { data: aboutData, loading } = useDoc('appConfig', 'about');
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
      </div>
    );
  }

  // Config values with fallbacks
  const appName = aboutData?.appName || aboutData?.title || 'رفيق المصمم';
  const subtitle = aboutData?.subtitle || 'شريكك الإبداعي في كل خطوة';
  const developerName = aboutData?.developerName || 'YOSSEF / تطوير';
  const phoneNumber = aboutData?.phoneNumber || '01029892573';
  const hidePhoneNumber = aboutData?.hidePhoneNumber === true;
  const versionStatus = aboutData?.versionStatus || 'إصدار مكتمل ومستقر';

  const formatMaskedPhone = (num: string) => {
    if (!num) return '••••••••••';
    if (num.length > 6) {
      return `${num.slice(0, 4)}••••${num.slice(-3)}`;
    }
    return '••••••••••';
  };
  
  // WhatsApp settings (showWhatsapp defaults to true if not explicitly false)
  const showWhatsapp = aboutData?.showWhatsapp !== false;
  const whatsappNumber = aboutData?.whatsappNumber || phoneNumber || '01029892573';
  const whatsappText = aboutData?.whatsappText || `تواصل عبر واتساب مباشر (${whatsappNumber})`;
  
  const ratingStars = typeof aboutData?.rating === 'number' ? aboutData.rating : 5;
  
  // Link 1 (Primary Button)
  const webLink = aboutData?.webLink || '';
  const webLinkText = aboutData?.webLinkText || 'زيارة الموقع الإلكتروني';
  const webLinkPlatform = aboutData?.webLinkPlatform || 'auto';

  // Link 2 (Secondary / Additional Button)
  const secondaryLink = aboutData?.secondaryLink || '';
  const secondaryLinkText = aboutData?.secondaryLinkText || 'رابط إضافي / القناة';
  const secondaryLinkPlatform = aboutData?.secondaryLinkPlatform || 'auto';

  const logoImage = aboutData?.logoImage || '';
  const description = aboutData?.description;
  const vision = aboutData?.vision;

  const handleOpenWhatsapp = () => {
    if (!whatsappNumber) return;
    const cleanedNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const formatted = cleanedNumber.startsWith('0') ? `2${cleanedNumber}` : cleanedNumber;
    const url = `https://wa.me/${formatted}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-gray-950 flex flex-col">
      <Header title="عن التطبيق" showBackButton compact />

      <main className="flex-1 px-4 py-8 max-w-xl mx-auto w-full flex flex-col items-center justify-center space-y-8">
        {/* Main Card replicating exact screenshot layout with dynamic site primary color */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full bg-white dark:bg-gray-900 rounded-[40px] p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800 text-center overflow-hidden"
        >
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

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
            {appName}
          </h1>

          {/* Subtitle - Dynamic primary color */}
          <p className="text-xs md:text-sm font-bold mt-1 mb-6" style={{ color: 'var(--primary)' }}>
            {subtitle}
          </p>

          {/* Data Table / Box - Dynamic Primary Background Tint */}
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
            {(!hidePhoneNumber || isPhoneVisible) && (
              <div 
                className="flex items-center justify-between gap-2 pb-2.5"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--primary) 15%, transparent)' }}
              >
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  رقم الهاتف:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneVisible(!isPhoneVisible)}
                    className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center justify-center"
                    title={isPhoneVisible ? 'إخفاء الرقم' : 'إظهار الرقم'}
                    aria-label={isPhoneVisible ? 'إخفاء الرقم' : 'إظهار الرقم'}
                  >
                    {isPhoneVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <span 
                    onClick={() => setIsPhoneVisible(!isPhoneVisible)}
                    className="text-xs font-black text-gray-900 dark:text-gray-100 font-mono cursor-pointer select-none hover:opacity-80 transition-opacity"
                  >
                    {isPhoneVisible ? phoneNumber : formatMaskedPhone(phoneNumber)}
                  </span>
                </div>
              </div>
            )}

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

        {/* Optional Extra Description / Vision if defined */}
        {(description || vision) && (
          <div className="w-full bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-4 text-right">
            {description && (
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1">عن التطبيق</h3>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
            {vision && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1">رؤيتنا</h3>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {vision}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
