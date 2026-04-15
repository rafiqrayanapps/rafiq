'use client';

import { useState, useEffect } from 'react';
import { useDoc } from '@/hooks/useFirebase';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

export default function GlobalDialog() {
  const { data: config } = useDoc('appConfig', 'dialog');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (config?.isActive) {
      const lastShown = localStorage.getItem('last_dialog_shown');
      const frequency = config.frequency || 24; // hours
      const now = Date.now();

      if (!lastShown || now - parseInt(lastShown) > frequency * 60 * 60 * 1000) {
        setIsOpen(true);
      }
    }
  }, [config]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('last_dialog_shown', Date.now().toString());
  };

  const handleAction = () => {
    if (config?.actionUrl) {
      window.open(config.actionUrl, '_blank');
    }
    handleClose();
  };

  if (!config || !config.isActive) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="global-dialog-wrapper"
          className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            key="global-dialog-content"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-[#0f172a] rounded-[3rem] p-8 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden border border-white/10 dark:border-white/5"
          >
            {/* Background Decorative Elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-30" />

            <button 
              onClick={handleClose}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all z-10 bg-gray-100 dark:bg-white/5 p-2 rounded-full active:scale-90"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 flex flex-col items-center text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="relative mb-8"
              >
                <div className="w-24 h-24 bg-primary/10 text-primary rounded-[2.5rem] flex items-center justify-center shadow-inner relative z-10">
                  <Bell size={44} className="fill-primary/20" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/20 rounded-[2.5rem] -z-10"
                />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-black mb-3 text-gray-900 dark:text-white tracking-tight leading-tight">
                  {config.title || 'تنبيه جديد'}
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-gray-500 dark:text-gray-400 text-base mb-10 leading-relaxed font-medium px-4">
                  {config.message || 'هناك تحديث جديد متاح للتطبيق، يرجى التحقق منه الآن.'}
                </p>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col w-full gap-4"
              >
                <button 
                  onClick={handleAction}
                  className="w-full py-5 rounded-[1.8rem] font-black text-white shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  {config.actionText || 'اشتراك الآن'}
                </button>
                
                <button 
                  onClick={handleClose}
                  className="w-full py-4 text-gray-400 dark:text-gray-500 font-black hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm uppercase tracking-widest"
                >
                  {config.cancelText || 'إلغاء'}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
