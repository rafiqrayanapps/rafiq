'use client';

import { useState, useEffect } from 'react';
import { useDoc } from '@/hooks/useFirebase';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingButton() {
  const { data: config } = useDoc('appConfig', 'floatingButton');
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (config?.isActive) {
      const firstVisit = localStorage.getItem('fb_first_visit');
      const duration = config.duration || 30; // days
      const now = Date.now();

      if (!firstVisit) {
        localStorage.setItem('fb_first_visit', now.toString());
        setIsVisible(true);
      } else {
        if (now - parseInt(firstVisit) < duration * 24 * 60 * 60 * 1000) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    } else {
      setIsVisible(false);
    }
  }, [config]);

  if (!isVisible || !config) return null;

  return (
    <>
      <div className="fixed bottom-32 right-6 z-50">
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 text-primary-foreground rounded-full shadow-2xl flex items-center justify-center relative group"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <MessageCircle size={28} />
          <span className="absolute right-full mr-4 bg-black/80 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {config.label || 'طلب تصميم'}
          </span>
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div
            key="floating-button-modal-wrapper"
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              key="floating-button-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              key="floating-button-modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-primary-foreground relative" style={{ background: 'var(--primary-gradient)' }}>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 left-6 p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-2xl font-black mb-2">{config.label || 'طلب تصميم'}</h3>
                <p className="text-sm opacity-80">تواصل معنا الآن للحصول على تصاميم احترافية</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed text-center">
                    يمكنك التواصل مع المطور مباشرة أو طلب تصميم مخصص عبر الرابط التالي:
                  </p>
                </div>
                
                <a 
                  href={config.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  <Send size={20} />
                  <span>تواصل الآن</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
