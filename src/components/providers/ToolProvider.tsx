'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import QuickToolsModal from '@/components/QuickToolsModal';

type ToolType = 'contrast' | 'qr' | 'ratio' | 'lorem' | 'palette' | 'local-ai' | 'remove-bg' | null;

interface ToolContextType {
  activeTool: ToolType;
  openTool: (type: ToolType) => void;
  closeTool: () => void;
}

const ToolContext = createContext<ToolContextType | undefined>(undefined);

export function ToolProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ToolType>(null);

  const openTool = (type: ToolType) => setActiveTool(type);
  const closeTool = () => setActiveTool(null);

  return (
    <ToolContext.Provider value={{ activeTool, openTool, closeTool }}>
      {children}
      <QuickToolsModal 
        isOpen={!!activeTool} 
        onClose={closeTool} 
        toolType={activeTool} 
      />
    </ToolContext.Provider>
  );
}

export function useTool() {
  const context = useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
}
