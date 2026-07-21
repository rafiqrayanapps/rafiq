'use client';

import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import { useCollection } from '@/hooks/useFirebase';

export default function NotificationsTab() {
  const { data: notifications, loading } = useCollection('notifications');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [permission, setPermission] = useState<string>('default');
  const [fcmToken, setFcmToken] = useState<string>('');
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Try to load any previously saved FCM token
      const storedToken = localStorage.getItem('fcm_token');
      if (storedToken) {
        setFcmToken(storedToken);
      }
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('الإشعارات غير مدعومة في هذا المتصفح أو في البيئة الحالية.');
      return;
    }

    setPermissionLoading(true);
    try {
      const reqPermission = await Notification.requestPermission();
      setPermission(reqPermission);

      if (reqPermission === 'granted') {
        const { getMessaging, getToken, isSupported } = await import('firebase/messaging');
        const messagingSupported = await isSupported();
        
        if (messagingSupported) {
          const { app } = await import('@/firebase/init');
          const messaging = getMessaging(app);
          
          // Note: You must replace 'YOUR_PUBLIC_VAPID_KEY' with your actual key from 
          // the Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration (Key Pair)
          const token = await getToken(messaging, {
            vapidKey: 'YOUR_PUBLIC_VAPID_KEY'
          });

          if (token) {
            setFcmToken(token);
            localStorage.setItem('fcm_token', token);
            console.log('FCM Token successfully generated:', token);
            
            // Save token to Firestore under fcmTokens collection
            const { db, auth } = await import('@/firebase');
            const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            
            const userId = auth.currentUser?.uid || 'anonymous';
            await setDoc(doc(db, 'fcmTokens', token), {
              token,
              userId,
              deviceType: 'web',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } else {
          console.warn("FCM is not supported on this browser.");
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setPermissionLoading(false);
    }
  };

  // Load read status from local storage
  useEffect(() => {
    const stored = localStorage.getItem('read_notifications');
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing read notifications", e);
      }
    }
  }, []);

  // Mark all as read when viewing the tab
  useEffect(() => {
    if (!loading && notifications && notifications.length > 0) {
      const allIds = notifications.map(n => n.id);
      const newReadIds = Array.from(new Set([...readIds, ...allIds]));
      
      if (newReadIds.length > readIds.length) {
        setReadIds(newReadIds);
        localStorage.setItem('read_notifications', JSON.stringify(newReadIds));
        window.dispatchEvent(new Event('notifications_updated'));
      }
    }
  }, [notifications, loading, readIds]);

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
        {/* PWA / FCM Push Notification Management Card */}
        {permission !== 'granted' ? (
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-[2.5rem] border border-primary/20 space-y-4 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shrink-0">
                <Bell className="animate-bounce" size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-gray-900 text-lg">تفعيل التنبيهات الفورية</h4>
                <p className="text-gray-500 text-sm font-medium">اشترك لتلقي تحديثات وأخبار رفيق المصمم مباشرة على جهازك فور صدورها.</p>
              </div>
            </div>
            <button
              onClick={handleRequestPermission}
              disabled={permissionLoading}
              className="w-full bg-primary text-primary-foreground font-black py-4 px-6 rounded-2xl hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
            >
              {permissionLoading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  جاري التفعيل...
                </>
              ) : (
                'تفعيل الإشعارات الآن'
              )}
            </button>
          </div>
        ) : fcmToken ? (
          <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 space-y-3 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-gray-900 text-lg">التنبيهات مفعلة بنجاح!</h4>
                <p className="text-green-700 text-sm font-medium">جهازك الآن جاهز لاستقبل الإشعارات والرسائل التنبيهية.</p>
              </div>
            </div>
            <div className="pt-2">
              <label className="text-[10px] font-black text-green-800 uppercase tracking-widest block mb-1">رمز الـ FCM Token الخاص بك:</label>
              <div className="bg-white/80 p-3 rounded-xl border border-green-200 text-xs font-mono text-gray-500 break-all select-all cursor-pointer hover:bg-white transition-colors" title="انقر لتحديد الرمز">
                {fcmToken}
              </div>
            </div>
          </div>
        ) : null}

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
                    {!readIds.includes(notif.id) && (
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
