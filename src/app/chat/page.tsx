'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Bot, User, Trash2, RefreshCw, AlertCircle, Sparkles, Wand2, Image as ImageIcon, X, Copy, Check, Settings2, Key } from 'lucide-react';
import Header from '@/components/Header';
import { GoogleGenAI } from "@google/genai";
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useToolConfig } from '@/hooks/useToolConfig';
import ToolGate from '@/components/ToolGate';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: (
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  )[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config, loading: configLoading } = useToolConfig();
  const { checkLimit, incrementUsage, limits } = useUsageLimit();
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{title: string, message: string} | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setCustomApiKey(savedKey);
    }
  }, []);

  const saveCustomKey = (key: string) => {
    setCustomApiKey(key);
    if (key) {
      localStorage.setItem('user_gemini_api_key', key);
      toast({
        title: "تم حفظ المفتاح",
        description: "سيتم استخدام مفتاح Gemini الخاص بك في الدردشة.",
      });
    } else {
      localStorage.removeItem('user_gemini_api_key');
      toast({
        title: "تم إزالة المفتاح",
        description: "سيتم العودة للمفتاح الافتراضي.",
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "الملف كبير جداً",
          description: "يرجى اختيار صورة بحجم أقل من 10 ميجابايت.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    if (!config.chatId) {
      toast({
        title: "الأداة غير مفعلة",
        description: "يرجى الانتظار لحين تفعيل هذه الأداة من قبل الإدارة.",
        variant: "destructive",
      });
      return;
    }

    if (!checkLimit('chat')) {
      setErrorInfo({
        title: "وصلت للحد اليومي",
        message: "لقد استنفدت محاولاتك الـ 10 لهذا اليوم. يتم التجديد تلقائياً كل يوم جديد. 😊"
      });
      setIsErrorDialogOpen(true);
      return;
    }

    const userMessage: Message = { 
      role: 'user', 
      parts: [] 
    };

    if (attachedImage) {
      const base64Data = attachedImage.split(',')[1];
      const mimeType = attachedImage.split(';')[0].split(':')[1];
      userMessage.parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    if (input.trim()) {
      userMessage.parts.push({ text: input });
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const apiKey = customApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || config.chatId;
      
      if (!apiKey) {
        throw new Error("Authentication error: Gemini API key is missing.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey as string });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMessage] as any,
      });

      const responseText = response.text || "عذراً، لم أستطع توليد رد في الوقت الحالي.";
      
      const botMessage: Message = { role: 'model', parts: [{ text: responseText }] };
      setMessages(prev => [...prev, botMessage]);
      
      // Increment usage count
      await incrementUsage('chat');

    } catch (error: any) {
      console.error('Chat error:', error);
      let title = "خطأ في الدردشة";
      let errorMsg = "حدث خطأ أثناء التواصل مع الذكاء الاصطناعي. يرجى المحاولة لاحقاً.";

      if (error?.message?.includes('API key not valid')) {
        title = "خلل في الإعدادات";
        errorMsg = "يبدو أن هناك خلل في إعدادات الأداة (ID غير صالح). يرجى إبلاغ الإدارة.";
      }

      setErrorInfo({ title, message: errorMsg });
      setIsErrorDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast({
      title: "تم المسح",
      description: "تم مسح سجل المحادثة بنجاح.",
    });
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص إلى الحافظة.",
    });
  };

  return (
    <div className="flex flex-col bg-[#FDFDFD] min-h-screen font-sans selection:bg-primary/10">
      <Header title="رفيق الذكاء الاصطناعي" showBackButton compact />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.4] pointer-events-none" />

        <ToolGate 
          toolIdKey="chatId"
          title="الدردشة الذكية"
          description="تحدث مع أقوى نماذج الذكاء الاصطناعي للحصول على مساعدة فورية."
        >
          <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white/70 backdrop-blur-md p-2 rounded-full border border-gray-100 shadow-sm text-gray-400 hover:text-primary transition-all"
              title="إعدادات المفتاح"
            >
              <Settings2 size={16} />
            </button>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2.5"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="text-[11px] font-semibold text-gray-400 tracking-tight">
                المحاولات المتاحة: {limits.chat} / 10
              </span>
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col container max-w-3xl mx-auto px-6 pb-40 pt-16 overflow-hidden relative z-10">
            {/* API Key settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Key size={16} />
                      <span className="text-xs font-black">مفتاح API الخاص بك (Gemini)</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="password"
                        value={customApiKey}
                        onChange={(e) => saveCustomKey(e.target.value)}
                        placeholder="أدخل مفتاح Gemini API هنا لضمان استمرارية الخدمة..."
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                      * باستخدام مفتاحك الخاص من Google AI Studio، تتجنب انقطاع الخدمة أو نفاذ المحاولات.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-10"
              >
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary relative border border-gray-50">
                    <Sparkles size={54} strokeWidth={1.5} className="relative z-10" />
                  </div>
                </div>
                
                <div className="space-y-4 max-w-md">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">مرحباً بك في رفيق</h2>
                  <p className="text-base text-gray-500 font-medium leading-relaxed">
                    مساعدك الشخصي المدعوم بالذكاء الاصطناعي. كيف يمكنني مساعدتك في يومك؟
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {[
                    { text: 'خطط لي رحلة سياحية', icon: <Wand2 size={14} /> },
                    { text: 'ساعدني في كتابة إيميل رسمي', icon: <MessageSquare size={14} /> },
                    { text: 'اشرح لي نظرية النسبية', icon: <Bot size={14} /> },
                    { text: 'اقترح لي وجبة عشاء', icon: <Sparkles size={14} /> }
                  ].map((item) => (
                    <button 
                      key={item.text}
                      onClick={() => setInput(item.text)}
                      className="group flex items-center justify-between p-4 bg-white/50 hover:bg-white border border-gray-100 hover:border-primary/20 rounded-2xl text-[13px] font-semibold text-gray-600 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <span>{item.text}</span>
                      <span className="text-gray-300 group-hover:text-primary transition-colors">{item.icon}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar pb-10">
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={cn(
                      "flex items-start gap-4",
                      msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center mt-1 shrink-0 shadow-sm border",
                      msg.role === 'user' ? "bg-white text-gray-400 border-gray-100" : "bg-primary text-white border-transparent"
                    )}>
                      {msg.role === 'user' ? <User size={18} /> : <Sparkles size={18} />}
                    </div>
                    
                    <div className={cn(
                      "max-w-[80%] space-y-2 group/msg",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      {msg.parts.some(p => 'inlineData' in p) && (
                        <div className="relative w-full max-w-[240px] aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                          {msg.parts.map((p, pIdx) => {
                            if ('inlineData' in p) {
                              return (
                                <Image 
                                  key={pIdx}
                                  src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`}
                                  alt="User attachment"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                      
                      {msg.parts.some(p => 'text' in p) && (
                        <div className="relative w-full">
                          <div className={cn(
                            "p-5 rounded-2xl text-[14px] leading-relaxed font-medium shadow-sm",
                            msg.role === 'user' 
                              ? "bg-white text-gray-800 rounded-tr-none border border-gray-100" 
                              : "bg-gray-50 text-gray-900 rounded-tl-none border border-transparent"
                          )}>
                            {msg.role === 'user' ? (
                              msg.parts.map((p, pIdx) => 'text' in p ? <p key={pIdx}>{p.text}</p> : null)
                            ) : (
                              <div className="markdown-content">
                                <ReactMarkdown>
                                  {msg.parts.reduce((acc, p) => 'text' in p ? acc + p.text : acc, '')}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => copyToClipboard(msg.parts.reduce((acc, p) => 'text' in p ? acc + p.text : acc, ''), idx)}
                            className={cn(
                              "absolute -bottom-2 opacity-0 group-hover/msg:opacity-100 transition-all p-1.5 rounded-lg bg-white shadow-md border border-gray-100 text-gray-400 hover:text-primary z-20",
                              msg.role === 'user' ? "left-0" : "right-0"
                            )}
                          >
                            {copiedId === idx ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-gray-300 font-semibold uppercase tracking-wider px-1">
                        {msg.role === 'user' ? 'أنت' : 'رفيق'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center mt-1">
                      <Sparkles size={18} className="animate-spin" />
                    </div>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-gray-50 border border-gray-100 flex items-center gap-3">
                       <div className="flex gap-1 justify-center">
                         <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                         <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                         <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                       </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-8 pt-0 z-30">
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#FDFDFD] via-[#FDFDFD]/90 to-transparent pointer-events-none" />
            
            <div className="container max-w-2xl mx-auto relative group">
              <div className="flex items-center gap-2 mb-2 px-6">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-300">البرومبيت</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              
              {attachedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-full left-6 mb-4 p-2 bg-white/90 backdrop-blur-xl rounded-[1.5rem] border border-white shadow-xl flex items-center gap-3 z-50 overflow-hidden"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-inner">
                    <Image src={attachedImage} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                  <button 
                    onClick={removeImage}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}

              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-2 pr-6 flex items-center gap-3 relative z-10 transition-all focus-within:shadow-primary/5 focus-within:border-primary/20">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-primary hover:bg-primary/5 transition-all"
                  title="إرفاق صورة"
                >
                  <ImageIcon size={18} />
                </button>

                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="اسأل رفيق عن أي شيء..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-300 py-3"
                />
                
                <div className="flex items-center gap-1.5">
                  {messages.length > 0 && (
                    <button 
                      onClick={clearChat}
                      className="w-11 h-11 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300"
                      title="مسح السجل"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  
                  <button 
                    onClick={handleSendMessage}
                    disabled={(!input.trim() && !attachedImage) || isLoading}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                      (!input.trim() && !attachedImage) || isLoading 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                    )}
                  >
                    <Send size={18} className={cn("transition-transform duration-300", isLoading ? "animate-pulse" : "rotate-180")} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ToolGate>
      </main>

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
                  <AlertCircle className="h-10 w-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900">{errorInfo.title}</h3>
                  <p className="text-sm text-gray-500 font-bold leading-relaxed px-2">
                    {errorInfo.message}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsErrorDialogOpen(false)}
                    className="w-full py-4 px-6 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    فهمت ذلك
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
