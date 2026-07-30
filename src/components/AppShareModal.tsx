'use client';

import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/hooks/useFirebase';

interface AppShareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function triggerAppShare() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-app-share'));
  }
}

export default function AppShareModal({ isOpen, onClose }: AppShareModalProps) {
  const { toast } = useToast();
  const { data: shareConfig } = useDoc('appConfig', 'share');

  const handleShare = useCallback(async () => {
    const defaultTitle = 'تطبيق رفيق المصمم';
    const defaultText = 'تطبيق رفيق المصمم - منصتك المتكاملة لأفضل الملحقات والتصاميم والخطوط. حمل التطبيق الآن واستمتع بكافة المميزات!';
    
    const title = shareConfig?.title || defaultTitle;
    const text = shareConfig?.text || defaultText;
    const url = shareConfig?.url && shareConfig.url.trim() !== '' 
      ? shareConfig.url.trim() 
      : (typeof window !== 'undefined' ? window.location.origin : '');

    const fullShareMessage = `${text}\n${url}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        if (onClose) onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share error:', err);
        }
        if (onClose) onClose();
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullShareMessage);
        toast({
          title: 'تم النسخ بنجاح!',
          description: 'تم نسخ نص ورابط مشاركة التطبيق إلى الحافظة',
        });
      } catch (e) {
        console.error('Clipboard copy error:', e);
      }
      if (onClose) onClose();
    }
  }, [shareConfig, onClose, toast]);

  useEffect(() => {
    if (isOpen) {
      handleShare();
    }
  }, [isOpen, handleShare]);

  useEffect(() => {
    const handleOpenShare = () => {
      handleShare();
    };
    window.addEventListener('open-app-share', handleOpenShare);
    return () => window.removeEventListener('open-app-share', handleOpenShare);
  }, [handleShare]);

  // Purely non-rendering system handler - opens native share sheet directly without showing any modal page
  return null;
}
