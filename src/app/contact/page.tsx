'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { MessageSquare, Mail, Phone, Globe, Send, Instagram, Twitter, Github } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "تم الإرسال بنجاح",
        description: "شكراً لتواصلك معنا، سنقوم بالرد عليك في أقرب وقت ممكن.",
      });
    }, 1500);
  };

  const socialLinks = [
    { icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
    { icon: Twitter, label: 'Twitter', color: 'bg-blue-400' },
    { icon: Github, label: 'Github', color: 'bg-gray-800' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="تواصل معنا" showBackButton />
      
      <main className="flex-1 px-6 pb-32 pt-6 max-w-4xl mx-auto w-full space-y-12">
        <section className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto text-primary"
          >
            <MessageSquare size={40} />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">يسعدنا سماع صوتك</h1>
          <p className="text-gray-500 font-bold">لديك استفسار أو اقتراح؟ نحن هنا للمساعدة</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</p>
                  <p className="text-sm font-bold text-gray-700">support@rafeeq.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">رقم الهاتف</p>
                  <p className="text-sm font-bold text-gray-700" dir="ltr">+966 50 000 0000</p>
                </div>
              </div>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Globe size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الموقع الإلكتروني</p>
                  <p className="text-sm font-bold text-gray-700">www.rafeeq.com</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {socialLinks.map((s) => (
                <button key={s.label} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-90 transition-all", s.color)}>
                  <s.icon size={20} />
                </button>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">الاسم بالكامل</label>
                <input 
                  required
                  type="text" 
                  placeholder="أدخل اسمك هنا..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">البريد الإلكتروني</label>
                <input 
                  required
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">رسالتك</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="كيف يمكننا مساعدتك؟"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                />
              </div>

              <button 
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                style={{ background: 'var(--primary-gradient)' }}
              >
                {isSubmitting ? 'جاري الإرسال...' : (
                  <>
                    <Send size={20} />
                    إرسال الرسالة
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
