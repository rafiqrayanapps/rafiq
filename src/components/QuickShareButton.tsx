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

interface QuickShareButtonProps {
  item: any;
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
  // Feature disabled - returning null
  return null;
}
