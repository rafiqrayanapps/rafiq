'use client';

import React from 'react';
import { 
  Globe, 
  ExternalLink, 
  MessageCircle, 
  Youtube, 
  Facebook, 
  Instagram, 
  Send, 
  Music, 
  Share2 
} from 'lucide-react';

interface PlatformButtonProps {
  url: string;
  text: string;
  platform?: string; // 'auto', 'youtube', 'facebook', 'instagram', 'whatsapp', 'telegram', 'tiktok', 'twitter', 'website'
  onClick?: () => void;
  className?: string;
}

export function detectPlatform(url: string, explicitPlatform?: string): string {
  if (explicitPlatform && explicitPlatform !== 'auto') {
    return explicitPlatform;
  }
  if (!url) return 'website';
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'whatsapp';
  if (lower.includes('t.me') || lower.includes('telegram')) return 'telegram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  return 'website';
}

export default function PlatformButton({ url, text, platform = 'auto', onClick, className = '' }: PlatformButtonProps) {
  const effectivePlatform = detectPlatform(url, platform);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (!url) return;
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    window.open(formatted, '_blank');
  };

  const getPlatformDetails = () => {
    switch (effectivePlatform) {
      case 'youtube':
        return {
          icon: <Youtube size={18} className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#FF0000',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(255, 0, 0, 0.35)',
          },
          hoverClass: 'hover:bg-[#d90000]',
        };
      case 'facebook':
        return {
          icon: <Facebook size={18} className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#1877F2',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(24, 119, 242, 0.35)',
          },
          hoverClass: 'hover:bg-[#1565C0]',
        };
      case 'instagram':
        return {
          icon: <Instagram size={18} className="shrink-0 text-white" />,
          style: {
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(220, 39, 67, 0.35)',
          },
          hoverClass: 'hover:opacity-90',
        };
      case 'whatsapp':
        return {
          icon: <MessageCircle size={18} fill="currentColor" className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#16a34a',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(22, 163, 74, 0.35)',
          },
          hoverClass: 'hover:bg-[#15803d]',
        };
      case 'telegram':
        return {
          icon: <Send size={18} className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#0088cc',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(0, 136, 204, 0.35)',
          },
          hoverClass: 'hover:bg-[#0077b5]',
        };
      case 'tiktok':
        return {
          icon: <Music size={18} className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#010101',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
          },
          hoverClass: 'hover:bg-gray-900',
        };
      case 'twitter':
        return {
          icon: <Share2 size={18} className="shrink-0 text-white" />,
          style: {
            backgroundColor: '#000000',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.35)',
          },
          hoverClass: 'hover:bg-gray-900',
        };
      case 'website':
      default:
        return {
          icon: <Globe size={18} className="shrink-0 text-white" />,
          style: {
            background: 'var(--primary-gradient)',
            color: '#ffffff',
            boxShadow: '0 8px 20px -4px color-mix(in srgb, var(--primary) 35%, transparent)',
          },
          hoverClass: 'hover:opacity-95',
        };
    }
  };

  const details = getPlatformDetails();

  return (
    <button
      onClick={handleClick}
      style={details.style}
      className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2.5 active:scale-95 transition-all cursor-pointer ${details.hoverClass} ${className}`}
    >
      {details.icon}
      <span className="truncate">{text}</span>
      <ExternalLink size={14} className="opacity-70 shrink-0" />
    </button>
  );
}
