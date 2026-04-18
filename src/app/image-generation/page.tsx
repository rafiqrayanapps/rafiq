'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Image as ImageIcon, Zap, Download, RefreshCw, Key, Settings2, Info, Rocket, Palette, Edit3, Wand2, AlertCircle, Share2, Copy } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import { GoogleGenAI } from "@google/genai";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import useLocalStorage from '@/hooks/use-local-storage';

export default function ImageGenerationPage() {
  const [prompt, setPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{title: string, message: string} | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('cinematic');
  const [userApiKey, setUserApiKey] = useLocalStorage<string>('user-gemini-api-key', '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  
  const { toast } = useToast();

  // Initialize showKeyInput based on whether a key exists
  useEffect(() => {
    if (!userApiKey) {
      setShowKeyInput(true);
    }
  }, [userApiKey]);

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "الوصف مطلوب",
        description: "يرجى كتابة وصف للصورة التي ترغب في توليدها.",
        variant: "destructive",
      });
      return;
    }

    if (!userApiKey || userApiKey.trim() === '') {
      toast({
        title: "مفتاح API مطلوب",
        description: "يرجى إدخال مفتاح Gemini API الخاص بك للمتابعة. لا يمكن استخدام الميزة بدون مفتاحك الخاص.",
        variant: "destructive",
      });
      setShowKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setErrorInfo(null);

    try {
      const ai = new GoogleGenAI({ apiKey: userApiKey });
      
      const stylePrompts: Record<string, string> = {
        'cinematic': 'PRO PHOTOGRAPHY STYLE: Professional cinematic film still, shot on 35mm lens, blockbuster movie lighting, high contrast, dramatic shadows, realistic textures, volumetric lighting. MANDATORY: The resulting image MUST be a realistic cinematic photo, ignore any conflicting style requests in the subject text.',
        'anime': 'ANIME STYLE: High-quality modern anime illustration, Studio Ghibli vibes, hand-drawn aesthetic, vibrant colors, clean line art. MANDATORY: The resulting image MUST be an anime illustration, ignore any conflicting style requests in the subject text.',
        '3d-render': '3D RENDER STYLE: Hyper-detailed 3D octane render, Raytraced, Unreal Engine 5 aesthetic, plastic and metallic textures, ambient occlusion. MANDATORY: The resulting image MUST be a 3D digital render.',
        'oil-painting': 'OIL PAINTING STYLE: Classical oil on canvas, heavy impasto brushstrokes, artistic textures, fine art masterpiece. MANDATORY: The resulting image MUST be a traditional oil painting.',
        'hyper-realistic': 'PHOTOREALISM: Hyper-realistic 8k photography, sharp focus, macro details, national geographic style, natural materials. MANDATORY: The resulting image MUST be a real-world photograph.',
        'neon-cyberpunk': 'CYBERPUNK STYLE: Neon-drenched futuristic aesthetic, synthwave colors, rainy night city, bioluminescence, glowing accents. MANDATORY: The resulting image MUST be in a neon cyberpunk style.',
        'digital-art': 'DIGITAL ART STYLE: Highly polished digital illustration, smooth shading, professional concept art, fantasy aesthetic. MANDATORY: The resulting image MUST be a digital painting.',
        'minimalist': 'MINIMALIST STYLE: Clean flat design, pastel color palette, simple geometric shapes, high negative space, elegant composition. MANDATORY: The resulting image MUST be a minimalist graphic.',
      };

      const finalPrompt = `
        IMAGE STYLE INSTRUCTION: ${stylePrompts[selectedStyle] || 'Natural artistic style'}.
        IMAGE SUBJECT: ${prompt}.
        STRICT REQUIREMENT: Strictly follow the IMAGE STYLE INSTRUCTION. If the IMAGE SUBJECT text contains style-related keywords (like "anime", "cartoon", "drawing") that conflict with the chosen ${selectedStyle} style, you MUST IGNORE those subject keywords and apply the ${selectedStyle} style to the core subject entities.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: "1K"
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
        errorMsg = "يبدو أن مفتاح API الذي أدخلته غير صحيح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio ومحاولة إدخاله مرة أخرى. 😊";
        setShowKeyInput(true);
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

    if (!userApiKey || userApiKey.trim() === '') {
      toast({
        title: "مفتاح API مطلوب",
        description: "يرجى إدخال مفتاح Gemini API الخاص بك للمتابعة.",
        variant: "destructive",
      });
      setShowKeyInput(true);
      return;
    }

    setIsEditing(true);
    setErrorInfo(null);

    try {
      const ai = new GoogleGenAI({ apiKey: userApiKey });
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
        model: "gemini-3.1-flash-image-preview",
        contents: { parts: [imagePart, textPart] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: "1K"
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
      let errorMsg = "تعذر تعديل الصورة. يرجى التحقق من المفتاح أو المحاولة لاحقاً. 😊";

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
        <header className="text-center space-y-3">
            <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tight">توليد الصور</h1>
            <div className="inline-flex bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                <p className="text-[#64748B] text-[11px] font-bold">حوّل خيالاتك إلى واقع بصري مذهل</p>
            </div>
        </header>

        {/* API Key Settings Toggle - Redesigned to match Notification Card */}
        <div className="bg-white border border-blue-100 rounded-[2.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <button 
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="w-full px-6 py-5 flex items-center justify-between transition-colors hover:bg-blue-50/50"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#6366F1] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Settings2 className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                        <h4 className="text-sm font-black text-[#1A1C1E]">إعدادات المفتاح</h4>
                        <p className="text-[10px] text-gray-400 font-bold">إدارة مفتاح Gemini API الخاص بك</p>
                    </div>
                </div>
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    userApiKey ? "bg-green-50 text-green-500 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"
                )}>
                    {userApiKey ? "نشط" : "مطلوب"}
                </div>
            </button>
            
            <AnimatePresence>
                {showKeyInput && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#FBFCFF] border-t border-blue-50"
                    >
                        <div className="p-6 space-y-4">
                            <div className="relative group">
                                <Key className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="password"
                                    value={userApiKey}
                                    onChange={(e) => setUserApiKey(e.target.value)}
                                    placeholder="AI-XXXX-XXXX-XXXX"
                                    className="w-full pr-12 pl-4 py-3.5 bg-white border border-blue-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50 flex gap-3">
                                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[#1A1C1E]">كيفية الحصول على المفتاح؟</p>
                                    <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                                        توجه إلى Google AI Studio وأنشئ مفتاح API يدعم طرازات Gemini 1.5 أو 2.0. الميزة تتطلب صلاحيات توليد الصور.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

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
                        <div className={cn(
                            "w-full relative group transition-all",
                            aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'
                        )}>
                            <Image 
                                src={generatedImage} 
                                alt="Generated Image" 
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                            />
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center text-white space-y-4">
                                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span className="font-black text-sm tracking-widest">جاري التحديث...</span>
                                </div>
                            )}
                        </div>

                        {/* Image Actions Bar */}
                        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-blue-50 flex items-center justify-center gap-4">
                            <button 
                                onClick={downloadImage}
                                className="flex-1 max-w-[140px] flex items-center justify-center gap-2 bg-[#F8FAFF] text-[#64748B] py-3.5 rounded-2xl text-[10px] font-black hover:bg-blue-50 transition-colors border border-blue-100 shadow-sm"
                            >
                                <Download className="h-4 w-4" />
                                <span>حفظ الصورة</span>
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
                      setShowKeyInput(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    تعديل مفتاح API
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
    </div>
  );
}
