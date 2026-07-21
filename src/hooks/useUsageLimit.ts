import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useFirebase';
import { db } from '@/firebase/init';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export type ToolType = 'imageGen' | 'chat' | 'promptGen';

export function useUsageLimit() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<{ [key in ToolType]: number }>({
    imageGen: 0,
    chat: 0,
    promptGen: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const statsRef = doc(db, 'userStats', user.uid);
      const statsSnap = await getDoc(statsRef);
      const today = new Date().toISOString().split('T')[0];

      if (statsSnap.exists()) {
        const data = statsSnap.data();
        if (data.lastReset !== today) {
          // Reset daily
          const newData = {
            userId: user.uid,
            lastReset: today,
            imageGenCount: 0,
            chatCount: 0,
            promptGenCount: 0
          };
          await setDoc(statsRef, newData);
          setLimits({ imageGen: 0, chat: 0, promptGen: 0 });
        } else {
          setLimits({
            imageGen: data.imageGenCount || 0,
            chat: data.chatCount || 0,
            promptGen: data.promptGenCount || 0
          });
        }
      } else {
        // Init
        const newData = {
          userId: user.uid,
          lastReset: today,
          imageGenCount: 0,
          chatCount: 0,
          promptGenCount: 0
        };
        await setDoc(statsRef, newData);
        setLimits({ imageGen: 0, chat: 0, promptGen: 0 });
      }
    } catch (error) {
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const incrementUsage = async (tool: ToolType) => {
    if (!user) return false;
    try {
      const statsRef = doc(db, 'userStats', user.uid);
      const field = tool === 'imageGen' ? 'imageGenCount' : tool === 'chat' ? 'chatCount' : 'promptGenCount';
      await updateDoc(statsRef, {
        [field]: increment(1)
      });
      setLimits(prev => ({ ...prev, [tool]: prev[tool] + 1 }));
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const checkLimit = (tool: ToolType) => {
    return limits[tool] < 10;
  };

  return { limits, checkLimit, incrementUsage, loading, refresh: fetchLimits };
}
