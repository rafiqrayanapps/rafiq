'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Info, ShieldCheck, Zap, Heart, Star, Users, Target, Rocket, Award, Sparkles, Globe, ZapOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDoc } from '@/hooks/useFirebase';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const iconMap: { [key: string]: any } = {
  Zap, ShieldCheck, Heart, Star, Users, Target, Rocket, Award, Info, Sparkles, Globe
};

export default function AboutPage() {
  const router = useRouter();
  const { data: aboutData, loading } = useDoc('appConfig', 'about');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultFeatures = [
    { icon: 'Sparkles', title: 'إبداع بلا حدود', desc: 'نوفر لك الأدوات اللازمة لإطلاق عنان خيالك.' },
    { icon: 'ShieldCheck', title: 'أمان وموثوقية', desc: 'بياناتك ومشاريعك في أيدٍ أمينة دائماً.' },
    { icon: 'Rocket', title: 'انطلاقة سريعة', desc: 'واجهة سهلة تضمن لك البدء في مشاريعك فوراً.' },
  ];

  const content = {
    title: aboutData?.title || 'رفيق المصمم',
    subtitle: aboutData?.subtitle || 'شريكك الإبداعي في كل خطوة',
    description: aboutData?.description || 'رفيق المصمم هو تطبيق مبتكر صُمم خصيصاً لتمكين المصممين العرب. نحن نوفر لك الأدوات، الموارد، والإلهام الذي تحتاجه لتحويل أفكارك إلى واقع ملموس بأعلى جودة وأقل جهد.',
    vision: aboutData?.vision || 'رؤيتنا هي بناء أكبر مجتمع إبداعي عربي، حيث يجد كل مصمم الدعم التقني والفني الذي يحتاجه للنمو والتميز في سوق العمل العالمي.',
    features: aboutData?.features || defaultFeatures,
    heroImage: aboutData?.heroImage || 'https://picsum.photos/seed/app/800/600'
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Header title="حول التطبيق" showBackButton />
      
      <main className="flex-1 px-6 pb-32 pt-24 max-w-6xl mx-auto w-full space-y-32">
        {/* Branding Hero - Inspired by the provided logo */}
        <section className="flex flex-col items-center text-center space-y-16">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative group"
          >
            {/* Logo Recreation */}
            <div className="w-64 h-64 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-8 relative overflow-hidden transition-transform duration-500 group-hover:scale-105" style={{ background: 'var(--primary-gradient)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
              
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-7xl font-black mb-4 tracking-tighter"
              >
                رفيق
              </motion.h2>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white px-8 py-3 rounded-2xl shadow-lg"
              >
                <span className="text-2xl font-black tracking-tight" style={{ color: 'var(--primary)' }}>المصمم</span>
              </motion.div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -z-10 -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -z-10 -bottom-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          </motion.div>

          <div className="max-w-4xl space-y-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-none">
                {content.title}
              </h1>
              <p className="text-2xl md:text-3xl font-black tracking-wide uppercase" style={{ color: 'var(--primary)' }}>
                {content.subtitle}
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="relative p-10 rounded-[3.5rem] bg-card border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-2 h-full" style={{ backgroundColor: 'var(--primary)' }} />
              <p className="text-gray-600 leading-loose text-xl font-bold text-right dark:text-gray-300">
                {content.description}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="space-y-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="font-black tracking-[0.3em] uppercase text-sm"
              style={{ color: 'var(--primary)' }}
            >
              لماذا نحن؟
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">ما الذي يجعل رفيق مختلفاً؟</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.features.map((f: any, i: number) => {
              const Icon = iconMap[f.icon] || Info;
              const isMain = i === 0;
              return (
                <motion.div 
                  key={f.title}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative p-12 rounded-[4rem] overflow-hidden transition-all duration-500 group",
                    isMain 
                      ? "md:col-span-2 bg-gray-900 text-white shadow-2xl shadow-gray-900/20" 
                      : "bg-card border border-gray-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:-translate-y-2"
                  )}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500",
                    isMain ? "bg-white/10 text-white" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  )}
                  style={isMain ? { backgroundColor: 'var(--primary)' } : {}}
                  >
                    <Icon size={36} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-3xl font-black mb-4 tracking-tight">{f.title}</h3>
                  <p className={cn(
                    "text-lg font-bold leading-relaxed",
                    isMain ? "text-gray-400" : "text-gray-500"
                  )}>{f.desc}</p>
                  
                  {isMain && (
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Vision Section - Premium Look */}
        <section className="relative rounded-[5rem] bg-card p-16 md:p-24 overflow-hidden border border-gray-100 shadow-2xl shadow-gray-200/50">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full -mr-80 -mt-80 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full -ml-80 -mb-80 blur-3xl" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
            <div className="lg:col-span-3 space-y-10 text-right">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-primary/10 rounded-full text-primary text-sm font-black tracking-widest uppercase">
                <Target size={20} />
                رؤيتنا المستقبلية
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tighter">
                {content.vision}
              </h2>
            </div>
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/home')}
                className="w-56 h-56 rounded-full text-primary-foreground font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center text-center p-8 leading-tight"
                style={{ background: 'var(--primary-gradient)' }}
              >
                ابدأ رحلتك الإبداعية
              </motion.button>
            </div>
          </div>
        </section>

        {/* Stats / Trust Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-12 py-20 border-y border-gray-100">
          {[
            { label: 'مصمم مبدع', value: '+15K' },
            { label: 'مورد حصري', value: '+800' },
            { label: 'أداة ذكية', value: '+60' },
            { label: 'تقييم ممتاز', value: '4.9/5' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-3"
            >
              <p className="text-5xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </section>

        {/* Footer Info */}
        <footer className="text-center pt-10 pb-20 space-y-8">
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-24 bg-gray-100" />
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg" style={{ background: 'var(--primary-gradient)' }}>
              <Rocket size={24} />
            </div>
            <div className="h-px w-24 bg-gray-100" />
          </div>
          <p className="text-gray-300 text-xs font-black tracking-[0.4em] uppercase">
            Crafted with passion for creators &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
