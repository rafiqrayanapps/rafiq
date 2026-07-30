'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn, getDirectLink } from '@/lib/utils';
import { useDoc } from '@/hooks/useFirebase';

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

import { triggerAppShare } from '@/components/AppShareModal';

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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!item) {
      triggerAppShare();
      return;
    }

    const shareTitle = item.title || item.name || 'رفيق المصمم';
    const shareText = item.description || `شاهد هذا العنصر في تطبيق رفيق المصمم: ${shareTitle}`;
    const links = getItemShareLinks(item);
    const itemUrl = links.length > 0 ? links[0].url : (typeof window !== 'undefined' ? window.location.href : '');

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: itemUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback if navigator.share fails or is missing: copy link
    if (typeof navigator !== 'undefined' && navigator.clipboard && itemUrl) {
      navigator.clipboard.writeText(itemUrl);
      toast({
        title: 'تم نسخ الرابط!',
        description: 'تم نسخ رابط العنصر للحافظة بنجاح.',
      });
    } else {
      triggerAppShare();
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn('gap-2 font-bold', className)}
      onClick={handleShare}
      title={label}
    >
      <Share2 size={16} />
      {showLabel && <span>{label}</span>}
    </Button>
  );
}
