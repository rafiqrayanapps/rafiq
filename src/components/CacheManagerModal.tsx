'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  RefreshCw,
  Trash2,
  CheckCircle2,
  HardDrive,
  Wifi,
  WifiOff,
  ShieldCheck,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getStorageEstimate,
  getAllDraftsSummary,
  clearAllDrafts,
  clearServiceWorkerCaches,
  type StorageEstimateInfo,
  type DraftSummary
} from '@/lib/storage/auto-save';
import { useToast } from '@/hooks/use-toast';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CacheManagerModal({ isOpen, onClose }: CacheManagerModalProps) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo | null>(null);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isClearingDrafts, setIsClearingDrafts] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check online status and storage on open
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      refreshStats();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [isOpen]);

  const refreshStats = async () => {
    try {
      const est = await getStorageEstimate();
      setStorageInfo(est);
      const d = getAllDraftsSummary();
      setDrafts(d);
    } catch {}
  };

  const handleUpdateApp = async () => {
    setIsUpdating(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
      toast({
        title: "تم التحقق من التحديثات",
        description: "يتم تحميل أحدث نسخة من الموقع حالياً.",
      });
      setTimeout(() => {
        setIsUpdating(false);
        window.location.reload();
      }, 700);
    } catch {
      setIsUpdating(false);
      window.location.reload();
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await clearServiceWorkerCaches();
      await refreshStats();
      toast({
        title: "تم تفريغ كاش المتصفح",
        description: "تم مسح الملفات المؤقتة بنجاح وسيتم جلب أحدث نسخة من السيرفر.",
      });
      setTimeout(() => {
        setIsClearingCache(false);
        window.location.reload();
      }, 800);
    } catch {
      setIsClearingCache(false);
      toast({
        title: "تنبيه",
        description: "تعذر مسح بعض ملفات الكاش، يرجى إعادة تحميل الصفحة.",
        variant: "destructive",
      });
    }
  };

  const handleClearDrafts = () => {
    setIsClearingDrafts(true);
    const count = clearAllDrafts();
    refreshStats();
    setIsClearingDrafts(false);
    toast({
      title: "تم مسح المسودات",
      description: `تم حذف ${count} مسودة محفوظة محلياً بنجاح.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px] rounded-[2.5rem] p-0 overflow-hidden border-none bg-white shadow-2xl z-[100] max-h-[90vh] flex flex-col text-right">
        
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <HardDrive size={22} />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-gray-900">
                الذاكرة المؤقتة والحفظ التلقائي
              </DialogTitle>
              <p className="text-xs text-gray-500 font-medium">
                إدارة كاش المتصفح والمسودات المحلية
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Status Indicators Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Online/Offline Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">حالة الاتصال</span>
                {isOnline ? (
                  <Wifi size={16} className="text-green-500" />
                ) : (
                  <WifiOff size={16} className="text-red-500" />
                )}
              </div>
              <span className={`text-sm font-black ${isOnline ? 'text-green-600' : 'text-red-500'}`}>
                {isOnline ? 'متصل بالإنترنت' : 'وضع بدون اتصال'}
              </span>
            </div>

            {/* Local Storage Card */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500">تخزين البيانات</span>
                <Database size={16} className="text-primary" />
              </div>
              <span className="text-sm font-black text-gray-800">
                {storageInfo ? `${storageInfo.localStorageKB} كيلوبايت` : 'نشط'}
              </span>
            </div>
          </div>

          {/* Smart Cache Details */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-black text-xs">
              <ShieldCheck size={16} />
              <span>نظام التخزين الذكي النشط</span>
            </div>
            <ul className="text-[11px] text-gray-600 font-medium space-y-1 leading-relaxed list-disc list-inside">
              <li>كاش تصفح فائق السرعة للخطوط والأيقونات والتصميم.</li>
              <li>حفظ تلقائي فوري للمسودات لمنع فقدان البيانات.</li>
              <li>متوافق تماماً مع تطبيق الأندرويد وWebView وSketchware.</li>
              <li>لا يتم تخزين كلمات المرور أو البيانات الحساسة نهائياً.</li>
            </ul>
          </div>

          {/* Auto-Saved Drafts Section */}
          <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-800">
                المسودات المحفوظة محلياً ({drafts.length})
              </span>
              {drafts.length > 0 && (
                <button
                  onClick={handleClearDrafts}
                  disabled={isClearingDrafts}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} />
                  مسح المسودات
                </button>
              )}
            </div>
            {drafts.length === 0 ? (
              <p className="text-[11px] text-gray-400 font-medium">
                لا توجد مسودات غير مكتملة مخزنة حالياً.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto">
                {drafts.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded-xl text-[11px]"
                  >
                    <span className="font-bold text-gray-700 truncate max-w-[180px]">
                      {d.originalKey}
                    </span>
                    <span className="text-gray-400 font-mono text-[10px]">
                      {new Date(d.savedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleUpdateApp}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <RefreshCw size={15} className={isUpdating ? 'animate-spin' : ''} />
              {isUpdating ? 'جاري التحقق...' : 'تحديث التطبيق وجلب أحدث محتوى'}
            </button>

            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <Trash2 size={15} className={isClearingCache ? 'animate-spin' : ''} />
              {isClearingCache ? 'جاري مسح الكاش...' : 'مسح كاش المتصفح بالكامل'}
            </button>
          </div>

          {/* Android / Sketchware Note */}
          <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center">
            <Smartphone size={14} />
            <span>متوافق مع Android WebView وجميع المتصفحات الحديثة</span>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  );
}
