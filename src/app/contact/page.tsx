'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { MessageCircle, Mail, Phone, ExternalLink, RefreshCw, Send, MapPin, Clock, Instagram, Twitter, Github, Globe, Settings, Shield, Palette, Bell, Info, User, Users, Target, Rocket, Award, CheckCircle2, Trash2 } from 'lucide-react';
import { useCollection, useDoc } from '@/hooks/useFirebase';
import { useAutoSaveDraft } from '@/hooks/use-auto-save';
import { useToast } from '@/hooks/use-toast';

const iconMap: { [key: string]: any } = {
  Phone, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  Send,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Github,
  Globe,
  Settings,
  Shield,
  Palette,
  Bell,
  Info,
  User,
  Users,
  Target,
  Rocket,
  Award
};

interface MessageDraft {
  name: string;
  contactInfo: string;
  message: string;
}

export default function ContactPage() {
  const { toast } = useToast();
  const { data: configData, loading: configLoading } = useDoc('appConfig', 'contact');
  const { data: contacts, loading: contactsLoading } = useCollection('contacts');

  // Interactive Message Form with Auto-Save
  const [formData, setFormData] = useState<MessageDraft>({
    name: '',
    contactInfo: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { status: autoSaveStatus, hasDraft, draftSavedAt, clearDraft } = useAutoSaveDraft<MessageDraft>({
    key: 'contact_message_draft',
    data: formData,
    autoRestore: true,
    onRestore: (saved) => {
      setFormData(saved);
    },
    isValid: (data) => Boolean(data.name.trim() || data.contactInfo.trim() || data.message.trim()),
  });

  const loading = configLoading || contactsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
        <Header title="تواصل معنا" showBackButton compact />
        <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const sortedContacts = contacts 
    ? [...contacts].filter(c => c.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) {
      toast({
        title: "حقول مطلوبة",
        description: "يرجى كتابة اسمك ورسالتك قبل الإرسال.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    // Prepare recipient from config or fallback
    const targetEmail = configData?.email || "artbag.rayanapp@gmail.com";
    const subject = encodeURIComponent(`رسالة جديدة من: ${formData.name}`);
    const body = encodeURIComponent(
      `الاسم: ${formData.name}\nمعلومات التواصل: ${formData.contactInfo}\n\nنص الرسالة:\n${formData.message}`
    );

    window.open(`mailto:${targetEmail}?subject=${subject}&body=${body}`, '_blank');

    toast({
      title: "تم تجهيز الرسالة",
      description: "سيتم فتح تطبيق البريد لإرسال رسالتك مباشرة.",
    });

    // Clear auto-saved draft
    clearDraft();
    setFormData({ name: '', contactInfo: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <Header title="تواصل معنا" showBackButton compact />
      
      <main className="flex-1 px-6 pb-32 pt-12 container max-w-lg mx-auto space-y-10">
        {/* Header Section */}
        <header className="text-center space-y-4">
            <h1 className="text-4xl font-black text-[#1A1C1E] tracking-tight">
                {configData?.title || "تواصل معنا"}
            </h1>
            <p className="text-[#64748B] text-sm font-bold leading-relaxed px-4">
                {configData?.subtitle || "يسعدنا دائماً سماع آرائكم واستفساراتكم. فريقنا جاهز للرد عليكم في أسرع وقت ممكن."}
            </p>
        </header>

        {/* Dynamic Contact Methods */}
        <div className="space-y-6">
            {sortedContacts.map((contact, index) => {
                const Icon = iconMap[contact.icon] || ExternalLink;
                
                return (
                    <motion.a
                        key={contact.id}
                        href={contact.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="block bg-white border border-blue-50 rounded-[3rem] p-8 shadow-[0_15px_45px_rgba(0,0,0,0.04)] hover:scale-[1.02] transition-all relative group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2 text-right">
                                <div className="inline-flex bg-primary/10 px-4 py-1.5 rounded-full border border-primary/5">
                                    <span className="text-primary text-[10px] font-black">{contact.label}</span>
                                </div>
                                <h4 className="text-xl font-black text-[#1A1C1E] tracking-tight" dir="ltr">
                                    {contact.value}
                                </h4>
                            </div>
                            
                            <div className="w-16 h-16 bg-primary rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-primary/20 transition-transform group-hover:rotate-12">
                                <Icon className="h-8 w-8" />
                            </div>
                        </div>
                    </motion.a>
                );
            })}
        </div>

        {/* Interactive Message Form with Smart Auto-Save */}
        <div className="bg-white border border-blue-50 rounded-[3rem] p-8 shadow-[0_15px_45px_rgba(0,0,0,0.04)] space-y-6 text-right">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-gray-900">أرسل رسالة مباشرة</h3>
              <p className="text-xs text-gray-500 font-medium">
                تُحفظ مسودتك تلقائياً حتى لا تفقد مدخلاتك
              </p>
            </div>
            {hasDraft && (
              <button
                type="button"
                onClick={clearDraft}
                className="flex items-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={13} />
                مسح المسودة
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                الاسم الكريم *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="اكتب اسمك هنا..."
                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-right"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                البريد الإلكتروني أو رقم الهاتف
              </label>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactInfo: e.target.value }))}
                placeholder="وسيلة الرد المفضلة..."
                className="w-full h-12 px-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                نص الرسالة أو الاستفسار *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="اكتب تفاصيل رسالتك أو اقتراحك هنا..."
                rows={4}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-right resize-none"
                required
              />
            </div>

            {/* Auto-Save Status Pill */}
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 pt-1">
              <div className="flex items-center gap-1.5">
                {autoSaveStatus === 'saved' || hasDraft ? (
                  <>
                    <CheckCircle2 size={13} className="text-green-500" />
                    <span className="text-green-600 font-bold">محفوظ كمسودة تلقائية</span>
                    {draftSavedAt && (
                      <span className="text-gray-400">
                        ({new Date(draftSavedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                  </>
                ) : autoSaveStatus === 'saving' ? (
                  <>
                    <RefreshCw size={13} className="text-primary animate-spin" />
                    <span>جاري الحفظ التلقائي...</span>
                  </>
                ) : (
                  <span>الحفظ التلقائي نشط</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-primary text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <Send size={18} />
              <span>إرسال الرسالة الآن</span>
            </button>
          </form>
        </div>

        {/* Floating WhatsApp Action Button (if configured) */}
        {configData?.showWhatsAppBtn && (
            <motion.a
                href={configData?.whatsAppUrl || "https://wa.me/"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-16 rounded-full bg-primary text-white flex items-center justify-center gap-4 text-xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
                <MessageCircle className="h-6 w-6" />
                <span>ابدأ محادثة واتساب</span>
            </motion.a>
        )}
      </main>
    </div>
  );
}
