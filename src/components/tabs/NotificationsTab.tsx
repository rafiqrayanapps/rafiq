'use client';

import { useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import { useCollection } from '@/hooks/useFirebase';
import { db } from '@/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';

export default function NotificationsTab() {
  const { data: notifications, loading } = useCollection('notifications');

  // Mark unread as read when mounting
  useEffect(() => {
    if (!loading && notifications && notifications.length > 0) {
      const unread = notifications.filter(n => n.read === false || n.isNew === true);
      if (unread.length > 0) {
        const batch = writeBatch(db);
        unread.forEach(notif => {
          batch.update(doc(db, 'notifications', notif.id), {
            read: true,
            isNew: false
          });
        });
        batch.commit().catch(err => console.error("Error marking as read:", err));
      }
    }
  }, [notifications, loading]);

  // Sort notifications by createdAt descending
  const sortedNotifications = useMemo(() => {
    return [...(notifications || [])].sort((a, b) => {
      const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
      const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [notifications]);

  const formatDate = (date: any) => {
    if (!date) return '---';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
  };

  const formatTime = (date: any) => {
    if (!date) return '---';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    if (isNaN(d.getTime())) return '---';
    return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
            <p className="text-gray-400 font-bold text-sm">جاري تحميل التنبيهات...</p>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="text-center py-20 px-8 bg-white rounded-[3.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-gray-200 shadow-inner">
              <Bell size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">لا توجد إشعارات حالياً</h3>
              <p className="text-gray-400 font-medium max-w-xs mx-auto">سنقوم بتنبيهك فور وصول أي تحديثات أو أخبار جديدة.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">التنبيهات الأخيرة ({sortedNotifications.length})</p>
            </div>
            {sortedNotifications.map((notif, idx) => (
              <motion.div 
                key={`${notif.id}-${idx}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-start gap-6 hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-16 h-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <Bell size={32} />
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-gray-900 text-xl group-hover:text-primary transition-colors">{notif.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                          {formatDate(notif.createdAt)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                    {notif.read === false && (
                      <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
                    )}
                  </div>
                  
                  <p className="text-base text-gray-500 font-medium leading-relaxed">{notif.body}</p>
                  
                  {notif.link && (
                    <button 
                      onClick={() => window.open(notif.link, '_blank')}
                      className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                    >
                      عرض التفاصيل
                      <span className="text-lg">←</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
