'use client';

import { Wrench, ArrowRight, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MaintenanceViewProps {
  title?: string;
  message?: string;
}

export default function MaintenanceView({ 
  title = "هذا القسم تحت الصيانة", 
  message = "نعمل حالياً على تحسين وتطوير هذا القسم لنقدم لكم أفضل تجربة ممكنة. يرجى العودة لاحقاً." 
}: MaintenanceViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/20 relative overflow-hidden"
        style={{ background: 'var(--primary-gradient)' }}
      >
        <div className="absolute inset-0 bg-white/10 animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="relative z-10"
        >
          <Wrench size={56} className="drop-shadow-lg" />
        </motion.div>
        
        {/* Decorative gears or particles */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute -top-4 -right-4 opacity-20"
        >
          <Wrench size={32} />
        </motion.div>
      </motion.div>
      
      <div className="space-y-2 mb-10">
        <h2 className="text-4xl font-black text-foreground tracking-tight">{title}</h2>
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>

      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed mb-12 text-lg font-medium">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
        <Button 
          onClick={() => router.push('/home')}
          className="rounded-2xl h-14 font-bold text-lg gap-2 shadow-xl shadow-primary/20 flex-1"
        >
          <Home size={20} />
          الرئيسية
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.back()}
          className="rounded-2xl h-14 font-bold text-lg gap-2 border-2 flex-1"
        >
          <ArrowRight size={20} />
          رجوع
        </Button>
      </div>
      
      <div className="mt-12 p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">شكراً لصبركم معنا</p>
      </div>
    </div>
  );
}
