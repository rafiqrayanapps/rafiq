'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { Info, ShieldCheck, Zap, Heart, Star, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  const features = [
    { icon: Zap, title: 'سرعة فائقة', desc: 'تم تصميم التطبيق ليكون سريعاً وسلس الاستخدام.' },
    { icon: ShieldCheck, title: 'أمان عالي', desc: 'بياناتك وخصوصيتك هي أولويتنا القصوى.' },
    { icon: Heart, title: 'سهولة الاستخدام', desc: 'واجهة بسيطة ومريحة تناسب جميع المصممين.' },
    { icon: Star, title: 'محتوى متجدد', desc: 'نعمل باستمرار على إضافة أقسام ومحتوى جديد.' },
    { icon: Users, title: 'مجتمع المصممين', desc: 'انضم لآلاف المصممين الذين يثقون في رفيق.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="حول التطبيق" showBackButton />
      
      <main className="flex-1 px-6 pb-32 pt-6 max-w-4xl mx-auto w-full space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center mx-auto text-primary"
          >
            <Info size={48} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">رفيق المصمم</h1>
            <p className="text-gray-500 font-bold">كل ما يحتاجه المصمم في مكان واحد</p>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg max-w-2xl mx-auto">
            تطبيق رفيق المصمم هو منصة متكاملة تهدف لتسهيل حياة المصممين العرب من خلال توفير الموارد، الأدوات، والإلهام اللازم لكل مشروع إبداعي.
          </p>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={f.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <f.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Vision Section */}
        <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100 text-center space-y-6">
          <h2 className="text-2xl font-black text-gray-900">رؤيتنا</h2>
          <p className="text-gray-600 leading-relaxed font-medium">
            نسعى لأن نكون المرجع الأول والأساسي لكل مصمم عربي، من خلال بناء مجتمع إبداعي يدعم المواهب ويوفر لهم أفضل الأدوات التقنية والفنية.
          </p>
          <div className="pt-4">
            <button 
              onClick={() => router.push('/home')}
              className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'var(--primary-gradient)' }}
            >
              ابدأ الاستكشاف الآن
            </button>
          </div>
        </section>

        {/* Footer Info */}
        <footer className="text-center py-8 text-gray-400 text-xs font-bold tracking-widest uppercase">
          تم التطوير بكل حب لخدمة المصممين &copy; {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
