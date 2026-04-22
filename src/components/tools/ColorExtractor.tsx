'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Copy, Palette, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

import Image from 'next/image';

export default function ColorExtractor() {
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractColors = useCallback(async (imgUrl: string) => {
    if (!imgUrl) return;
    setColors([]);
    setIsExtracting(true);
    
    try {
      const { Vibrant } = await import('node-vibrant/browser');
      if (!Vibrant || !Vibrant.from) {
        throw new Error('Vibrant library failed to initialize correctly');
      }

      const palette = await Vibrant.from(imgUrl).getPalette();
      
      if (!palette || typeof palette !== 'object') {
        throw new Error('Could not extract palette - image analysis returned nothing');
      }

      const extractedColors = Object.entries(palette)
        .filter(([_, swatch]) => swatch && typeof swatch === 'object' && typeof (swatch as any).getHex === 'function')
        .map(([name, swatch]) => ({
          name,
          hex: (swatch as any).getHex()
        }));
      
      if (extractedColors.length === 0) {
        throw new Error('No distinct colors could be extracted from this image');
      }

      setColors(extractedColors);
    } catch (error: any) {
      console.error('Extraction failed:', error);
      
      const errorMessage = error?.message || '';
      const isNullError = errorMessage.includes('undefined or null') || 
                          error?.name === 'TypeError' && errorMessage.includes('object');

      toast({
        title: 'خطأ في استخراج الألوان',
        description: isNullError 
          ? 'حدث خطأ تقني في معالجة بيانات الصورة، يرجى تجربة ملف آخر.'
          : 'فشل استخراج الألوان، قد تكون الصورة تالفة أو غير متوافقة.',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  }, [toast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImage(url);
        extractColors(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    toast({
      title: 'تم النسخ',
      description: `تم نسخ اللون ${hex} إلى الحافظة.`,
    });
  };

  return (
    <div className="space-y-6 pt-4 text-right">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-40 border-2 border-dashed border-primary/20 rounded-[2rem] bg-primary/5 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 transition-all group relative overflow-hidden"
      >
        {image ? (
          <>
            <Image 
              src={image} 
              alt="Uploaded" 
              fill 
              className="absolute inset-0 object-cover opacity-30 blur-sm" 
              unoptimized 
            />
            <div className="relative z-10 flex flex-col items-center">
              <Palette className="mb-2 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-primary uppercase">تغيير الصورة</span>
            </div>
          </>
        ) : (
          <>
            <Upload className="mb-2 text-primary opacity-40 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-black text-primary/40 uppercase">اضغط لرفع صورة</span>
          </>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
        />
      </div>

      <AnimatePresence>
        {isExtracting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-primary"
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold">جاري استخراج الألوان...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {colors.length > 0 && !isExtracting && (
        <div className="grid grid-cols-2 gap-3">
          {colors.map((color, idx) => (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={color.name}
              onClick={() => copyToClipboard(color.hex)}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl cursor-pointer hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-primary/10"
            >
              <div 
                className="w-10 h-10 rounded-xl shadow-inner border border-black/5" 
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex flex-col text-right flex-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{color.name}</span>
                <span className="text-xs font-mono font-black text-gray-700">{color.hex}</span>
              </div>
              <Copy size={12} className="text-gray-300 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      )}

      {image && colors.length === 0 && !isExtracting && (
        <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl">
          <AlertCircle size={16} />
          <p className="text-[10px] font-bold">لم نتمكن من استخراج الألوان، جرب صورة أخرى.</p>
        </div>
      )}
    </div>
  );
}
