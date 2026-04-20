'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useLocalStorage from '@/hooks/use-local-storage';

interface ApiKeyContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  hasKey: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useLocalStorage<string>('user-gemini-api-key', '');

  return (
    <ApiKeyContext.Provider value={{ 
      apiKey: apiKey || '', 
      setApiKey, 
      hasKey: !!(apiKey && apiKey.trim() !== '') 
    }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey() {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
