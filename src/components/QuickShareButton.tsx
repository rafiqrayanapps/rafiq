'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn, getDirectLink } from '@/lib/utils';

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

  // Fallbacks if no explicit downloadUrl is provided
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
  item: any;
  category?: any;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  label?: string;
}

export default function QuickShareButton({
  item,
  category,
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
  label = 'مشاركة',
}: QuickShareButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (item?.showShareButton === false || category?.showShareButton === false) {
    return null;
  }

  const links = getItemShareLinks(item);

  const handleCopyLink = async (url: string, linkLabel?: string) => {
    const directUrl = getDirectLink(url);
    try {
      await navigator.clipboard.writeText(directUrl);
      setCopiedUrl(url);
      toast({
        title: 'تم نسخ الرابط بنجاح',
        description: linkLabel ? `تم نسخ ${linkLabel}` : 'يمكنك الآن مشاركته مباشرة',
      });
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: 'عذراً، تعذر نسخ الرابط',
        variant: 'destructive',
      });
    }
  };

  const handleNativeShare = async (url: string, title?: string) => {
    const directUrl = getDirectLink(url);
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || item?.title || 'مشاركة الرابط',
          url: directUrl,
        });
        toast({ title: 'تمت المشاركة بنجاح' });
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        } else {
          return;
        }
      }
    }
    // Fallback to copy
    await handleCopyLink(url);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!links || links.length === 0) {
      toast({
        title: 'لا يوجد رابط مشاركة متاح لهذا المحتوى',
      });
      return;
    }

    if (links.length === 1) {
      // Single link -> directly copy / share
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.share) {
        handleNativeShare(links[0].url, links[0].label);
      } else {
        handleCopyLink(links[0].url, links[0].label);
      }
    } else {
      // Multiple links -> open modal choice
      setIsOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn('transition-transform active:scale-95', className)}
        title="مشاركة سريعة"
      >
        <Share2 className="h-4 w-4" />
        {showLabel && <span className="mr-1.5 font-bold text-xs">{label}</span>}
      </Button>

      {/* Choice Modal when multiple download/share links exist */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md p-6 bg-card rounded-[2.5rem] border border-border shadow-2xl" dir="rtl">
          <DialogHeader className="text-right space-y-2">
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary shrink-0" />
              مشاركة روابط المحتوى
            </DialogTitle>
            <p className="text-xs text-muted-foreground font-bold">
              يتوفر أكثر من رابط لـ <span className="text-foreground font-black">&quot;{item?.title}&quot;</span>. اختر الرابط الذي ترغب بمشاركته:
            </p>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {links.map((linkOption, index) => {
              const isCopied = copiedUrl === linkOption.url;
              return (
                <div
                  key={`${linkOption.url}-${index}`}
                  className="p-4 rounded-2xl bg-muted/60 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground leading-tight">{linkOption.label}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate mt-1 dir-ltr text-left" dir="ltr">
                      {linkOption.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleCopyLink(linkOption.url, linkOption.label)}
                      className="rounded-xl font-bold text-xs gap-1.5 h-9"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {isCopied ? 'تم النسخ' : 'نسخ الرابط'}
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleNativeShare(linkOption.url, linkOption.label)}
                      title="مشاركة مباشرة"
                      className="h-9 w-9 rounded-xl shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setIsOpen(false)}
              className="rounded-xl font-bold text-xs px-6"
            >
              إغلاق
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
