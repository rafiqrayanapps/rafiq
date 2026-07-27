'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useUserProfile } from '@/hooks/use-user-profile';
import MaintenanceView from '@/components/MaintenanceView';
import { Wrench, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function SiteMaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const firestore = useFirestore();
  const { isAdmin } = useUserProfile();

  const maintenanceRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'appConfig', 'maintenance') : null),
    [firestore]
  );
  
  const { data: maintenanceConfig, isLoading } = useDoc(maintenanceRef);

  const isMaintenanceActive = maintenanceConfig?.isEnabled === true;
  const isExemptRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/login');

  const disableMaintenance = async () => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'appConfig', 'maintenance'), {
        isEnabled: false
      });
    } catch (e) {
      console.error("Failed to disable maintenance mode:", e);
    }
  };

  // 1. If maintenance is ACTIVE and user is NOT on admin/login route and NOT logged in as admin:
  if (isMaintenanceActive && !isExemptRoute && !isAdmin && !isLoading) {
    return <MaintenanceView isFullPage={true} />;
  }

  // 2. If maintenance is ACTIVE and user IS logged in as admin on a normal page:
  return (
    <>
      {isMaintenanceActive && !isExemptRoute && isAdmin && (
        <div className="sticky top-0 z-[999] w-full bg-amber-500 text-slate-950 font-bold px-4 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-md border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="animate-bounce shrink-0" />
            <span>تنبيه للمشرف: وضع صيانة الموقع **مفعل حالياً** للزوار. أنت تشاهد الموقع لأنك مشرف.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/admin')}
              className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-black hover:bg-slate-800 transition-colors flex items-center gap-1"
            >
              <span>لوحة التحكم</span>
              <ArrowLeft size={13} />
            </button>
            <button
              onClick={disableMaintenance}
              className="px-3 py-1 bg-white text-slate-950 rounded-lg text-xs font-black hover:bg-amber-100 transition-colors"
            >
              إيقاف الصيانة
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
