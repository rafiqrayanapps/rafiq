'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { usePWA } from '@/components/providers/PWAProvider';

export default function PWAInstallModal() {
  const { 
    isInstallModalOpen, 
    closeInstallModal, 
    promptInstall, 
    deferredPrompt, 
    isInIframe, 
    isIOS, 
    isStandalone 
  } = usePWA();

  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');

  if (!isInstallModalOpen) return null;

  const handleOpenNewWindow = () => {
    window.open(window.location.origin + '?utm_source=pwa_install', '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
        >
          {/* Header */}
          <div 
            className="p-6 text-white text-center relative overflow-hidden"
            style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #3B82F6, #2563EB))' }}
          >
            <button
              onClick={closeInstallModal}
              className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 mx-auto mb-3 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-lg">
              <Smartphone size={32} />
            </div>

            <h3 className="text-2xl font-black tracking-tight mb-1">تثبيت تطبيق رفيق</h3>
            <p className="text-xs text-white/80 font-medium">
              احصل على أداء أسرع، وصول بدون إنترنت، وتجربة سلسة على شاشتك الرئيسية
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

            {/* If in Iframe Warning */}
            {isInIframe && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0">
                    <ExternalLink size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      افتح التطبيق في نافذة جديدة للتثبيت
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                      تمنع المتصفحات إظهار زر التثبيت المباشر عند التصفح داخل المعاينة المؤطرة (iFrame). يُرجى الفتح في نافذة مستقلة ليظهر زر التثبيت فوراً.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenNewWindow}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <ExternalLink size={18} />
                  فتح في نافذة متصفح جديدة
                </button>
              </div>
            )}

            {/* Direct Native Prompt Button if available outside iframe */}
            {!isInIframe && deferredPrompt && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                  <Sparkles size={18} />
                  التثبيت بنقرة واحدة متوفر الآن!
                </div>
                <button
                  onClick={() => {
                    promptInstall();
                  }}
                  className="w-full py-3.5 px-6 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all active:scale-95"
                  style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #3B82F6, #2563EB))' }}
                >
                  <Download size={20} />
                  تثبيت التطبيق الآن
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  activeTab === 'android' 
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-md font-black' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                أندرويد / متصفح كروم
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2.5 rounded-xl transition-all ${
                  activeTab === 'ios' 
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-md font-black' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                آيفون / متصفح سفاري (iOS)
              </button>
            </div>

            {/* Tab Instructions */}
            {activeTab === 'android' ? (
              <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  خطوات التثبيت على أندرويد وكمبيوتر:
                </h5>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div className="text-xs leading-relaxed">
                      اضغط على قائمة المتصفح أعلى الشاشة <MoreVertical size={16} className="inline mx-1 text-gray-500" /> (النقاط الثلاث).
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div className="text-xs leading-relaxed">
                      اختر <span className="font-bold text-gray-900 dark:text-white">&quot;تثبيت التطبيق&quot;</span> (Install App) أو <span className="font-bold text-gray-900 dark:text-white">&quot;إضافة إلى الشاشة الرئيسية&quot;</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div className="text-xs leading-relaxed">
                      تأكيد التثبيت وسيم التثبيت كأيقونة تطبيق مستقلة على هاتفك.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm">
                <h5 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  خطوات التثبيت على آيفون (Safari):
                </h5>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      1
                    </span>
                    <div className="text-xs leading-relaxed flex items-center flex-wrap gap-1">
                      اضغط على زر المشاركة <Share size={16} className="text-blue-500 inline mx-0.5" /> أسفل شاشة Safari.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      2
                    </span>
                    <div className="text-xs leading-relaxed flex items-center flex-wrap gap-1">
                      مرر القائمة لأسفل واختر <PlusSquare size={16} className="text-blue-500 inline mx-0.5" /> <span className="font-bold text-gray-900 dark:text-white">&quot;إضافة إلى الشاشة الرئيسية&quot;</span>.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                      3
                    </span>
                    <div className="text-xs leading-relaxed">
                      اضغط على <span className="font-bold text-primary">&quot;إضافة&quot;</span> في الزاوية العلوية لإتمام التثبيت.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col gap-2">
              {isInIframe && (
                <button
                  onClick={handleOpenNewWindow}
                  className="w-full py-3 px-4 bg-primary text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #3B82F6, #2563EB))' }}
                >
                  <ExternalLink size={18} />
                  افتح التطبيق في نافذة مستقلة
                </button>
              )}
              
              <button
                onClick={closeInstallModal}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 font-bold text-xs rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
              >
                إغلاق
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
