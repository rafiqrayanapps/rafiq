'use client';

import { useState, useRef } from 'react';
import { Upload, Scissors, RefreshCw, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function BgRemovalTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeBg = async (imgUrl: string) => {
    setStatus('processing');
    setProgress(0);
    setProgressStage('تحميل المحرك...');
    
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      
      const config: any = {
        progress: (key: string, current: number, total: number) => {
          const p = Math.round((current / total) * 100);
          setProgress(p);
          
          if (key.includes('fetch')) setProgressStage('جاري تحميل الموديل (مرة واحدة)...');
          else if (key.includes('compute')) setProgressStage('جاري معالجة الصورة...');
          else setProgressStage('جاري العمل...');
        },
        model: 'small',
        publicPath: 'https://staticimgly.com/packages/@imgly/background-removal/1.7.0/assets/', 
      };

      const blob = await removeBackground(imgUrl, config);
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
      setStatus('done');
      
      toast({
        title: 'تمت المعالجة!',
        description: 'تمت إزالة الخلفية بنجاح.',
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      setStatus('error');
      toast({
        title: 'خطأ في المعالجة',
        description: 'حدث خطأ أثناء إزالة الخلفية، يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'ملف كبير جداً',
          description: 'يرجى اختيار صورة أصغر من 10 ميجابايت.',
          variant: 'destructive'
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setOriginalImage(url);
        setProcessedImage(null);
        removeBg(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadResult = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'removed_bg.png';
      link.click();
    }
  };

  return (
    <div className="space-y-6 pt-4 text-right">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-[2rem] flex items-start gap-3">
        <ImageIcon className="text-blue-500 shrink-0 mt-0.5" size={18} />
        <div className="flex flex-col">
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">معالجة محلية</span>
           <p className="text-[9px] text-blue-800 leading-relaxed font-bold">تتم المعالجة بالكامل داخل متصفحك. المرة الأولى قد تتطلب ثوانٍ إضافية لتحميل المحرك الذكي.</p>
        </div>
      </div>

      <div 
        onClick={() => status !== 'processing' && fileInputRef.current?.click()}
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all group relative overflow-hidden",
          status === 'processing' ? "cursor-wait border-primary/40" : "cursor-pointer border-primary/20 hover:bg-primary/5 hover:border-primary/40"
        )}
      >
        {processedImage ? (
          <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-gray-100">
               <Image 
                src={processedImage} 
                alt="Processed" 
                fill 
                className="object-contain" 
                unoptimized
              />
            </div>
            <div className="absolute inset-x-0 bottom-6 flex justify-center">
               <button 
                 onClick={(e) => { e.stopPropagation(); downloadResult(); }}
                 className="bg-white text-primary px-6 py-2 rounded-full shadow-lg font-black text-[10px] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
               >
                 <Download size={14} /> تحميل النتيجة (PNG)
               </button>
            </div>
          </div>
        ) : originalImage ? (
           <>
            <Image 
              src={originalImage} 
              alt="Uploaded" 
              fill 
              className={cn("absolute inset-0 object-cover transition-all", status === 'processing' ? "opacity-20 blur-sm" : "opacity-40")} 
              unoptimized
            />
            <div className="relative z-10 flex flex-col items-center">
              {status === 'processing' ? (
                <>
                  <RefreshCw className="mb-2 text-primary animate-spin" />
                  <span className="text-[10px] font-black text-primary uppercase">{progressStage} ({progress}%)</span>
                </>
              ) : (
                <>
                  <Scissors className="mb-2 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-primary uppercase">تغيير الصورة</span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="text-primary h-6 w-6" />
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">رفع صورة لإزالة الخلفية</span>
            <span className="text-[8px] text-muted-foreground mt-1">PNG, JPG حتى 10 ميجابايت</span>
          </>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
          disabled={status === 'processing'}
        />
      </div>

      <AnimatePresence>
        {status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl"
          >
            <AlertCircle size={16} />
            <p className="text-[10px] font-bold">فشلت العملية، يرجى المحاولة مع صورة أخرى.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {processedImage && (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 hover:bg-gray-50 transition-colors uppercase tracking-widest"
        >
          جرب صورة أخرى
        </button>
      )}
    </div>
  );
}
