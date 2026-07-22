'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Image as ImageIcon, Zap, Download, RefreshCw, Key, Settings2, Info, Rocket, Palette, Edit3, Wand2, AlertCircle, Share2, Copy, Check, User, X } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useToolConfig } from '@/hooks/useToolConfig';
import ToolGate from '@/components/ToolGate';
import { useUsageLimit } from '@/hooks/useUsageLimit';

export default function ImageGenerationPage() {
  const [prompt, setPrompt] = useState<string>('');
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{title: string, message: string} | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [qualityMode, setQualityMode] = useState<'standard' | 'ultra' | 'imagen4'>('standard');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const personFileInputRef = useRef<HTMLInputElement>(null);
  const { config, loading: configLoading } = useToolConfig();
  const { checkLimit, incrementUsage, limits } = useUsageLimit();
  
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
      setHasApiKey(true);
    }

    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success as per skill instructions
      setHasApiKey(true);
      setQualityMode('ultra');
      toast({
        title: "تم اختيار المفتاح",
        description: "يمكنك الآن استهلاك جودة Ultra المتقدمة.",
      });
    } else {
      setShowSettings(true);
    }
  };

  const saveCustomKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('user_gemini_api_key', key);
      setHasApiKey(true);
      toast({
        title: "تم حفظ المفتاح",
        description: "سيتم استخدام مفتاحك الخاص في عمليات التوليد.",
      });
    } else {
      localStorage.removeItem('user_gemini_api_key');
      setHasApiKey(false);
      toast({
        title: "تم إزالة المفتاح",
        description: "سيتم العودة لاستخدام المفتاح الافتراضي.",
      });
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "الوصف مطلوب",
        description: "يرجى كتابة وصف للصورة التي ترغب في توليدها.",
        variant: "destructive",
      });
      return;
    }

    if (!config.imageGenId && qualityMode !== 'imagen4') {
      toast({
        title: "الأداة غير مفعلة",
        description: "يرجى الانتظار لحين تفعيل هذه الأداة من قبل الإدارة.",
        variant: "destructive",
      });
      return;
    }

    if (!checkLimit('imageGen')) {
      setErrorInfo({
        title: "وصلت للحد اليومي",
        message: "لقد استنفدت محاولاتك الـ 10 لهذا اليوم في توليد الصور. يتم التجديد تلقائياً كل يوم جديد. 😊"
      });
      setIsErrorDialogOpen(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setErrorInfo(null);

    try {
      if (qualityMode === 'imagen4') {
        // Use Cloudflare Imagen-4 API Route
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'فشل توليد الصورة عبر Imagen-4');
        }

        if (data.image) {
          setGeneratedImage(data.image);
          await incrementUsage('imageGen');
        } else {
          throw new Error("لم يتم تلقي صورة من خوادم Imagen-4");
        }
        return;
      }

      // Logic for selecting model and API key (Gemini):
      const usePremium = qualityMode === 'ultra' && hasApiKey;
      const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || config.imageGenId;
      const modelName = (usePremium || customApiKey) ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

      if (!apiKey) {
        throw new Error("Authentication error: Gemini API key is missing. Please provide a custom API key in settings.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      
      const stylePrompts: Record<string, string> = {
        'cinematic': 'CINEMATIC PHOTOGRAPHY: Professional film still, shot on 35mm lens, blockbuster lighting, realistic textures.',
        'anime': 'ANIME ILLUSTRATION: High-quality modern anime, hand-drawn aesthetic, vibrant colors, clean line art.',
        '3d-render': '3D DIGITAL RENDER: Hyper-detailed octane render, Raytraced, Unreal Engine 5 aesthetic, plastic and metallic textures.',
        'oil-painting': 'TRADITIONAL OIL PAINTING: Classical canvas, heavy impasto brushstrokes, fine art masterpiece.',
        'hyper-realistic': 'HYPER-REALISTIC PHOTOGRAPHY: 8k sharp focus, macro details, national geographic style.',
        'neon-cyberpunk': 'CYBERPUNK NEON: Futuristic aesthetic, synthwave colors, rainy night city, glowing bioluminescence.',
        'digital-art': 'PROFESSIONAL DIGITAL ART: Polished illustration, smooth shading, concept art style.',
        'minimalist': 'MINIMALIST GRAPHIC: Clean flat design, pastel palette, simple geometric shapes, elegant composition.',
      };

      let finalPrompt = "";
      
      if (styleImage && personImage) {
        finalPrompt = `
          IMAGE GENERATION REQUEST: IDENTITY SWAP.
          
          I have provided two reference images:
          1. [STYLE_REFERENCE]: This image shows the background, lighting, artistic style, and clothing.
          2. [IDENTITY_REFERENCE]: This image shows the EXACT PERSON (identity and face) who must be the subject.
          
          TASK: Create a single image that realistically places the person from [IDENTITY_REFERENCE] into the environment and clothing of [STYLE_REFERENCE].
          
          REQUIREMENTS:
          - The face and identity MUST be matching the person in Image 2.
          - The style, environment, and clothes MUST come from Image 1.
          - Render this in the ${selectedStyle} style.
          - Prompt context: ${prompt}.
          - MANDATORY: Do not use the face from the first image.
        `;
      } else if (styleImage) {
        finalPrompt = `
          IMAGE GENERATION REQUEST: STYLE REFERENCE.
          
          I have provided a [STYLE_REFERENCE] image. Use its colors, composition, and aesthetic as a very strong guide.
          
          TASK: Generate a new image with this subject: ${prompt}.
          STYLE: ${stylePrompts[selectedStyle] || 'Natural artistic style'}.
          GUIDE: Follow the provided image's style and mood.
        `;
      } else if (personImage) {
        finalPrompt = `
          IMAGE GENERATION REQUEST: IDENTITY REFERENCE.
          
          I have provided an [IDENTITY_REFERENCE] image of a person. 
          
          TASK: Generate a new image featuring this EXACT person in the following situation: ${prompt}.
          STYLE: ${stylePrompts[selectedStyle] || 'Natural artistic style'}.
          GUIDE: Maintain the face, identity, and features of the person from the provided image.
        `;
      } else {
        finalPrompt = `
          IMAGE GENERATION REQUEST.
          SUBJECT: ${prompt}.
          STYLE: ${stylePrompts[selectedStyle] || 'Natural artistic style'}.
        `;
      }

      const contents: any[] = [{ 
        role: "user", 
        parts: [
          { text: finalPrompt },
          ...(styleImage ? [
            { text: "IMAGE 1 [STYLE_REFERENCE]:" },
            { 
              inlineData: { 
                mimeType: styleImage.split(';')[0].split(':')[1], 
                data: styleImage.split(',')[1] 
              } 
            }
          ] : []),
          ...(personImage ? [
            { text: "IMAGE 2 [IDENTITY_REFERENCE]:" },
            { 
              inlineData: { 
                mimeType: personImage.split(';')[0].split(':')[1], 
                data: personImage.split(',')[1] 
              } 
            }
          ] : [])
        ] 
      }];

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            ...(usePremium ? { imageSize: "1K" } : {})
          }
        }
      });

      // Find the image part in the response candidates
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
        setGeneratedImage(foundImage);
        await incrementUsage('imageGen');
      } else {
        throw new Error("لم يتم العثور على صورة في استجابة الذكاء الاصطناعي.");
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      let title = "خطأ في التوليد";
      let errorMsg = "حدث خطأ غير متوقع. يرجى التأكد من اتصالك بالإنترنت وإعادة المحاولة. 😊";
      
      const errorMessage = error?.message || "";
      
      if (errorMessage.includes('API key not valid')) {
        title = "المفتاح غير صالح 🔑";
        errorMsg = "يبدو أن مفتاح API الذي أدخلته غير صحيح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio ومحاولة تحديثه في الإعدادات. 😊";
      } else if (errorMessage.includes('quota') || errorMessage.includes('Resource has been exhausted') || error?.status === 429 || errorMessage.includes('permission denied') || error?.status === 403) {
        title = "نفدت النقاط اليومية ⏳";
        errorMsg = "لقد نفدت النقاط الخاصة بك لهذا اليوم. يرجى المحاولة مجدداً لاحقاً أو استخدام مفتاح API جديد. 😊";
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

  const editImage = async () => {
    if (!editPrompt.trim() || !generatedImage) return;

    if (!config.imageGenId) {
      toast({
        title: "الأداة غير مفعلة",
        description: "يرجى الانتظار لحين تفعيل هذه الأداة من قبل الإدارة.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    setErrorInfo(null);

    try {
      const usePremium = qualityMode === 'ultra' && hasApiKey;
      const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || config.imageGenId;
      const modelName = (usePremium || customApiKey) ? "gemini-3.1-flash-image-preview" : "gemini-2.5-flash-image";

      if (!apiKey) {
        throw new Error("Authentication error: Gemini API key is missing.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const base64Data = generatedImage.split(',')[1];
      const mimeType = generatedImage.split(';')[0].split(':')[1];

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };

      const textPart = {
        text: `Image Editing Task:
               Original Concept: "${prompt}"
               Modification Request: "${editPrompt}"
               Style: "${selectedStyle}"
               Requirement: Generate a NEW image based on the Modification Request while strictly maintaining the aesthetic and style of the provided image.`,
      };

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: [imagePart, textPart] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            ...(usePremium ? { imageSize: "1K" } : {})
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
        setGeneratedImage(foundImage);
        setEditPrompt('');
        toast({
          title: "تم التعديل بنجاح",
          description: "تم تحديث الصورة بناءً على طلبك.",
        });
      }
    } catch (error: any) {
      console.error('Error editing image:', error);
      let title = "خطأ في التعديل";
      let errorMsg = "تعذر تعديل الصورة. يرجى التحقق من الإعدادات أو المحاولة لاحقاً. 😊";

      if (error?.message?.includes('quota') || error?.status === 429 || error?.message?.includes('permission denied') || error?.status === 403) {
        title = "نفدت النقاط اليومية ⏳";
        errorMsg = "لقد نفدت النقاط الخاصة بك لهذا اليوم. حاول مجدداً لاحقاً. 😊";
      }

      setErrorInfo({ title, message: errorMsg });
      setIsErrorDialogOpen(true);

      toast({
        title,
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleStyleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStyleImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeStyleImage = () => {
    setStyleImage(null);
  };

  const removePersonImage = () => {
    setPersonImage(null);
  };

  const applyQuickAction = (type: 'swap' | 'colors') => {
    if (type === 'swap') {
      setPrompt("قم بدمج ملامح الشخص في الصورة الثانية مع النمط والجو العام للصورة الأولى بشكل احترافي.");
      toast({ title: "تم تطبيق الاقتراح", description: "سيتم دمج هويتك مع النمط المرفوع." });
    } else if (type === 'colors') {
      setPrompt("أعد تصميم المشهد في الصورة الأولى بشكل جديد تماماً مع الحفاظ على نفس لوحة الألوان والإضاءة الأصلية.");
      toast({ title: "تم تطبيق الاقتراح", description: "سيتم الحفاظ على تناسق الألوان المرفوع." });
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `rafiq-gen-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "تم التحميل",
        description: "بدأ تحميل الصورة إلى جهازك.",
      });
    }
  };

  return (
    <div className="flex flex-col bg-[#F8FAFF] min-h-screen">
      <Header title="توليد الصور الذكي" showBackButton compact />
      
      <main className="flex-1 px-6 pb-32 pt-8 container max-w-2xl mx-auto space-y-8">
        <ToolGate 
          toolIdKey="imageGenId"
          title="توليد الصور بالذكاء الاصطناعي"
          description="حول كلماتك إلى صور مذهلة باستخدام أقوى نماذج الذكاء الاصطناعي من Google."
        >
            {/* Usage Badge */}
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-full border border-blue-100 shadow-sm text-gray-400 hover:text-primary transition-colors"
                title="إعدادات المفتاح"
              >
                <Settings2 size={16} />
              </button>
              <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-100 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-gray-500">
                  الاستخدام اليومي: {limits.imageGen} / 10
                </span>
              </div>
            </div>

            {/* API Key settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Key size={16} />
                      <span className="text-xs font-black">مفتاح API الخاص بك (Gemini)</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="password"
                        value={customApiKey}
                        onChange={(e) => saveCustomKey(e.target.value)}
                        placeholder="أدخل مفتاح Gemini API هنا..."
                        className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                      * باستخدام مفتاحك الخاص، يمكنك تجاوز الحدود اليومية واستخدام نماذج أكثر تطوراً. يتم حفظ المفتاح محلياً على جهازك فقط.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <header className="text-center space-y-3">
            <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight">توليد الصور</h1>
            <div className="inline-flex bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                <p className="text-[#64748B] text-[11px] font-bold">حوّل خيالاتك إلى واقع بصري مذهل</p>
            </div>
          </header>

        <div className="space-y-6">
          {/* Prompt Input Card */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <Rocket className="h-4 w-4" />
                </div>
                <label className="text-sm font-black text-[#1A1C1E]">
                    صف فكرتك
                </label>
            </div>
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="مثلاً: مدينة مستقبلية تحت الماء بأسلوب السايبربانك..."
                className="w-full h-36 p-5 bg-[#F9FBFF] border border-blue-50 rounded-2xl text-xs font-bold leading-relaxed resize-none focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-300"
            />

            {/* Quick Suggestions based on uploads */}
            {(styleImage || personImage) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {styleImage && personImage && (
                  <button 
                    onClick={() => applyQuickAction('swap')}
                    className="px-3 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black hover:bg-primary/10 transition-all flex items-center gap-2 border border-primary/10"
                  >
                    <User size={12} />
                    <span>وجهي في النمط</span>
                  </button>
                )}
                {styleImage && (
                  <button 
                    onClick={() => applyQuickAction('colors')}
                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100"
                  >
                    <Palette size={12} />
                    <span>تصميم بأسلوب الألوان</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Dual Image Attachment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Style Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">صورة النمط (Style)</span>
                  {styleImage && (
                    <button onClick={removeStyleImage} className="text-[10px] font-black text-red-500 hover:opacity-70">
                      حذف
                    </button>
                  )}
                </div>
                {!styleImage ? (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] border-2 border-dashed border-blue-50 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Palette size={16} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400">ارفع النمط المطلوب</span>
                  </button>
                ) : (
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-blue-100 bg-gray-50">
                    <Image src={styleImage} alt="Style" fill className="object-cover" unoptimized />
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleStyleImageUpload} accept="image/*" className="hidden" />
              </div>

              {/* Person Image */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">صورة الشخص (Person)</span>
                  {personImage && (
                    <button onClick={removePersonImage} className="text-[10px] font-black text-red-500 hover:opacity-70">
                      حذف
                    </button>
                  )}
                </div>
                {!personImage ? (
                  <button 
                    onClick={() => personFileInputRef.current?.click()}
                    className="w-full aspect-[4/3] border-2 border-dashed border-blue-50 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                      <User size={16} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400">ارفع صورة الشخص</span>
                  </button>
                ) : (
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-blue-100 bg-gray-50">
                    <Image src={personImage} alt="Person" fill className="object-cover" unoptimized />
                  </div>
                )}
                <input type="file" ref={personFileInputRef} onChange={handlePersonImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>
          </div>

          {/* Quality Mode */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <label className="text-sm font-black text-[#1A1C1E]">
                        جودة ونموذج الصور
                    </label>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setQualityMode('standard')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black transition-all",
                      qualityMode === 'standard' ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    Standard
                  </button>
                  <button 
                    onClick={() => {
                      if (!hasApiKey) {
                        handleOpenSelectKey();
                      } else {
                        setQualityMode('ultra');
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1",
                      qualityMode === 'ultra' ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    Ultra {qualityMode === 'ultra' && <Check className="h-3 w-3" />}
                  </button>
                  <button 
                    onClick={() => setQualityMode('imagen4')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1",
                      qualityMode === 'imagen4' ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    Imagen-4 {qualityMode === 'imagen4' && <Check className="h-3 w-3" />}
                  </button>
                </div>
            </div>
            {qualityMode === 'ultra' && !hasApiKey && (
              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-xl border border-amber-100">
                ⚠️ جودة Ultra تتطلب ربط مفتاح API مدفوع خاص بك.
              </p>
            )}
            {qualityMode === 'ultra' && hasApiKey && (
              <p className="text-[10px] text-green-600 font-bold bg-green-50 p-3 rounded-xl border border-green-100">
                ✨ جودة Ultra مفعلة عبر مفتاحك الخاص (Gemini 3.1 Preview).
              </p>
            )}
            {qualityMode === 'imagen4' && (
              <p className="text-[10px] text-indigo-600 font-bold bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                🚀 نموذج Imagen-4 (Beta): يتميز بدقة عالية في تنفيذ التفاصيل المعقدة والنصوص.
              </p>
            )}
          </div>
          
          {/* Style Selection - Horizontal Scrollable or Grid capsules */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                    <Palette className="h-4 w-4" />
                </div>
                <label className="text-sm font-black text-[#1A1C1E]">
                    النمط الفني
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-2">
                {[
                    { id: 'cinematic', label: 'سينمائي' },
                    { id: 'anime', label: 'أنيمي' },
                    { id: '3d-render', label: 'ثلاثي الأبعاد' },
                    { id: 'oil-painting', label: 'رسم زيتي' },
                    { id: 'hyper-realistic', label: 'واقعي جداً' },
                    { id: 'neon-cyberpunk', label: 'نيون / سايبر' },
                    { id: 'digital-art', label: 'فن رقمي' },
                    { id: 'minimalist', label: 'بسيط' },
                ].map((style) => (
                    <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                            "py-3 px-2 rounded-2xl text-[10px] font-black transition-all border",
                            selectedStyle === style.id 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                                : "bg-[#F9FBFF] text-gray-500 border-blue-50 hover:bg-blue-50"
                        )}
                    >
                        {style.label}
                    </button>
                ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <ImageIcon className="h-4 w-4" />
                </div>
                <label className="text-sm font-black text-[#1A1C1E]">
                    مقاس الصورة
                </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: '1:1', label: '1:1', sub: 'مربع' },
                    { id: '16:9', label: '16:9', sub: 'عرضي' },
                    { id: '9:16', label: '9:16', sub: 'طولي' }
                ].map((ratio) => (
                    <button
                        key={ratio.id}
                        onClick={() => setAspectRatio(ratio.id)}
                        className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-3xl border transition-all",
                            aspectRatio === ratio.id 
                                ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" 
                                : "bg-[#F9FBFF] border-blue-50 text-gray-400 hover:bg-blue-50"
                        )}
                    >
                        <span className="text-xs font-black">{ratio.label}</span>
                        <span className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">{ratio.sub}</span>
                    </button>
                ))}
            </div>
          </div>

          {/* Central Action Button */}
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || isGenerating}
            className={cn(
                "w-full h-16 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl overflow-hidden relative group",
                !prompt.trim() || isGenerating 
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                    : "text-white active:scale-95 shadow-primary/30"
            )}
          >
            {(!prompt.trim() || isGenerating) ? null : (
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-indigo-600 to-primary group-hover:scale-110 transition-transform duration-500" />
            )}
            <div className="relative flex items-center gap-3">
                {isGenerating ? (
                    <>
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span>جاري التشكيل...</span>
                    </>
                ) : (
                    <>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Zap className="h-4 w-4 fill-white" />
                        </div>
                        <span>ابدأ التوليد الآن</span>
                    </>
                )}
            </div>
          </button>

          {/* Result Area */}
          <AnimatePresence>
            {generatedImage && (
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    className="space-y-6 pt-4"
                >
                    <div className="bg-white rounded-[3.5rem] border border-blue-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden relative">
                        <div 
                            className={cn(
                                "w-full relative group transition-all cursor-pointer bg-slate-900/5",
                                aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'
                            )}
                            onClick={() => setShowFullPreview(true)}
                        >
                            <Image 
                                src={generatedImage} 
                                alt="Generated Image" 
                                fill
                                unoptimized
                                className="object-cover"
                                referrerPolicy="no-referrer"
                            />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4 z-10">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span className="font-black text-sm tracking-widest">جاري التحديث...</span>
                                </div>
                            )}
                        </div>

                        {/* Image Actions Bar */}
                        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-blue-50 flex flex-wrap items-center justify-center gap-3">
                            <button 
                                onClick={downloadImage}
                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-[#F8FAFF] text-[#64748B] py-3.5 rounded-2xl text-[10px] font-black hover:bg-blue-50 transition-colors border border-blue-100 shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                <span>تحميل الصورة</span>
                            </button>
                            
                            <button 
                                onClick={generateImage}
                                disabled={isGenerating}
                                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-primary/10 text-primary py-3.5 rounded-2xl text-[10px] font-black hover:bg-primary/20 transition-colors border border-primary/20 shadow-sm"
                            >
                                <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                                <span>توليد مرة أخرى</span>
                            </button>

                            <button 
                                className="w-12 h-12 flex items-center justify-center bg-[#F8FAFF] text-[#64748B] rounded-2xl border border-blue-100 hover:bg-blue-50 transition-colors"
                            >
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Image Editing Input - Redesigned like the notification card bottom input */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[3rem] border border-blue-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] space-y-6"
                    >
                        <div className="flex items-center gap-4 text-primary">
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                                <Edit3 className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-black text-[#1A1C1E]">لمساتك الإضافية</span>
                        </div>
                        <div className="relative">
                            <textarea 
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="اكتب تعديلك هنا (مثلاً: غير لون البحر، أضف طيراً...)"
                                className="w-full h-28 p-6 bg-[#F9FBFF] border border-blue-50 rounded-3xl text-sm font-bold leading-loose resize-none focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-300"
                            />
                            <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                <button 
                                    onClick={editImage}
                                    disabled={!editPrompt.trim() || isEditing}
                                    className={cn(
                                        "flex-1 h-12 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg",
                                        !editPrompt.trim() || isEditing 
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                                            : "bg-primary text-white hover:scale-[1.02] shadow-primary/20"
                                    )}
                                >
                                    {isEditing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    <span>تطبيق التعديل الفوري</span>
                                </button>
                                <button className="w-12 h-12 bg-[#F9FBFF] border border-blue-50 rounded-2xl flex items-center justify-center text-gray-400">
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
        </ToolGate>
      </main>

      {/* Professional Error Dialog */}
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

                <div className="pt-2 space-y-3">
                  <button
                    onClick={() => {
                      setIsErrorDialogOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    إعادة المحاولة
                  </button>
                  <button
                    onClick={() => setIsErrorDialogOpen(false)}
                    className="w-full py-3 px-6 rounded-2xl bg-gray-50 text-gray-400 font-bold text-xs hover:bg-gray-100 transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full Image Preview Modal */}
      <AnimatePresence>
        {showFullPreview && generatedImage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full h-[90vh] flex items-center justify-center"
            >
              <Image
                src={generatedImage}
                alt="Full Preview"
                fill
                unoptimized
                className="object-contain"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setShowFullPreview(false)}
                className="absolute top-4 right-4 h-12 w-12 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md z-[130] transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
