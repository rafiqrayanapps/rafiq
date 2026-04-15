'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useFirebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loginWithEmail, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      router.push('/admin');
    } catch (error: any) {
      setError("يا بطل، هذا المكان للأباطرة (الأدمن) فقط! تأكد من بياناتك أو اطلب الإذن من الزعيم 😉");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-12 px-6 pb-20 overflow-hidden">
      {/* Header Icon */}
      <motion.div 
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 3 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 rounded-[30px] flex items-center justify-center shadow-xl shadow-primary/20 mb-6"
        style={{ background: 'var(--primary-gradient)' }}
      >
        <ShieldCheck size={48} className="text-white" />
      </motion.div>

      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-black text-gray-900 mb-2"
      >
        رفيق المصمم
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 font-bold mb-10"
      >
        بوابتك لعالم الإبداع والجوائز
      </motion.p>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="w-full max-w-md bg-red-50 border-2 border-red-100 p-4 rounded-3xl flex items-center gap-3 text-red-600 font-bold text-sm shadow-sm"
          >
            <div className="bg-red-100 p-2 rounded-full">
              <Lock size={18} />
            </div>
            <p className="flex-1">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white w-full max-w-md rounded-[50px] p-10 shadow-2xl shadow-gray-200 border border-gray-50"
      >
        <motion.h2 variants={itemVariants} className="text-3xl font-black text-gray-900 text-center mb-2">
          دخول الأدمن
        </motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 font-bold text-center mb-10">
          أهلاً بعودتك! سجل الدخول للمتابعة
        </motion.p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-lg font-black text-gray-800 block mr-2">البريد الإلكتروني</label>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="example@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F7FA] border-2 border-transparent rounded-[20px] py-5 pr-14 pl-6 text-right font-bold focus:bg-white focus:border-primary/20 focus:ring-0 transition-all outline-none"
                required
              />
              <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={24} />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <label className="text-lg font-black text-gray-800 block mr-2">كلمة المرور</label>
            <div className="relative group">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="........" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5F7FA] border-2 border-transparent rounded-[20px] py-5 pr-14 pl-14 text-right font-bold focus:bg-white focus:border-primary/20 focus:ring-0 transition-all outline-none"
                required
              />
              <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={24} />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </motion.div>

          <motion.button 
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full text-white py-6 rounded-[25px] text-xl font-black shadow-xl shadow-primary/20 transition-all disabled:opacity-50"
            style={{ background: 'var(--primary-gradient)' }}
          >
            {loading ? 'جاري التحميل...' : 'تسجيل الدخول الآن'}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <button className="text-gray-400 font-bold hover:text-primary transition-colors">هل نسيت كلمة المرور؟</button>
        </motion.div>
      </motion.div>

      {/* Back to Home */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Link href="/" className="mt-10 text-gray-400 font-black hover:text-gray-600 transition-colors flex items-center gap-2">
          <span>العودة للرئيسية</span>
          <ArrowLeft size={18} />
        </Link>
      </motion.div>
    </div>
  );
}
