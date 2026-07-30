'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/hooks/useFirebase';
import { Share2, Copy, Check, MessageCircle, Send, Facebook, Twitter, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AppShareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function triggerAppShare() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-app-share'));
  }
}

export default function AppShareModal({ isOpen: externalIsOpen, onClose }: AppShareModalProps) {
  const { toast } = useToast();
  const { data: shareConfig } = useDoc('appConfig', 'share');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const defaultTitle = 'تطبيق رفيق المصمم';
  const defaultText = 'تطبيق رفيق المصمم - منصتك المتكاملة لأفضل الملحقات والتصاميم والخطوط. حمل التطبيق الآن واستمتع بكافة المميزات!';
  
  const title = shareConfig?.title || defaultTitle;
  const text = shareConfig?.text || defaultText;
  const rawUrl = shareConfig?.url && shareConfig.url.trim() !== '' 
    ? shareConfig.url.trim() 
    : (typeof window !== 'undefined' ? window.location.origin : '');

  const getCleanUrl = () => {
    if (!rawUrl) return typeof window !== 'undefined' ? window.location.origin : '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
    return rawUrl;
  };

  const url = getCleanUrl();
  const fullShareMessage = `${title}\n${text}\n${url}`;

  const tryNativeShare = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = {
          title,
          text,
          url,
        };

        if (navigator.canShare && !navigator.canShare(shareData)) {
          delete shareData.url;
        }

        await navigator.share(shareData);
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return true;
        }
        console.warn('Native share failed, falling back to share dialog:', err);
      }
    }
    return false;
  }, [title, text, url]);

  const handleShareTrigger = useCallback(async () => {
    const success = await tryNativeShare();
    if (!success) {
      setInternalIsOpen(true);
    } else if (onClose) {
      onClose();
    }
  }, [tryNativeShare, onClose]);

  useEffect(() => {
    if (externalIsOpen) {
      handleShareTrigger();
    }
  }, [externalIsOpen, handleShareTrigger]);

  useEffect(() => {
    const handleOpenShare = () => {
      handleShareTrigger();
    };
    window.addEventListener('open-app-share', handleOpenShare);
    return () => window.removeEventListener('open-app-share', handleOpenShare);
  }, [handleShareTrigger]);

  const isModalVisible = externalIsOpen || internalIsOpen;

  const handleModalClose = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const copyToClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullShareMessage);
        setCopied(true);
        toast({
          title: 'تم النسخ بنجاح!',
          description: 'تم نسخ نص ورابط مشاركة التطبيق إلى الحافظة.',
        });
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        console.error('Clipboard copy error:', e);
      }
    }
  };

  const openSocialShare = (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter') => {
    let shareUrl = '';
    const encodedText = encodeURIComponent(text);
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);
    const encodedFull = encodeURIComponent(fullShareMessage);

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodedFull}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] p-6 bg-white border-none shadow-2xl dir-rtl">
        <DialogHeader className="text-right pb-2">
          <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Share2 size={22} className="text-primary" />
            <span>مشاركة التطبيق</span>
          </DialogTitle>
          <p className="text-xs font-bold text-gray-500 mt-1">
            اختر الوسيلة المناسبة لمشاركة التطبيق مع أصدقائك:
          </p>
        </DialogHeader>

        {/* App Info Box */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 my-2 space-y-1">
          <h4 className="font-black text-sm text-gray-900">{title}</h4>
          <p className="text-xs font-bold text-gray-500">{text}</p>
        </div>

        {/* Social Grid */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <button
            onClick={() => openSocialShare('whatsapp')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <span className="text-[11px] font-black">واتساب</span>
          </button>

          <button
            onClick={() => openSocialShare('telegram')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-sky-50 text-sky-600 hover:bg-sky-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Send size={22} />
            </div>
            <span className="text-[11px] font-black">تلغرام</span>
          </button>

          <button
            onClick={() => openSocialShare('facebook')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Facebook size={24} />
            </div>
            <span className="text-[11px] font-black">فيسبوك</span>
          </button>

          <button
            onClick={() => openSocialShare('twitter')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Twitter size={22} />
            </div>
            <span className="text-[11px] font-black">إكس / تويتر</span>
          </button>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <button
            onClick={async () => {
              const nativeOk = await tryNativeShare();
              if (nativeOk) handleModalClose();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary/10 text-primary font-black text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <Smartphone size={18} />
            <span>فتح قائمة المشاركة الخاصة بالنظام</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="w-full py-3.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ النص والرابط'}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
