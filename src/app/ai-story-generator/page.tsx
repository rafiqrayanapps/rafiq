'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, 
  Sparkles, 
  Settings2, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  Trash2, 
  Save, 
  FileDown, 
  Languages, 
  Layout, 
  History, 
  Zap,
  Key,
  Image as ImageIcon,
  Edit2,
  Video,
  Monitor,
  Smartphone,
  Palette
} from 'lucide-react';
import Header from '@/components/Header';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useApiKey } from '@/components/providers/ApiKeyProvider';
import ApiKeyGate from '@/components/ApiKeyGate';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const defaultAi = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

const dialects = [
  { label: 'العربية الفصحى', value: 'Modern Standard Arabic' },
  { label: 'اللهجة المصرية', value: 'Egyptian Arabic Dialect' },
  { label: 'اللهجة السعودية', value: 'Saudi Arabic Dialect' },
  { label: 'اللهجة الإماراتية', value: 'Emirati Arabic Dialect' },
  { label: 'لهجة بلاد الشام', value: 'Levantine Arabic Dialect' },
  { label: 'لهجة المغرب العربي', value: 'Maghreb Arabic Dialect' },
  { label: 'اللهجة العراقية', value: 'Iraqi Arabic Dialect' },
  { label: 'اللهجة الكويتية', value: 'Kuwaiti Arabic Dialect' },
];

const styles = [
  { label: 'وايت بورد (رسم)', value: 'Professional Whiteboard Animation, clean black ink lines on white background, minimalist, clear silhouettes, expert marker drawing, high contrast, non-textured background' },
  { label: 'سينمائي واقعي', value: 'Professional cinematic film still, shot on 35mm lens, blockbuster movie lighting, realistic textures, volumetric lighting, high contrast' },
  { label: 'أنمي / مانجا', value: 'High-quality modern anime illustration, Studio Ghibli vibes, hand-drawn aesthetic, vibrant colors, clean line art' },
  { label: 'رسم زيتي', value: 'Classical oil on canvas, heavy impasto brushstrokes, artistic textures, fine art masterpiece' },
  { label: 'ثلاثي الأبعاد 3D', value: 'Hyper-detailed 3D octane render, Unreal Engine 5 aesthetic, plastic and metallic textures, ambient occlusion' },
  { label: 'سايبر بانك', value: 'Neon-drenched futuristic aesthetic, synthwave colors, rainy night city, bioluminescence, glowing accents' },
];

interface Scene {
  id: string;
  narration: string;
  imagePrompt: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export default function AIStoryGenerator() {
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [dialect, setDialect] = useState('Modern Standard Arabic');
  const [selectedStyle, setSelectedStyle] = useState(styles[0].value);
  const [sceneCount, setSceneCount] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { apiKey: userApiKey, hasKey } = useApiKey();
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getAi = () => {
    if (userApiKey && userApiKey.trim() !== '') {
      return new GoogleGenAI({ apiKey: userApiKey });
    }
    // Fallback to default if user hasn't provided one yet, but UI will strongly suggest adding it
    return defaultAi;
  };

  const generateStory = async () => {
    if (!idea.trim()) {
      toast({ title: "خطأ", description: "يرجى كتابة فكرة القصة أولاً.", variant: "destructive" });
      return;
    }

    if (!hasKey) {
      toast({ 
        title: "مفتاح API مطلوب", 
        description: "يرجى إضافة مفتاح Gemini API من إعدادات القائمة الجانبية للمتابعة.", 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    setScenes([]);

    try {
      const ai = getAi();
      const styleInstruction = selectedStyle;
      const systemInstruction = `
        You are an expert storyteller and visual storyboard artist.
        Your task is to take a story idea and expand it into a structured sequence of exactly ${sceneCount} scenes.
        
        For each scene, provide:
        1. Narration text: A compelling narrative. 
           IF language is Arabic, use the following dialect/style: ${dialect}.
           IF language is English, use standard English.
        2. Image Prompt: A highly detailed visual description in ENGLISH for image generation. 
           STYLE: The style must be "${styleInstruction}".
        
        OUTPUT FORMAT: You MUST return a JSON object with a "scenes" array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: "user", parts: [{ text: idea }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    narration: { type: "string" },
                    imagePrompt: { type: "string" }
                  },
                  required: ["narration", "imagePrompt"]
                }
              }
            },
            required: ["scenes"]
          }
        }
      });

      const data = JSON.parse(response.text || '{"scenes":[]}');
      const formattedScenes: Scene[] = data.scenes.map((s: any, idx: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        ...s
      }));

      setScenes(formattedScenes);
      toast({ title: "تم التوليد", description: "تم إنشاء مسودة القصة بنجاح!" });
    } catch (error: any) {
      console.error('Error generating story:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء توليد القصة. يرجى المحاولة مرة أخرى.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async (index: number) => {
    const scene = scenes[index];
    if (!scene) return;

    const newScenes = [...scenes];
    newScenes[index].isGeneratingImage = true;
    setScenes(newScenes);

    try {
      const ai = getAi();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ role: "user", parts: [{ text: scene.imagePrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let foundImage = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            foundImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (foundImage) {
        const updatedScenes = [...scenes];
        updatedScenes[index].imageUrl = foundImage;
        updatedScenes[index].isGeneratingImage = false;
        setScenes(updatedScenes);
      } else {
        throw new Error("No image data found");
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      const resetScenes = [...scenes];
      resetScenes[index].isGeneratingImage = false;
      setScenes(resetScenes);
      
      if (error?.message?.includes('403') || error?.message?.includes('permission') || error?.message?.includes('API key')) {
        toast({ 
          title: "خطأ في الصلاحيات", 
          description: "يبدو أنك بحاجة لتحديث مفتاح API الخاص بك في الإعدادات.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "خطأ", description: "تعذر توليد الصورة لهذا المشهد.", variant: "destructive" });
      }
    }
  };

  const updateScene = (index: number, field: keyof Scene, value: string) => {
    const newScenes = [...scenes];
    (newScenes[index] as any)[field] = value;
    setScenes(newScenes);
  };

  const deleteScene = (index: number) => {
    setScenes(prev => prev.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "تم النسخ", description: "تم نسخ النص إلى الحافظة." });
  };

  const exportAll = () => {
    const text = scenes.map((s, i) => `المشهد ${i + 1}:\n${s.narration}\n\nالوصف البصري:\n${s.imagePrompt}\n\n------------------\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-story-ai.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تمت العملية", description: "تم تصدير القصة كملف نصي." });
  };

  const exportPDF = async () => {
    if (!pdfRef.current) return;
    
    setIsExporting(true);
    toast({ title: "جاري التصدير", description: "يتم الآن إعداد ملف PDF الاحترافي..." });

    try {
      // Small delay to ensure images are loaded or UI is stable
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`story-${Date.now()}.pdf`);

      toast({ title: "تم التصدير", description: "تم تحميل ملف PDF بنجاح!" });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({ title: "خطأ", description: "فشل تصدير ملف PDF. يرجى المحاولة مرة أخرى.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col text-right" dir="rtl">
      <Header title="توليد محتوى بالذكاء" showBackButton compact />

      <main className="flex-1 container max-w-4xl mx-auto px-6 py-8 pb-32 space-y-8">
        <ApiKeyGate 
          title="مولد القصص والمحتوى"
          description="أطلق العنان لخيالك ودع الذكاء الاصطناعي يساعدك في كتابة قصص ومحتوى إبداعي فريد."
        >
          {/* Input Section */}
          <section className="bg-white rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-blue-50 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="h-6 w-6" />
              <h2 className="text-xl font-black">ما هي فكرتك اليوم؟</h2>
            </div>
          </div>
          
          <textarea 
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="اكتب فكرة القصة هنا... مثلاً: قصة عن طفل يكتشف سراً في الحديقة الخلفية."
            className="w-full h-40 bg-[#F8FAFF] rounded-[2rem] p-6 text-sm font-bold border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-inner"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                   <Languages size={14} /> اللغة واللهجة
                </label>
                <div className="space-y-2">
                  <div className="flex bg-[#F8FAFF] p-1.5 rounded-2xl border border-blue-50">
                    <button 
                      onClick={() => setLanguage('ar')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black rounded-xl transition-all",
                        language === 'ar' ? "bg-white shadow-md text-primary" : "text-gray-400"
                      )}
                    >العربية</button>
                    <button 
                      onClick={() => setLanguage('en')}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black rounded-xl transition-all",
                        language === 'en' ? "bg-white shadow-md text-primary" : "text-gray-400"
                      )}
                    >English</button>
                  </div>
                  {language === 'ar' && (
                    <select 
                      value={dialect}
                      onChange={(e) => setDialect(e.target.value)}
                      className="w-full bg-[#F8FAFF] p-3 text-[10px] font-black rounded-2xl border border-blue-50 outline-none"
                    >
                      {dialects.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  )}
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                   <Palette size={14} /> نمط الصور
                </label>
                <select 
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full bg-[#F8FAFF] p-3 text-[10px] font-black rounded-2xl border border-blue-50 outline-none"
                >
                   {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                   <Layout size={14} /> عدد المشاهد
                </label>
                <select 
                  value={sceneCount}
                  onChange={(e) => setSceneCount(Number(e.target.value))}
                  className="w-full bg-[#F8FAFF] p-3 text-[10px] font-black rounded-2xl border border-blue-50 outline-none"
                >
                   {[3,4,5,6,7,8,9,10,12,15,20,25,30].map(n => <option key={n} value={n}>{n} مشاهد</option>)}
                </select>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 mr-2 uppercase tracking-widest flex items-center gap-2">
                   <Monitor size={14} /> أبعاد الفيديو
                </label>
                <div className="flex bg-[#F8FAFF] p-1.5 rounded-2xl border border-blue-50">
                   <button 
                     onClick={() => setAspectRatio('16:9')}
                     className={cn(
                       "flex-1 py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2",
                       aspectRatio === '16:9' ? "bg-white shadow-md text-primary" : "text-gray-400"
                     )}
                   >
                     <Monitor size={14} /> أفقي
                   </button>
                   <button 
                     onClick={() => setAspectRatio('9:16')}
                     className={cn(
                       "flex-1 py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2",
                       aspectRatio === '9:16' ? "bg-white shadow-md text-primary" : "text-gray-400"
                     )}
                   >
                     <Smartphone size={14} /> رأسي
                   </button>
                </div>
             </div>
          </div>

          <button 
            onClick={generateStory}
            disabled={isGenerating || !idea.trim()}
            className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>جاري حبك القصة...</span>
              </>
            ) : (
              <>
                <Zap className="h-6 w-6" />
                <span>توليد القصة الآن</span>
              </>
            )}
          </button>
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {scenes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">المشاهد المقترحة ({scenes.length})</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={exportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-xs font-black text-white bg-primary px-5 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                  >
                    {isExporting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileDown size={14} />}
                    تصدير ملف PDF الاحترافي
                  </button>
                  <button 
                    onClick={exportAll}
                    title="تصدير كملف نصي"
                    className="p-2.5 text-gray-400 bg-gray-100/50 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <div className="grid gap-8">
                {scenes.map((scene, idx) => (
                  <motion.div 
                    key={scene.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Left Side: Content Edit */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                {idx + 1}
                              </span>
                              <h4 className="font-black text-lg">تحرير المشهد</h4>
                           </div>
                           <button 
                             onClick={() => deleteScene(idx)}
                             className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">نص السرد</label>
                              <textarea 
                                value={scene.narration}
                                onChange={(e) => updateScene(idx, 'narration', e.target.value)}
                                className="w-full h-24 bg-[#F8FAFF] rounded-2xl p-4 text-sm font-bold border-none focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">وصف الصورة (Prompt)</label>
                              <textarea 
                                value={scene.imagePrompt}
                                onChange={(e) => updateScene(idx, 'imagePrompt', e.target.value)}
                                dir="ltr"
                                className="w-full h-24 bg-[#F8FAFF] rounded-2xl p-4 text-xs font-mono border-none focus:ring-1 focus:ring-primary/20 transition-all resize-none text-left"
                              />
                           </div>
                        </div>

                        <div className="flex gap-3">
                           <button 
                             onClick={() => copyToClipboard(scene.narration, idx)}
                             className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                           >
                             {copiedIndex === idx ? <Check size={14} /> : <Copy size={14} />}
                             نسخ النص
                           </button>
                           <button 
                             onClick={() => generateImage(idx)}
                             disabled={scene.isGeneratingImage}
                             className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl text-[10px] font-black hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
                           >
                             {scene.isGeneratingImage ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon size={14} />}
                             {scene.imageUrl ? 'إعادة التوليد' : 'توليد الصورة'}
                           </button>
                        </div>
                      </div>

                      {/* Right Side: Image Result */}
                      <div className="lg:w-[320px] shrink-0">
                         <div className={cn(
                           "relative w-full rounded-[2.2rem] bg-[#F8FAFF] overflow-hidden border border-blue-50 shadow-inner flex flex-col items-center justify-center",
                           aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'
                         )}>
                            {scene.imageUrl ? (
                              <Image 
                                src={scene.imageUrl} 
                                alt={`Scene ${idx + 1}`} 
                                fill 
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-3 text-gray-300">
                                <ImageIcon size={48} className="stroke-[1.5]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">بانتظار الصورة</span>
                              </div>
                            )}

                            {scene.isGeneratingImage && (
                              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                              </div>
                            )}
                         </div>
                         
                         {scene.imageUrl && (
                            <button 
                              onClick={() => {
                                 const a = document.createElement('a');
                                 a.href = scene.imageUrl!;
                                 a.download = `scene-${idx + 1}.png`;
                                 a.click();
                              }}
                              className="w-full mt-4 py-3 rounded-xl bg-white text-gray-400 text-[10px] font-black border border-gray-100 hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                               <Download size={14} /> حفظ الصورة
                            </button>
                         )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {scenes.length === 0 && !isGenerating && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="flex flex-col items-center justify-center py-20 bg-white rounded-[3.5rem] border border-gray-100 shadow-sm text-center gap-6"
           >
              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
                 <Video size={48} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-gray-900">سرد قصصي احترافي بأقل جهد</h2>
                 <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                    اكتب فكرتك ودع الذكاء الاصطناعي يقوم بالباقي: كتابة القصة، تقسيمها لمشاهد، ووصف الصور بأسلوب Whiteboard الرائع.
                 </p>
              </div>
           </motion.div>
        )}
        </ApiKeyGate>
      </main>

      {/* Hidden PDF Export Template */}
      <div className="fixed -left-[2000px] top-0 w-[800px] pointer-events-none">
        <div ref={pdfRef} className="bg-white p-12 text-right" dir="rtl" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Cover Section */}
          <div className="mb-16 pb-8 border-b-2 border-primary/20 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white mb-6">
                <Wand2 size={32} />
             </div>
             <h1 className="text-4xl font-black mb-4 text-gray-900 leading-tight">{idea.length > 50 ? idea.substring(0, 50) + '...' : idea}</h1>
             <p className="text-primary font-bold text-lg tracking-widest uppercase">قصة مولدة بالذكاء الاصطناعي</p>
             <div className="mt-8 flex items-center gap-4 text-gray-400 text-sm font-medium">
               <span>{scenes.length} مشهد</span>
               <div className="w-1 h-1 rounded-full bg-gray-200" />
               <span>{language === 'ar' ? 'العربية' : 'English'}</span>
               <div className="w-1 h-1 rounded-full bg-gray-200" />
               <span>{new Date().toLocaleDateString('ar-EG')}</span>
             </div>
          </div>

          {/* Scenes Grid */}
          <div className="space-y-12">
            {scenes.map((scene, idx) => (
              <div key={scene.id} className="break-inside-avoid">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                      {idx + 1}
                   </div>
                   <div className="h-[2px] flex-1 bg-gray-100" />
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                   {scene.imageUrl && (
                     <div className={cn(
                       "relative w-full rounded-[2rem] overflow-hidden border-4 border-gray-50",
                       aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'
                     )}>
                        {/* Use native img for html2canvas to work best with CORS/dataUrls */}
                        <Image 
                          src={scene.imageUrl} 
                          alt={`Scene ${idx + 1}`} 
                          fill
                          className="object-cover"
                          unoptimized
                        />
                     </div>
                   )}
                   
                   <div className="bg-gray-50/50 rounded-[2.5rem] p-8">
                      <p className="text-xl font-bold text-gray-800 leading-relaxed text-justify">
                        {scene.narration}
                      </p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-gray-100 flex justify-between items-center opacity-50">
             <span className="text-xs font-black uppercase tracking-tighter">تم النسخ بواسطة رفيق المصمم</span>
             <span className="text-xs font-bold font-mono">APP-BUILDER-AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
