'use client';

import { useState, useRef } from 'react';
import { Upload, Wand2, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// Lazy load transformers to avoid blocking
let pipelinePromise: Promise<any> | null = null;

export default function LocalAiTool() {
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'analyzing' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPipeline = async () => {
    if (pipelinePromise) return pipelinePromise;
    
    pipelinePromise = (async () => {
      try {
        const { pipeline: getPipeline, env } = await import('@xenova/transformers');
        
        if (!getPipeline || !env) {
          throw new Error('Transformers library failed to load correctly');
        }

        // Configure environment
        env.allowLocalModels = false;
        env.useBrowserCache = true;
        
        setStatus('loading');
        
        const p = await getPipeline('image-to-text', 'Xenova/vit-gpt2-image-captioning', {
          progress_callback: (data: any) => {
            if (data && typeof data === 'object' && data.status === 'progress') {
              setProgress(Math.round(data.progress || 0));
            }
          }
        });
        
        return p;
      } catch (error) {
        pipelinePromise = null; // Reset to allow retry
        throw error;
      }
    })();
    
    return pipelinePromise;
  };

  const analyzeImage = async (imgUrl: string) => {
    if (!imgUrl) return;
    
    try {
      const p = await loadPipeline();
      if (!p || typeof p !== 'function') {
        throw new Error('Analysis pipeline is not ready');
      }

      setStatus('analyzing');
      const output = await p(imgUrl);
      
      if (output && Array.isArray(output) && output.length > 0 && output[0].generated_text) {
        setDescription(output[0].generated_text);
        setStatus('done');
      } else {
        throw new Error('No description was generated for this image');
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setStatus('error');
      
      const isNullError = error?.message?.includes('undefined or null') || 
                          error?.name === 'TypeError' && error?.message?.includes('object');

      toast({
        title: 'خطأ في التحليل الذكي',
        description: isNullError 
          ? 'حدث خطأ في الذاكرة أثناء معالجة الصورة، يرجى المحاولة مرة أخرى بمتصفح آخر أو صورة أصغر.'
          : 'فشل تحليل الصورة، قد يكون الملف غير مدعوم أو أن هناك مشكلة في الاتصال بالنموذج.',
        variant: 'destructive'
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImage(url);
        setDescription(null);
        analyzeImage(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyResult = () => {
    if (description) {
      navigator.clipboard.writeText(description);
      toast({ title: 'تم النسخ', description: 'تم نسخ الوصف إلى الحافظة.' });
    }
  };

  return (
    <div className="space-y-6 pt-4 text-right">
      <div className="bg-orange-50 border border-orange-100 p-4 rounded-[2rem] flex items-start gap-3">
        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
        <div className="flex flex-col">
           <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">ملاحظة تقنية</span>
           <p className="text-[9px] text-orange-800 leading-relaxed font-bold">هذه الأداة تعمل بالكامل داخل جهازك. المرة الأولى قد تستغرق بضع دقائق لتحميل النموذج (حوالي 80 ميجابايت)، وبعدها ستعمل فوراً بدون إنترنت.</p>
        </div>
      </div>

      <div 
        onClick={() => status !== 'loading' && status !== 'analyzing' && fileInputRef.current?.click()}
        className={cn(
          "w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all group relative overflow-hidden",
          (status === 'loading' || status === 'analyzing') ? "cursor-wait border-primary/40" : "cursor-pointer border-primary/20 hover:bg-primary/5 hover:border-primary/40"
        )}
      >
        {image ? (
          <>
            <Image 
              src={image} 
              alt="Uploaded" 
              fill 
              className={cn("absolute inset-0 object-cover transition-all", (status === 'loading' || status === 'analyzing') ? "opacity-20 blur-sm" : "opacity-40")} 
              unoptimized
            />
            <div className="relative z-10 flex flex-col items-center">
              {status === 'loading' || status === 'analyzing' ? (
                <RefreshCw className="mb-2 text-primary animate-spin" />
              ) : (
                <Wand2 className="mb-2 text-primary group-hover:scale-110 transition-transform" />
              )}
              <span className="text-[10px] font-black text-primary uppercase">
                {status === 'loading' ? `جاري تحميل النموذج (${progress}%)` : status === 'analyzing' ? 'جاري تحليل الصورة...' : 'تغيير الصورة'}
              </span>
            </div>
          </>
        ) : (
          <>
            <Wand2 className="mb-2 text-primary opacity-40 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-primary/40 uppercase">رفع صورة للتحليل</span>
          </>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
          disabled={status === 'loading' || status === 'analyzing'}
        />
      </div>

      <AnimatePresence>
        {description && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">وصف الصورة (باللغة الإنجليزية)</label>
            <div className="bg-gray-50 border border-gray-100 p-6 rounded-[2rem] relative group">
              <p className="text-sm font-bold text-gray-700 leading-relaxed text-left font-mono">{description}</p>
              <button 
                onClick={copyResult}
                className="absolute top-4 right-4 p-2 bg-white rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all text-primary hover:bg-primary hover:text-white"
              >
                <Copy size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
