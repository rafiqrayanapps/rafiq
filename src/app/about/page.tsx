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
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      <Header title="حول التطبيق" showBackButton compact />
      
      <main className="flex-1 px-6 pb-24 pt-8 max-w-4xl mx-auto w-full space-y-20">
        {/* Intro Section */}
        <section className="text-right space-y-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full text-primary text-xs font-black tracking-widest uppercase">
              <Sparkles size={14} />
              من نحن
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight">
              {content.subtitle}
            </h1>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative p-8 rounded-3xl bg-white border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
          >
            <p className="text-gray-600 leading-relaxed text-lg font-medium text-right">
              {content.description}
            </p>
          </motion.div>
        </section>

        {/* Vision Section */}
        <section className="relative rounded-[3rem] bg-gray-900 p-10 md:p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary rounded-full -ml-32 -mb-32 blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-8 text-right">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-black tracking-widest uppercase">
              <Target size={18} />
              رؤيتنا
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-relaxed">
              {content.vision}
            </h2>
          </div>
        </section>

        {/* Key Features */}
        <section className="space-y-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight text-right">لماذا رفـيق؟</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.features.map((f: any, i: number) => {
              const Icon = iconMap[f.icon] || Info;
              return (
                <motion.div 
                  key={f.title}
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-right space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{f.title}</h3>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col items-center">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/home')}
            className="group relative px-10 py-5 bg-primary text-white rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 transition-all flex items-center gap-3"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <span>ابدأ رحلتك الآن</span>
            <Rocket size={20} className="group-hover:translate-x-[-4px] group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        </section>

        {/* Simple Footer */}
        <footer className="text-center pt-8 border-t border-gray-50">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-black text-gray-300">رفــيق المصمم</h2>
            <p className="text-gray-400 text-[10px] font-black tracking-[0.2em] uppercase">
              Built for creative minds &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
