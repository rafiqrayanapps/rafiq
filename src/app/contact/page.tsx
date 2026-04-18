'use client';

import { motion, AnimatePresence } from 'motion/react';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { MessageCircle, Mail, Phone, ExternalLink, RefreshCw, Send, MapPin, Clock, Instagram, Twitter, Github, Globe, Settings, Shield, Palette, Bell, Info, User, Users, Target, Rocket, Award } from 'lucide-react';
import { useCollection, useDoc } from '@/hooks/useFirebase';

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

export default function ContactPage() {
  const { data: configData, loading: configLoading } = useDoc('appConfig', 'contact');
  const { data: contacts, loading: contactsLoading } = useCollection('contacts');

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

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col">
      <Header title="تواصل معنا" showBackButton compact />
      
      <main className="flex-1 px-6 pb-32 pt-12 container max-w-lg mx-auto space-y-12">
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

        {/* Floating WhatsApp Action Button (if configured) */}
        {configData?.showWhatsAppBtn && (
            <motion.a
                href={configData?.whatsAppUrl || "https://wa.me/"}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-16 rounded-full bg-primary text-white flex items-center justify-center gap-4 text-xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all mt-8"
            >
                <MessageCircle className="h-6 w-6" />
                <span>ابدأ محادثة واتساب</span>
            </motion.a>
        )}
      </main>
    </div>
  );
}
