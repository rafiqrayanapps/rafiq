'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FirebaseErrorListener = () => {
  const { toast } = useToast();
  const [errorDialog, setErrorDialog] = useState<{title: string, message: string, type: 'quota' | 'permission'} | null>(null);

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      const msg = error?.error || '';
      const isQuota = msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('exhausted');

      if (isQuota) {
        setErrorDialog({
          title: "نفدت النقاط اليومية ⏳",
          message: "لقد نفدت النقاط الخاصة بك لهذا اليوم. يرجى المحاولة مجدداً لاحقاً. 😊",
          type: 'quota'
        });
      } else {
        setErrorDialog({
          title: "خطأ في الصلاحيات",
          message: `ليس لديك صلاحية للقيام بهذه العملية: ${error.path}`,
          type: 'permission'
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, []);

  return (
    <AnimatePresence>
      {errorDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className={cn(
                "h-2 w-full bg-gradient-to-r",
                errorDialog.type === 'quota' ? "from-yellow-400 via-orange-500 to-red-500" : "from-red-500 to-red-700"
            )} />
            
            <div className="p-8 text-center space-y-6">
              <div className={cn(
                  "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner",
                  errorDialog.type === 'quota' ? "bg-orange-50 text-orange-500" : "bg-red-50 text-red-500"
              )}>
                {errorDialog.type === 'quota' ? <AlertCircle className="h-10 w-10" /> : <ShieldAlert className="h-10 w-10" />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900">{errorDialog.title}</h3>
                <p className="text-sm text-gray-500 font-bold leading-relaxed px-2">
                  {errorDialog.message}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setErrorDialog(null)}
                  className={cn(
                      "w-full py-4 px-6 rounded-2xl text-white font-black text-sm shadow-xl transition-all active:scale-95",
                      errorDialog.type === 'quota' ? "bg-orange-500 shadow-orange-500/20" : "bg-red-600 shadow-red-600/20"
                  )}
                >
                  حسناً، فهمت
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
