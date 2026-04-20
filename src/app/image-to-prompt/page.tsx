'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Image as ImageIcon, Zap, Copy, Check, RefreshCw, ArrowRight, Key, Settings2, Info, Rocket, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useApiKey } from '@/components/providers/ApiKeyProvider';
import ApiKeyGate from '@/components/ApiKeyGate';

export default function ImageToPromptPage() {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newIdea, setNewIdea] = useState<string>('');
  const [activeMode, setActiveMode] = useState<string>('analysis');
  const [targetText, setTargetText] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const { apiKey: userApiKey, hasKey } = useApiKey();
  
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{title: string, message: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        toast({ title: "خطأ في الملف", description: "يرجى اختيار ملف صورة صالح.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setPrompt(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const generatePrompt = async () => {
    if (!image) return;

    if (!hasKey) {
      toast({
        title: "مفتاح API مطلوب",
        description: "يرجى إضافة مفتاح Gemini API من إعدادات القائمة الجانبية للمتابعة.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPrompt(null);

    try {
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const textPart = {
        text: activeMode === 'logo_swap' 
          ? `TASK: Logo/Sign Replacement. 
             1. Content Update: Change the primary logo, text, or sign in the image to say exactly: "${targetText}".
             2. Contextual Preservation: The new text "${targetText}" must perfectly match the lighting, texture, material, and perspective of the original logo/sign area. 
             3. Environment: Keep the entire surroundings of the image unchanged.
             Final output must include the aspect ratio: --ar ${aspectRatio}
             Output format: Provide ONLY a single descriptive prompt string in English for this modified image.`
          : activeMode === 'ad_swap'
          ? `TASK: Advertisement Replacement. 
             1. Content Update: Change the advertisement/billboard in the image to feature: "${targetText}".
             2. Design Integration: If targetText is provided, use it as the main brand/tag. The ad style should be modern and fit the environment.
             3. Contextual Preservation: The new advertisement must look natural in the original environment's lighting and atmosphere.
             Final output must include the aspect ratio: --ar ${aspectRatio}
             Output format: Provide ONLY a single descriptive prompt string in English for this modified image.`
          : activeMode === 'reproduction'
          ? `TASK: Image Reproduction/High-Fidelity Clone.
             Analyze the image focusing on the subject's exact anatomy, materials, micro-textures, lighting physics (global illumination, caustic reflections), and camera specs.
             Goal: Create a prompt that reproduces this EXACT image with identical structure but maximized quality.
             Final output must include the aspect ratio: --ar ${aspectRatio}
             Output format: Provide ONLY a single, long, comma-separated descriptive prompt string in English.`
          : newIdea.trim() !== '' 
          ? `Analysis & Artistic Transformation Task:
             1. Style Source: Analyze the attached image for its lighting physics, camera technicals (lens, angle, depth), artistic medium, and coloristic mood.
             2. Target Concept: "${newIdea}"
             3. Target Style: "${selectedStyle === 'default' ? 'Maintain original source style' : selectedStyle}"
             4. Intelligent Adaptation: Choose a "Setting/Situation" and "Color Palette" that are visually and logically perfect for the Target Concept.
             
             TECHNICAL REQUIREMENTS:
             - If Style is "default", strictly maintain the TECHNICAL VIBE of the Style Source.
             - If a specific Style is selected, blend the Style Source's technical quality with the new "${selectedStyle}" aesthetic.
             
             Final output must include the aspect ratio: --ar ${aspectRatio}
             
             Output format: Provide ONLY a single, long, comma-separated descriptive prompt string in English for the NEW IDEA. End with the aspect ratio parameter. Direct prompt only.`
          : `Analyze this image with extreme precision for a high-end AI image generation prompt (Midjourney style). 
             Your goal is 100% technical and aesthetic matching.
             
             Desired Output Style: "${selectedStyle === 'default' ? 'Pure analysis of source' : selectedStyle}"

             Include: Subject details, Lighting, Composition, Artistic Style, and Camera technicals.
             
             Final output must include the aspect ratio: --ar ${aspectRatio}
             
             Output format: Provide a single, long, comma-separated descriptive prompt string in English. End with the aspect ratio parameter. Just the raw prompt content.`,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: { parts: [imagePart, textPart] },
      });

      const result = response.text;
      setPrompt(result || "فشل في إنشاء الوصف. حاول مرة أخرى.");
      toast({ title: "اكتمل التحليل", description: "تم استخراج الوصف من الصورة بنجاح." });
    } catch (error: any) {
      console.error('Error generating prompt:', error);
      let title = "خطأ في التحليل";
      let errorMsg = "حدث خطأ أثناء تحليل الصورة عبر الـ API. تأكد من صحة المفتاح واتصالك بالإنترنت. 😊";
      
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes('API key not valid')) {
        title = "المفتاح غير صالح 🔑";
        errorMsg = "يبدو أن مفتاح API الذي أدخلته غير صحيح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio ومحاولة تحديثه في الإعدادات.";
      }

      setErrorInfo({ title, message: errorMsg });
      setIsErrorDialogOpen(true);
      
      toast({
        title,
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "تم النسخ",
        description: "تم نسخ النص إلى الحافظة بنجاح.",
      });
    }
  };

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header title="تحويل الصورة لبرومبت" showBackButton compact />
      
      <main className="flex-1 px-6 pb-32 pt-4 container max-w-2xl mx-auto space-y-6">
        <ApiKeyGate 
          title="تحويل الصورة لبرومبت"
          description="حلّل صورك واستخرج منها أوصافاً دقيقة (Prompts) لتحسين عملك الإبداعي."
        >
          <header className="text-center space-y-1">
            <h1 className="text-xl font-black text-foreground">ذكاء اصطناعي (API)</h1>
            <p className="text-muted-foreground text-xs">حوّل صورك إلى أوصاف دقيقة باستخدام Gemini API</p>
          </header>

        <div className="space-y-5">
          {/* Upload Area */}
          <label htmlFor="image-upload" className="block cursor-pointer">
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                 "relative aspect-video rounded-[2.5rem] border-4 border-dashed border-muted flex flex-col items-center justify-center transition-all overflow-hidden group",
                 image ? "border-primary/30" : "bg-card hover:bg-accent/5"
              )}
            >
              {image ? (
                  <div className="relative w-full h-full">
                      <Image 
                        src={image} 
                        alt="Selected Image" 
                        fill 
                        className="object-cover" 
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <RefreshCw className="text-white h-8 w-8 animate-spin-slow" />
                      </div>
                  </div>
              ) : (
                  <>
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="text-primary h-7 w-7" />
                      </div>
                      <span className="text-foreground font-bold text-sm">اضغط لاختيار صورة</span>
                      <span className="text-muted-foreground text-[10px] mt-1">PNG, JPG حتى 5 ميجابايت</span>
                  </>
              )}
              <input 
                id="image-upload"
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="sr-only" 
                aria-hidden="true"
              />
            </motion.div>
          </label>

          {/* Transformation Mode Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <label className="text-xs font-black text-foreground flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-primary" />
                    نوع المهمة (Task Type)
                </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'analysis', label: 'تحليل واستخراج وصف', info: 'وصف كامل للصورة والمكان' },
                    { id: 'reproduction', label: 'إعادة تصميم بنفس الجودة', info: 'وصف يهدف لإعادة إنتاج نفس الصورة' },
                    { id: 'logo_swap', label: 'تغيير الشعار / النص', info: 'تغيير الاسم أو الشعار داخل الصورة' },
                    { id: 'ad_swap', label: 'تغيير الإعلان', info: 'تغيير الإعلان أو العلامة التجارية' },
                ].map((mode) => (
                    <button
                        key={mode.id}
                        onClick={() => setActiveMode(mode.id)}
                        className={cn(
                            "p-3 rounded-2xl text-start transition-all border flex flex-col gap-1",
                            activeMode === mode.id 
                                ? "bg-primary/5 border-primary ring-1 ring-primary shadow-sm" 
                                : "bg-card text-muted-foreground border-border hover:bg-accent/5"
                        )}
                    >
                        <span className={cn(
                            "text-[10px] font-black",
                            activeMode === mode.id ? "text-primary" : "text-foreground"
                        )}>{mode.label}</span>
                        <span className="text-[8px] opacity-70 leading-tight">{mode.info}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Dynamic Inputs Based on Mode */}
          <AnimatePresence mode="wait">
            {activeMode === 'logo_swap' && (
                <motion.div 
                    key="logo"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                >
                    <div className="px-2">
                        <label className="text-[10px] font-black text-foreground">الاسم أو النص الجديد</label>
                    </div>
                    <input 
                        type="text"
                        value={targetText}
                        onChange={(e) => setTargetText(e.target.value)}
                        placeholder="اكتب اسمك أو الاسم الذي تريد ظهوره..."
                        className="w-full p-4 bg-card border border-border rounded-xl text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                </motion.div>
            )}

            {activeMode === 'ad_swap' && (
                <motion.div 
                    key="ad"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                >
                    <div className="px-2">
                        <label className="text-[10px] font-black text-foreground">العلامة التجارية (اختياري)</label>
                    </div>
                    <input 
                        type="text"
                        value={targetText}
                        onChange={(e) => setTargetText(e.target.value)}
                        placeholder="اسم البراند أو العلامة..."
                        className="w-full p-4 bg-card border border-border rounded-xl text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                </motion.div>
            )}

            {activeMode === 'analysis' && (
                <motion.div 
                    key="remix"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                >
                    <div className="flex items-center justify-between px-2">
                        <label className="text-xs font-black text-foreground flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-primary" />
                            تحويل الفكرة (Remix)
                        </label>
                        <div className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-md font-bold">اختياري</div>
                    </div>
                    <textarea 
                        value={newIdea}
                        onChange={(e) => setNewIdea(e.target.value)}
                        placeholder="مثلاً: قفز مظلي، رائد فضاء... (سيتم استخدام الـ API لتحليل الستايل وتطبيق فكرتك عليه)"
                        className="w-full h-24 p-4 bg-card border border-border rounded-2xl text-xs resize-none focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all"
                    />
                </motion.div>
            )}
          </AnimatePresence>

          {/* Style Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <label className="text-xs font-black text-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    النمط الفني (Art Style)
                </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                    { id: 'default', label: 'افتراضي من الصورة' },
                    { id: 'cinematic', label: 'سينمائي' },
                    { id: 'anime', label: 'أنيمي' },
                    { id: '3d-render', label: 'ثلاثي الأبعاد' },
                    { id: 'oil-painting', label: 'رسم زيتي' },
                    { id: 'hyper-realistic', label: 'واقعي جداً' },
                    { id: 'neon-cyberpunk', label: 'نيون / سايبربانك' },
                    { id: 'digital-art', label: 'فن رقمي' },
                ].map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                            "py-2 px-1 rounded-xl text-[9px] font-bold transition-all border",
                            selectedStyle === style.id 
                                ? "bg-primary text-white border-primary shadow-md shadow-primary/10 scale-[1.02]" 
                                : "bg-card text-muted-foreground border-border hover:bg-accent/5"
                        )}
                    >
                        {style.label}
                    </button>
                ))}
            </div>
          </div>

          {/* Aspect Ratio Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
                <label className="text-xs font-black text-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    مقاس الصورة (Aspect Ratio)
                </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {['1:1', '16:9', '9:16'].map((ratio) => (
                    <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={cn(
                            "py-2 rounded-xl text-[10px] font-bold transition-all border",
                            aspectRatio === ratio 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                                : "bg-card text-muted-foreground border-border hover:bg-accent/5"
                        )}
                    >
                        {ratio === '1:1' && 'مربع (1:1)'}
                        {ratio === '16:9' && 'عرضي (16:9)'}
                        {ratio === '9:16' && 'طولي (9:16)'}
                    </button>
                ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={generatePrompt}
            disabled={!image || isGenerating}
            className={cn(
                "w-full h-14 rounded-[1.5rem] font-black text-base shadow-xl transition-all flex items-center justify-center gap-2",
                !image || isGenerating 
                    ? "bg-muted text-muted-foreground cursor-not-allowed" 
                    : "text-white hover:scale-[1.01] active:scale-95 shadow-primary/20"
            )}
            style={{ 
                background: (!image || isGenerating) ? undefined : 'var(--primary-gradient)' 
            }}
          >
            {isGenerating ? (
                <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>جاري التحليل عبر الـ API...</span>
                </>
            ) : (
                <>
                    <Zap className="h-5 w-5 fill-white" />
                    <span>{newIdea.trim() !== '' ? 'توليد الفكرة الجديدة بنفس الستايل' : 'ابدأ التحليل الآن'}</span>
                </>
            )}
          </button>

          {/* Result Area */}
          <AnimatePresence>
            {prompt && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4"
                >
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">النتيجة (Prompt)</span>
                        </div>
                        <button 
                            onClick={copyToClipboard}
                            className="bg-accent hover:bg-accent/80 p-2 rounded-xl transition-colors flex items-center gap-2"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            <span className="text-xs font-bold">{copied ? "تم النسخ" : "نسخ النص"}</span>
                        </button>
                    </div>

                    <div className="bg-card p-6 rounded-[2rem] border border-border shadow-sm min-h-[150px] relative">
                        <p className="text-foreground leading-relaxed font-sans text-sm md:text-base select-all">
                            {prompt}
                        </p>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Error Dialog */}
        <AnimatePresence>
          {isErrorDialogOpen && errorInfo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsErrorDialogOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="h-2 w-full bg-gradient-to-r from-primary via-orange-500 to-red-500" />
                <div className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto text-red-500 shadow-inner">
                    <AlertCircle className="h-10 w-10" strokeWidth={2.5} />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900">{errorInfo.title}</h3>
                    <p className="text-sm text-gray-500 font-bold leading-relaxed px-2">
                      {errorInfo.message}
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsErrorDialogOpen(false);
                        setShowKeyInput(true);
                      }}
                      className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      تعديل مفتاح API
                    </button>
                    <button
                        onClick={() => setIsErrorDialogOpen(false)}
                        className="w-full mt-2 py-2 text-xs font-bold text-muted-foreground"
                    >
                        إغلاق
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </ApiKeyGate>
      </main>
    </div>
  );
}
