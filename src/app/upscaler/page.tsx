'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Trash2, 
  Download, 
  RefreshCw, 
  Maximize2, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function UpscalerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "خطأ", description: "يرجى اختيار ملف صورة صالح.", variant: "destructive" });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setProcessedImage(null);
        setError(null);
        setProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const upscaleImage = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    toast({ title: "بدء المعالجة", description: "جاري تحسين جودة الصورة باستخدام الذكاء الاصطناعي..." });

    try {
      // Lazy load upscaler.js and the model
      const UpscalerModule = await import('upscaler');
      const Upscaler = UpscalerModule.default;
      
      const modelModule = await import('@upscalerjs/esrgan-slim');
      const model = modelModule.x2;

      const upscaler = new Upscaler({
        model: model
      });

      // Create a temporary image element to get the image data
      const img = new window.Image();
      img.src = image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const upscaledImageSrc = await upscaler.upscale(image, {
        progress: (p) => {
          setProgress(Math.round(p * 100));
        }
      });

      setProcessedImage(upscaledImageSrc);
      toast({ title: "تم النجاح", description: "تم تحسين جودة الصورة بنجاح!" });
    } catch (err: any) {
      console.error('Upscale Error:', err);
      setError("حدث خطأ أثناء تحسين الصورة. قد يكون ذلك بسبب حجم الصورة أو عدم توافق الجهاز.");
      toast({ title: "خطأ", description: "تعذر تحسين الصورة. يرجى المحاولة وقت آخر.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setProcessedImage(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = 'upscaled-image.png';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col text-right" dir="rtl">
      <Header title="تحسين جودة الصور" showBackButton compact />

      <main className="flex-1 container max-w-4xl mx-auto px-6 py-8 pb-32 space-y-8">
        {/* Welcome Section */}
        <section className="bg-white rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-blue-50 text-center space-y-4">
           <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-2">
              <Maximize2 size={28} />
           </div>
           <div className="space-y-1">
             <h2 className="text-2xl font-black text-gray-900">محسن الصور الذكي</h2>
             <p className="text-gray-400 font-medium text-sm">ضاعف ملامح صورتك وحسن جودتها باستخدام تقنيات ESRGAN المتقدمة.</p>
           </div>
        </section>

        {/* Upload Area */}
        {!image ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => fileInputRef.current?.click()}
            className="group relative cursor-pointer"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*" 
            />
            <div className="bg-white border-4 border-dashed border-blue-50 rounded-[3.5rem] p-16 flex flex-col items-center justify-center gap-6 transition-all group-hover:bg-blue-50/30 group-hover:border-primary/20">
               <div className="w-24 h-24 bg-[#F8FAFF] rounded-[2.5rem] flex items-center justify-center text-gray-200 group-hover:text-primary/40 transition-colors">
                  <Upload size={48} className="group-hover:scale-110 transition-transform" />
               </div>
               <div className="space-y-1 text-center">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">اسحب الصورة هنا أو اضغط للاختيار</h3>
                  <p className="text-gray-300 font-medium text-xs">JPG, PNG, WebP (بحد أقصى 2 ميجابايت للنتائج الأسرع)</p>
               </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Original Image */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الصورة الأصلية</span>
                    <button onClick={reset} className="text-gray-300 hover:text-red-500 transition-colors">
                       <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="relative aspect-square bg-white rounded-[3rem] p-4 shadow-xl border border-gray-100 overflow-hidden">
                     <Image 
                       src={image} 
                       alt="Original" 
                       fill 
                       className="object-contain p-2" 
                       unoptimized
                     />
                  </div>
               </div>

               {/* Result Image */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">تحسين x2</span>
                    {processedImage && (
                       <div className="flex items-center gap-2 text-[10px] font-black text-green-500">
                         <Check size={12} /> جاهز للتحميل
                       </div>
                    )}
                  </div>
                  <div className={cn(
                    "relative aspect-square bg-white rounded-[3rem] p-4 shadow-xl border border-gray-100 overflow-hidden flex items-center justify-center",
                    processedImage ? "bg-[#f2f2f2]" : "bg-gray-50/30"
                  )}>
                     {processedImage ? (
                       <Image 
                         src={processedImage} 
                         alt="Upscaled" 
                         fill 
                         className="object-contain p-2" 
                         unoptimized
                       />
                     ) : isProcessing ? (
                        <div className="flex flex-col items-center gap-4 text-primary">
                          <div className="relative w-20 h-20">
                            <Loader2 size={80} className="animate-spin opacity-20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-black">{progress}%</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-center px-8">
                            <p className="text-xs font-black animate-pulse">جاري تحسين التفاصيل...</p>
                            <p className="text-[9px] text-gray-400 font-bold">نقوم بتحليل كل بكسل لإعادة بناء التفاصيل المفقودة.</p>
                          </div>
                        </div>
                     ) : (
                       <div className="text-gray-200 flex flex-col items-center gap-2">
                         <ImageIcon size={64} className="opacity-20 translate-y-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-30">اضغط &quot;بدء التحسين&quot; للبدء</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
               {!processedImage ? (
                 <button 
                   onClick={upscaleImage}
                   disabled={isProcessing}
                   className="flex-1 py-5 rounded-[2rem] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                   {isProcessing ? (
                     <>
                       <RefreshCw className="h-6 w-6 animate-spin" />
                       <span>جاري التحسين ({progress}%)</span>
                     </>
                   ) : (
                     <>
                       <Sparkles className="h-6 w-6" />
                       <span>بدء التحسين الآن</span>
                     </>
                   )}
                 </button>
               ) : (
                 <>
                   <button 
                     onClick={downloadImage}
                     className="flex-[2] py-5 rounded-[2rem] bg-green-500 text-white font-black text-lg shadow-xl shadow-green-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     <Download className="h-6 w-6" />
                     <span>تحميل الصورة المحسنة</span>
                   </button>
                   <button 
                     onClick={reset}
                     className="flex-1 py-5 rounded-[2rem] bg-white border border-gray-100 text-gray-400 font-black text-base hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                   >
                     بدء من جديد
                   </button>
                 </>
               )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-red-600"
              >
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Info Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-gray-100/50">
           {[
             { title: "تقنية ESRGAN", desc: "نستخدم نماذج شبكات عصبية مدربة خصيصاً لتحسين تفاصيل الصور.", icon: <Check /> },
             { title: "بدون فقد جودة", desc: "نعمل على تقليل التشويش وزيادة الوضوح في نفس الوقت.", icon: <Check /> },
             { title: "معالجة آمنة", desc: "تتم المعالجة في متصفحك مباشرة لحماية خصوصية بياناتك.", icon: <Check /> }
           ].map((item, i) => (
             <div key={i} className="space-y-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
                   <div className="p-1">{item.icon}</div>
                </div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">{item.desc}</p>
             </div>
           ))}
        </section>
      </main>
    </div>
  );
}
