'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Scissors, RefreshCw, Download, Image as ImageIcon, AlertCircle, ChevronRight, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default function BackgroundRemovalPage() {
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
    setProgressStage('تحميل المحرك الذكي...');
    
    try {
      // Use the library we already have
      const { removeBackground } = await import('@imgly/background-removal');
      
      const config: any = {
        progress: (key: string, current: number, total: number) => {
          const p = Math.round((current / total) * 100);
          setProgress(p);
          
          if (key.includes('fetch')) setProgressStage('جاري تحميل ملفات الموديل (مرة واحدة)...');
          else if (key.includes('compute')) setProgressStage('جاري فصل الخلفية...');
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
        title: 'رائع!',
        description: 'تمت إزالة الخلفية بنجاح واحترافية.',
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      setStatus('error');
      toast({
        title: 'خطأ تقني',
        description: 'لم نتمكن من معالجة هذه الصورة، يرجى المحاولة مع ملف آخر.',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'حجم ملف كبير',
          description: 'الحد الأقصى هو 10 ميجابايت.',
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
      link.download = `rafiq_removed_bg_${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/home" className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
            <Home size={20} />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-gray-900 leading-tight">إزالة الخلفية</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ذكاء اصطناعي محلي ومجاني</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Scissors size={20} />
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-2xl mx-auto w-full">
        {/* Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-500/20"
        >
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-tighter">خاص بالمجموعة</div>
            </div>
            <h2 className="text-2xl font-black leading-tight">أقوى أداة إزالة خلفية<br/> بدون استهلاك نقاطك!</h2>
            <p className="text-xs font-bold text-blue-50 leading-relaxed opacity-90 max-w-[80%]">تتم المعالجة بالكامل داخل جهازك، المرة الأولى قد تتطلب ثوانٍ لتحميل "المحرك الذكي" وبعدها ستكون فورية.</p>
          </div>
          <Scissors className="absolute -bottom-4 -left-4 text-white/10 w-32 h-32 rotate-12" />
        </motion.div>

        {/* Upload Area */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 space-y-8">
          <div 
            onClick={() => status !== 'processing' && fileInputRef.current?.click()}
            className={cn(
              "w-full aspect-square border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all group relative overflow-hidden",
              status === 'processing' ? "cursor-wait border-primary/40 bg-primary/5" : "cursor-pointer border-gray-100 hover:bg-gray-50 hover:border-primary/20 bg-gray-50/50"
            )}
          >
            {processedImage ? (
              <div className="relative w-full h-full p-6 flex flex-col items-center justify-center">
                <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-gray-100 shadow-inner">
                  <Image 
                    src={processedImage} 
                    alt="Processed" 
                    fill 
                    className="object-contain p-4 drop-shadow-2xl" 
                    unoptimized
                  />
                </div>
                <div className="absolute inset-x-0 bottom-10 flex justify-center">
                  <motion.button 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={(e) => { e.stopPropagation(); downloadResult(); }}
                    className="bg-white text-gray-900 border border-gray-100 px-8 py-3 rounded-full shadow-2xl font-black text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Download size={18} className="text-primary" /> تحميل النتيجة (شفافة)
                  </motion.button>
                </div>
              </div>
            ) : originalImage ? (
              <>
                <Image 
                  src={originalImage} 
                  alt="Original" 
                  fill 
                  className={cn("absolute inset-0 object-cover transition-all", status === 'processing' ? "opacity-20 blur-md" : "opacity-40")} 
                  unoptimized
                />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  {status === 'processing' ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center transform rotate-12">
                        <RefreshCw className="text-primary animate-spin" size={32} />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-black text-primary">{progress}% - {progressStage}</span>
                        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                           <motion.div 
                            className="h-full bg-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                           />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-3xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Scissors className="text-primary" size={32} />
                      </div>
                      <span className="text-sm font-black text-gray-700">تغيير الصورة</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-white text-primary">
                    <Upload size={32} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg font-black text-gray-900 tracking-tight">إسحب الصورة هنا</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">أو إضغط للاختيار من جهازك</span>
                </div>
              </div>
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

          {/* Guidelines */}
          {!processedImage && status !== 'processing' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">السرعة</p>
                <p className="text-[9px] text-gray-600 leading-relaxed font-bold">الأداء يعتمد على قوة جهازك لأن المعالجة تحدث محلياً.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">الخصوصية</p>
                <p className="text-[9px] text-gray-600 leading-relaxed font-bold">صورك لا تغادر جهازك أبداً ولا يتم رفعها لأي خادم.</p>
              </div>
            </div>
          )}
        </div>

        {processedImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-4"
          >
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 bg-white border border-gray-200 rounded-[2rem] text-sm font-black text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <RefreshCw size={18} /> تجربة صورة أخرى
            </button>
            <Link 
              href="/image-generation"
              className="w-full py-5 bg-primary/10 rounded-[2rem] text-sm font-black text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-3"
            >
              <ChevronRight size={18} /> استخدام في توليد الصور
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
