'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, LogIn, ChevronLeft, Home, Palette, Info, Crown, Settings, User, LayoutGrid, HelpCircle, MessageSquare, Share2, LogOut, Rocket, Zap, Sparkles, Wand2, Scissors, Maximize2, ArrowRight, Key } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useFirebase';
import { useState, useEffect, Fragment } from 'react';
import { cn } from '@/lib/utils';
import { useCategories } from '@/components/providers/CategoryProvider';
import LoginModal from './LoginModal';
import ApiSettingsModal from './ApiSettingsModal';
import { useApiKey } from './providers/ApiKeyProvider';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAdmin, logout } = useAuth();
  const { mainCategories } = useCategories();
  const { hasKey } = useApiKey();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isProToolsOpen, setIsProToolsOpen] = useState(false);

  const mainNav = [
    { label: 'الرئيسية', href: '/home', icon: Home },
  ];

  const toolsNav = [
    { label: 'توليد محتوى بالذكاء', href: '/ai-story-generator', icon: Wand2 },
    { label: 'منسق الألوان', href: '/colors', icon: Palette },
    { label: 'تحويل الصور إلى برومبت', href: '/image-to-prompt', icon: Zap },
    { label: 'توليد الصور بالذكاء', href: '/image-generation', icon: Sparkles },
  ];

  const infoNav = [
    { label: 'حول التطبيق', href: '/about', icon: Info },
    { label: 'تواصل معنا', href: '/contact', icon: MessageSquare },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Fragment key="sidebar-anim-wrapper">
            <motion.div
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
            />
            <motion.div
              key="sidebar-content"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed top-0 right-0 h-full w-[280px] z-[70] flex flex-col shadow-2xl border-none overflow-hidden"
              style={{ background: 'var(--primary-gradient)' }}
            >
            {/* Header Section */}
            <div className="relative pt-14 pb-8 px-6 shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-xl backdrop-blur-xl border border-white/10"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              <div className="flex flex-col items-center text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-2"
                >
                  <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">رفيق</h2>
                </motion.div>
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white px-5 py-1.5 rounded-full shadow-xl transform -rotate-1"
                >
                  <span className="text-sm font-black tracking-widest uppercase" style={{ color: 'var(--primary)' }}>المصمم</span>
                </motion.div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 bg-white rounded-t-[3rem] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto py-8 px-6 custom-scrollbar space-y-6">
                
                {/* Main Navigation */}
                <section>
                  <ul className="space-y-2">
                    {mainNav.map((item, index) => {
                      const isActive = false; // Add logic if needed
                      return (
                        <li key={item.href}>
                          <Link 
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center justify-between group py-3.5 px-4 rounded-2xl transition-all duration-300",
                              "hover:bg-gray-50 hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-md transition-all" style={{ '--tw-text-opacity': '1' } as any}>
                                <style jsx>{`
                                  .group:hover .group-hover-custom-color { color: var(--primary); }
                                `}</style>
                                <div className="group-hover-custom-color">
                                  <item.icon size={22} />
                                </div>
                              </div>
                              <span className="text-base font-bold text-gray-700 transition-colors group-hover-custom-color">
                                {item.label}
                              </span>
                            </div>
                            <ChevronLeft size={18} className="text-gray-300 transition-all group-hover:translate-x-[-4px] group-hover-custom-color" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                {/* Professional Tools Section (Collapsible) */}
                <section className="space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsProToolsOpen(!isProToolsOpen)}
                      className={cn(
                        "flex-[3] flex items-center justify-between py-4 px-5 rounded-2xl transition-all duration-300 border border-transparent",
                        isProToolsOpen ? "bg-primary/5 border-primary/10 shadow-sm" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                          isProToolsOpen ? "bg-white shadow-md text-primary" : "bg-gray-50 text-gray-400 group-hover:bg-white"
                        )}>
                          <LayoutGrid size={22} className={cn(isProToolsOpen && "text-primary")} />
                        </div>
                        <span className={cn(
                          "text-base font-black transition-colors",
                          isProToolsOpen ? "text-primary" : "text-gray-700"
                        )}>
                          أدوات احترافية
                        </span>
                      </div>
                      <motion.div
                        animate={{ rotate: isProToolsOpen ? -90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronLeft size={18} className={cn(isProToolsOpen ? "text-primary" : "text-gray-300")} />
                      </motion.div>
                    </button>

                    <button 
                      onClick={() => setIsApiSettingsOpen(true)}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center rounded-2xl transition-all border",
                        hasKey ? "bg-green-50 border-green-100 text-green-600" : "bg-orange-50 border-orange-100 text-orange-600"
                      )}
                    >
                      <Key size={18} />
                      <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">مفتاح API</span>
                    </button>
                  </div>

                  <AnimatePresence>
                    {isProToolsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden mr-4 mt-2 border-r-2 border-primary/10"
                      >
                        <ul className="space-y-1 pr-2 py-1">
                          {toolsNav.map((item) => (
                            <li key={item.href}>
                              <Link 
                                href={item.href}
                                onClick={onClose}
                                className="flex items-center justify-between group py-3 px-4 rounded-xl hover:bg-gray-50 transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-gray-400 group-hover:text-primary transition-colors">
                                    <item.icon size={18} />
                                  </div>
                                  <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                                    {item.label}
                                  </span>
                                </div>
                                <ArrowRight size={14} className="text-gray-200 group-hover:text-primary transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px]" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* Info & Contact */}
                <section>
                  <ul className="space-y-2">
                    {infoNav.map((item) => (
                      <li key={item.href}>
                        <Link 
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center justify-between group py-3 px-4 rounded-2xl hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white transition-all">
                              <div className="group-hover-custom-color">
                                <item.icon size={20} />
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-600 transition-colors group-hover-custom-color">
                              {item.label}
                            </span>
                          </div>
                          <ChevronLeft size={16} className="text-gray-300 transition-all group-hover:translate-x-[-4px] group-hover-custom-color" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-white border-t border-gray-100 shrink-0 space-y-4">
                {/* Admin Control Panel Button */}
                {isAdmin && (
                  <Link 
                    href="/admin"
                    onClick={onClose}
                    className="relative block group overflow-hidden rounded-[2rem] p-[2px] bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <div className="bg-white rounded-[1.9rem] py-3.5 px-5 flex items-center justify-between group-hover:bg-transparent transition-colors duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-white group-hover:scale-110 transition-all shadow-inner">
                          <Crown size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 group-hover:text-white transition-colors">لوحة التحكم</span>
                          <span className="text-[8px] font-bold text-orange-500 group-hover:text-white/80 transition-colors uppercase tracking-widest">إدارة النظام</span>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center group-hover:bg-white group-hover:text-orange-600 transition-all">
                        <ChevronLeft size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </Link>
                )}
                {user ? (
                  <button 
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 px-4 rounded-[2rem] bg-red-50 text-red-500 font-black text-sm hover:bg-red-100 transition-all group active:scale-95 shadow-sm"
                  >
                    <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    تسجيل الخروج
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsLoginModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-3 w-full py-4 px-4 rounded-[2rem] bg-primary/10 text-primary font-black text-sm hover:bg-primary hover:text-white transition-all group active:scale-95 shadow-md shadow-primary/5"
                  >
                    <LogIn size={20} className="group-hover:translate-x-1 transition-transform" />
                    تسجيل الدخول
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      <ApiSettingsModal isOpen={isApiSettingsOpen} onClose={() => setIsApiSettingsOpen(false)} />
    </>
  );
}
