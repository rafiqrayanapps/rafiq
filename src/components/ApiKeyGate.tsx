'use client';

import { Key, Lock, Settings } from 'lucide-react';
import { useApiKey } from './providers/ApiKeyProvider';
import { cn } from '@/lib/utils';

interface ApiKeyGateProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function ApiKeyGate({ children, title, description }: ApiKeyGateProps) {
  const { hasKey } = useApiKey();

  if (hasKey) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white rounded-[3rem] border border-blue-50 shadow-sm min-h-[400px]">
      <div className="relative">
        <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-500 shadow-inner">
          <Lock size={48} strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
          <Key size={20} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-gray-900">{title}</h3>
        <p className="text-sm text-gray-400 font-bold max-w-sm leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <p className="text-[10px] text-primary font-black leading-relaxed">
            هذه الأداة تتطلب مفتاح Gemini API للعمل. يمكنك إضافة المفتاح الخاص بك من القائمة الجانبية (إعدادات API).
          </p>
        </div>
      </div>
    </div>
  );
}
