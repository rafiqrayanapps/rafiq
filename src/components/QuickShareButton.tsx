'use client';

import { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  X, 
  MessageCircle, 
  Send, 
  Facebook, 
  Twitter,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/hooks/useFirebase';
import { cn, getDirectLink } from '@/lib/utils';
import { triggerAppShare } from '@/components/AppShareModal';

export interface ShareLinkOption {
  label: string;
  url: string;
}

export function getItemShareLinks(item: any): ShareLinkOption[] {
  if (!item) return [];
  const links: ShareLinkOption[] = [];

  if (item.downloadUrl) {
    links.push({
      label: item.downloadUrlLabel || (item.downloadUrl2 ? 'رابط التحميل 1 (اللوجو 1)' : 'رابط التحميل المباشر'),
      url: item.downloadUrl,
    });
  }

  if (item.downloadUrl2) {
    links.push({
      label: item.downloadUrl2Label || 'رابط التحميل 2 (اللوجو 2)',
      url: item.downloadUrl2,
    });
  }

  if (item.extraLinks && Array.isArray(item.extraLinks)) {
    item.extraLinks.forEach((linkObj: any, idx: number) => {
      if (typeof linkObj === 'string' && linkObj.trim()) {
        links.push({
          label: `رابط إضافي ${idx + 1}`,
          url: linkObj,
        });
      } else if (linkObj && linkObj.url) {
        links.push({
          label: linkObj.label || `رابط إضافي ${idx + 1}`,
          url: linkObj.url,
        });
      }
    });
  }

  if (links.length === 0) {
    if (item.sourceUrl) {
      links.push({ label: 'رابط المصدر', url: item.sourceUrl });
    } else if (item.audioUrl) {
      links.push({ label: 'رابط الملف الصوتي', url: item.audioUrl });
    } else if (item.videoUrl) {
      links.push({ label: 'رابط الفيديو', url: item.videoUrl });
    } else if (item.imageUrl) {
      links.push({ label: 'رابط الصورة', url: item.imageUrl });
    }
  }

  return links;
}

interface QuickShareButtonProps {
  item?: any;
  category?: any;
  subCategory?: any;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  label?: string;
}

export default function QuickShareButton({
  item,
  category,
  subCategory,
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  label = 'مشاركة',
}: QuickShareButtonProps) {
  const { toast } = useToast();
  const { data: shareConfig } = useDoc('appConfig', 'share');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // If share functionality is toggled off globally, or per subCategory, category, or item, do not render the share button
  const isShareDisabled = 
    shareConfig?.enabled === false ||
    item?.showShareButton === false ||
    subCategory?.showShareButton === false ||
    category?.showShareButton === false;

  if (isShareDisabled) {
    return null;
  }

  // Helper to resolve clean URL
  const getShareUrl = () => {
    if (!item) {
      return typeof window !== 'undefined' ? window.location.origin : '';
    }
    const links = getItemShareLinks(item);
    const rawUrl = links.length > 0 ? links[0].url : (typeof window !== 'undefined' ? window.location.href : '');
    
    if (!rawUrl) return typeof window !== 'undefined' ? window.location.href : '';
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
      return rawUrl;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
    return rawUrl;
  };

  const shareTitle = item?.title || item?.name || 'رفيق المصمم';
  const shareText = item?.description || `شاهد هذا العنصر المميز في تطبيق رفيق المصمم: ${shareTitle}`;
  const targetUrl = getShareUrl();
  const fullMessage = `${shareTitle}\n${shareText}\n${targetUrl}`;

  const tryNativeShare = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = {
          title: shareTitle,
          text: shareText,
          url: targetUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
        };

        if (navigator.canShare && !navigator.canShare(shareData)) {
          delete shareData.url;
        }

        await navigator.share(shareData);
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return true; // User intentionally cancelled native sheet
        }
        console.warn('Native web share failed, opening share modal fallback:', err);
      }
    }
    return false;
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!item) {
      triggerAppShare();
      return;
    }

    // Attempt native system share sheet first
    const success = await tryNativeShare();
    if (!success) {
      // If native share sheet fails or is unavailable on desktop/webview, open Share Menu modal
      setIsShareModalOpen(true);
    }
  };

  const copyToClipboard = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(fullMessage);
        setCopied(true);
        toast({
          title: 'تم النسخ بنجاح!',
          description: 'تم نسخ نص ورابط المشاركة إلى الحافظة.',
        });
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const openSocialShare = (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter') => {
    let shareUrl = '';
    const encodedText = encodeURIComponent(shareText);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedUrl = encodeURIComponent(targetUrl);
    const encodedFull = encodeURIComponent(`${shareTitle}\n${shareText}\n${targetUrl}`);

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
    <>
      <Button
        variant={variant}
        size={size}
        className={cn('gap-2 font-bold', className)}
        onClick={handleShareClick}
        title={label}
      >
        <Share2 size={16} />
        {showLabel && <span>{label}</span>}
      </Button>

      {/* Share Menu Modal Fallback */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-[2.5rem] p-6 bg-white border-none shadow-2xl dir-rtl">
          <DialogHeader className="text-right pb-2">
            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Share2 size={22} className="text-primary" />
              <span>قائمة المشاركة</span>
            </DialogTitle>
            <p className="text-xs font-bold text-gray-500 mt-1">
              اختر التطبيق أو وسيلة المشاركة المناسبة لك:
            </p>
          </DialogHeader>

          {/* Item Preview Card */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 my-2 space-y-1">
            <h4 className="font-black text-sm text-gray-900 line-clamp-1">{shareTitle}</h4>
            <p className="text-xs font-bold text-gray-500 line-clamp-2">{shareText}</p>
          </div>

          {/* Social Share Grid */}
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

          {/* Additional Actions */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <button
              onClick={async () => {
                const nativeOk = await tryNativeShare();
                if (nativeOk) setIsShareModalOpen(false);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-primary/10 text-primary font-black text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone size={18} />
              <span>مشاركة عبر قائمة النظام الهاتفي</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="w-full py-3.5 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط والرسالة'}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
