import { useState, useEffect } from 'react';
import { db } from '@/firebase/init';
import { doc, onSnapshot } from 'firebase/firestore';

export interface ToolConfig {
  chatId?: string;
  imageGenId?: string;
  promptGenId?: string;
  storyGenId?: string;
  globalApiKey?: string;
}

export function useToolConfig() {
  const [config, setConfig] = useState<ToolConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'toolConfig', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ToolConfig);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tool config:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { config, loading };
}
