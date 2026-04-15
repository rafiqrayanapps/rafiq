import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Settings, X } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
}

export default function MaintenanceModal({ isOpen, onClose, categoryName }: MaintenanceModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="maintenance-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="maintenance-modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden bg-card rounded-[2.5rem] shadow-2xl border border-border"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center text-primary/20"
                >
                  <Settings size={120} />
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center text-primary/40"
                  style={{ transformOrigin: "center" }}
                >
                  <Settings size={80} />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: [-10, 20, -10],
                    y: [0, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center text-primary"
                >
                  <Hammer size={48} className="drop-shadow-lg" />
                </motion.div>
              </div>

              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-foreground mb-2"
              >
                جاري التحديث
              </motion.h3>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm leading-relaxed"
              >
                نعمل حالياً على تطوير وتحديث قسم <br/>
                <span className="font-bold text-primary text-base inline-block mt-1">&quot;{categoryName}&quot;</span>
                <br/>
                لتقديم تجربة أفضل. يرجى العودة لاحقاً!
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
