'use client';

import { Key, Lock, Settings, AlertCircle } from 'lucide-react';
import { useToolConfig } from '@/hooks/useToolConfig';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useFirebase';

interface ToolGateProps {
  children: React.ReactNode;
  toolIdKey: 'chatId' | 'imageGenId' | 'promptGenId' | 'storyGenId';
  title: string;
  description: string;
}

export default function ToolGate({ children, toolIdKey, title, description }: ToolGateProps) {
  const { config, loading } = useToolConfig();
  const { user } = useAuth();
  const hasId = !!config[toolIdKey];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (hasId) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white rounded-[3rem] border border-blue-50 shadow-sm min-h-[400px]">
      <div className="relative">
        <div className="w-24 h-24 bg-orange-50 rounded-[2.5rem] flex items-center justify-center text-orange-500 shadow-inner">
          <Lock size={48} strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-white">
          <AlertCircle size={20} />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-gray-900">{title}</h3>
        <p className="text-sm text-gray-400 font-bold max-w-sm leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-[10px] text-orange-600 font-black leading-relaxed">
            هذه الأداة متوقفة مؤقتاً من قبل الإدارة. يرجى مراجعة القناة الرسمية للتحديثات.
          </p>
        </div>
      </div>
    </div>
  );
}
