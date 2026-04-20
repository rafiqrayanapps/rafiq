'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Info, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { useApiKey } from './providers/ApiKeyProvider';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const { apiKey, setApiKey, hasKey } = useApiKey();
  const [tempKey, setTempKey] = useState(apiKey);
  const { toast } = useToast();

  const handleSave = () => {
    setApiKey(tempKey);
    toast({
      title: "تم الحفظ",
      description: "تم تحديث مفتاح API بنجاح لجميع الأدوات الذكية.",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="h-2 w-full bg-gradient-to-r from-primary via-indigo-500 to-purple-500" />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <Key size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-black text-gray-900 leading-tight">إعدادات الـ API</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">تفعيل الأدوات الذكية</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3 text-right">
                  <label className="text-sm font-black text-gray-700 mr-2 flex items-center gap-2 justify-end">
                    <span>مفتاح Gemini API</span>
                    <Key size={14} className="text-primary" />
                  </label>
                  <div className="relative group">
                    <input 
                      type="password"
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      placeholder="AI-XXXX-XXXX-XXXX"
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-mono focus:bg-white focus:border-primary/20 outline-none transition-all placeholder:text-gray-300 text-left"
                      dir="ltr"
                    />
                    {hasKey && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                        <Check size={18} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-6 space-y-4 border border-blue-100/50">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Info size={18} />
                    <span className="text-xs font-black">لماذا أحتاج لهذا المفتاح؟</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed font-medium text-right">
                    هذا التطبيق يستخدم تقنيات متطورة من Google Gemini. لتتمكن من استخدام &quot;توليد الصور&quot;، &quot;تحويل الصور لبرومبت&quot;، و &quot;توليد القصص&quot; بدون قيود، يجب عليك تزويد مفتاح API الخاص بك.
                  </p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-blue-200 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <span>الحصول على مفتاح مجاني</span>
                    <ExternalLink size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    حفظ الإعدادات
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm hover:bg-gray-100 active:scale-95 transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
