'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Palette, Copy, RefreshCw, Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useApiKey } from '@/components/providers/ApiKeyProvider';
import ApiKeyGate from '@/components/ApiKeyGate';

export default function ColorsPage() {
  const { hasKey } = useApiKey();
  const { toast } = useToast();
  const [palettes, setPalettes] = useState<string[][]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const generatePalettes = () => {
    if (!hasKey) return;
    const newPalettes = Array.from({ length: 12 }, () => {
      const baseHue = Math.floor(Math.random() * 360);
      return [
        `hsl(${baseHue}, 70%, 50%)`,
        `hsl(${(baseHue + 30) % 360}, 70%, 60%)`,
        `hsl(${(baseHue + 60) % 360}, 70%, 70%)`,
        `hsl(${(baseHue + 180) % 360}, 70%, 50%)`,
        `hsl(${(baseHue + 210) % 360}, 70%, 60%)`,
      ];
    });
    setPalettes(newPalettes);
  };

  useEffect(() => {
    if (hasKey) {
      generatePalettes();
    }
  }, [hasKey]);

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast({
      title: "تم النسخ!",
      description: `تم نسخ اللون ${color} إلى الحافظة.`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col focus:outline-none">
      <Header title="منسق الألوان" showBackButton compact />
      
      <main className="flex-1 px-6 pb-32 pt-4 max-w-6xl mx-auto w-full space-y-8">
        <ApiKeyGate 
          title="أداة منسق الألوان"
          description="اكتشف تناسقات لونية مذهلة لمشاريعك القادمة باستخدام الذكاء الاصطناعي."
        >
          <section className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2">
            <div className="space-y-4 text-center md:text-right">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-primary">
                  <Palette size={28} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">منسق الألوان الذكي</h1>
              </div>
              <p className="text-gray-500 font-bold max-w-md">اكتشف تناسقات لونية مذهلة لمشاريعك القادمة بضغطة زر واحدة.</p>
            </div>
            
            <button 
              onClick={generatePalettes}
              className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all flex items-center gap-3 border border-primary/10"
            >
              <RefreshCw size={20} />
              توليد لوحات جديدة
            </button>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {palettes.map((palette, pIdx) => (
              <motion.div 
                key={`palette-${pIdx}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: palettes.indexOf(palette) * 0.05 }}
                className="bg-white p-6 rounded-[3rem] shadow-sm border border-gray-100 space-y-4 hover:shadow-2xl transition-all group"
              >
                <div className="flex h-32 w-full rounded-[2rem] overflow-hidden shadow-inner">
                  {palette.map((color, cIdx) => (
                    <div 
                      key={`${color}-${cIdx}`}
                      className="flex-1 cursor-pointer hover:flex-[1.5] transition-all duration-500 relative group/color"
                      style={{ backgroundColor: color }}
                      onClick={() => copyColor(color)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/color:opacity-100 bg-black/20 backdrop-blur-[2px] transition-opacity">
                        {copiedColor === color ? <Check className="text-white" size={24} /> : <Copy className="text-white" size={24} />}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center px-2">
                  <div className="flex gap-1">
                    {palette.map((color, cIdx) => (
                      <div key={`${color}-${cIdx}`} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Palette #{palettes.indexOf(palette) + 1}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <section className="bg-primary/5 rounded-[3rem] p-10 text-center space-y-6 border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={120} className="text-primary" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 relative z-10">نصيحة للمصممين</h2>
            <p className="text-gray-600 leading-relaxed font-medium max-w-2xl mx-auto relative z-10">
              استخدم قاعدة 60-30-10 عند توزيع الألوان: 60% للون الأساسي، 30% للون الثانوي، و10% للون التمييز (Accent Color) للحصول على توازن بصري مثالي.
            </p>
          </section>
        </ApiKeyGate>
      </main>
    </div>
  );
}
