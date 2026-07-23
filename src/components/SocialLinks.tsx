'use client';

import { useDoc } from '@/hooks/useFirebase';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  enabled?: boolean;
}

export function getSocialPlatformInfo(url: string = '', name: string = '') {
  const lowerUrl = (url || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerName.includes('youtube') || lowerName.includes('يوتيوب')) {
    return {
      platform: 'youtube',
      label: name || 'يوتيوب',
      colorClass: 'bg-red-50 text-red-600 hover:bg-[#FF0000] hover:text-white hover:shadow-lg hover:shadow-red-500/30'
    };
  }
  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.com') || lowerUrl.includes('fb.me') || lowerName.includes('facebook') || lowerName.includes('فيسبوك') || lowerName.includes('فيس')) {
    return {
      platform: 'facebook',
      label: name || 'فيسبوك',
      colorClass: 'bg-blue-50 text-blue-600 hover:bg-[#1877F2] hover:text-white hover:shadow-lg hover:shadow-blue-500/30'
    };
  }
  if (lowerUrl.includes('instagram.com') || lowerUrl.includes('instagr.am') || lowerName.includes('instagram') || lowerName.includes('انستغرام') || lowerName.includes('إنستغرام') || lowerName.includes('انستا')) {
    return {
      platform: 'instagram',
      label: name || 'إنستغرام',
      colorClass: 'bg-pink-50 text-pink-600 hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white hover:shadow-lg hover:shadow-pink-500/30'
    };
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com') || lowerName.includes('twitter') || lowerName.includes('تويتر') || lowerName === 'x') {
    return {
      platform: 'x',
      label: name || 'إكس',
      colorClass: 'bg-gray-100 text-gray-900 hover:bg-black hover:text-white hover:shadow-lg hover:shadow-gray-900/30'
    };
  }
  if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram') || lowerName.includes('telegram') || lowerName.includes('تليجرام') || lowerName.includes('تلغرام') || lowerName.includes('تلي')) {
    return {
      platform: 'telegram',
      label: name || 'تليجرام',
      colorClass: 'bg-sky-50 text-sky-500 hover:bg-[#229ED9] hover:text-white hover:shadow-lg hover:shadow-sky-500/30'
    };
  }
  if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp.com') || lowerName.includes('whatsapp') || lowerName.includes('واتساب') || lowerName.includes('واتس')) {
    return {
      platform: 'whatsapp',
      label: name || 'واتساب',
      colorClass: 'bg-emerald-50 text-emerald-600 hover:bg-[#25D366] hover:text-white hover:shadow-lg hover:shadow-emerald-500/30'
    };
  }
  if (lowerUrl.includes('tiktok.com') || lowerName.includes('tiktok') || lowerName.includes('تيك توك') || lowerName.includes('تيكتوك')) {
    return {
      platform: 'tiktok',
      label: name || 'تيك توك',
      colorClass: 'bg-slate-100 text-slate-900 hover:bg-black hover:text-white hover:shadow-lg hover:shadow-slate-900/30'
    };
  }
  if (lowerUrl.includes('snapchat.com') || lowerName.includes('snapchat') || lowerName.includes('سناب') || lowerName.includes('سناب شات')) {
    return {
      platform: 'snapchat',
      label: name || 'سناب شات',
      colorClass: 'bg-yellow-50 text-amber-500 hover:bg-[#FFFC00] hover:text-black hover:shadow-lg hover:shadow-yellow-500/30'
    };
  }
  if (lowerUrl.includes('linkedin.com') || lowerName.includes('linkedin') || lowerName.includes('لينكدإن') || lowerName.includes('لينكد')) {
    return {
      platform: 'linkedin',
      label: name || 'لينكدإن',
      colorClass: 'bg-blue-50 text-blue-700 hover:bg-[#0A66C2] hover:text-white hover:shadow-lg hover:shadow-blue-500/30'
    };
  }
  if (lowerUrl.includes('pinterest.com') || lowerName.includes('pinterest') || lowerName.includes('بينترست')) {
    return {
      platform: 'pinterest',
      label: name || 'بينترست',
      colorClass: 'bg-red-50 text-red-700 hover:bg-[#E60023] hover:text-white hover:shadow-lg hover:shadow-red-500/30'
    };
  }

  return {
    platform: 'default',
    label: name || 'موقع',
    colorClass: 'bg-gray-100 text-gray-600 hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30'
  };
}

export function SocialPlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'youtube':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
        </svg>
      );
    case 'x':
      return (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'telegram':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.18-1.238-6.167-3.488-8.416"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 003 15.68 6.33 6.33 0 009.33 22a6.33 6.33 0 006.33-6.33V9.05a8.16 8.16 0 004.93 1.62V7.21a4.85 4.85 0 01-1-.52z"/>
        </svg>
      );
    case 'snapchat':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.001 2c-3.822 0-5.83 2.664-5.83 5.32 0 1.251.488 2.502.83 3.328-.27.18-.732.482-1.408.482-.416 0-.756-.126-.983-.243-.162-.083-.343-.095-.496-.017-.152.078-.239.237-.227.41.066.924.636 2.052 1.722 2.612-.047.387-.19.824-.61 1.29-.398.441-.955.77-1.744.978-.182.048-.309.206-.309.394 0 .216.163.393.376.417 1.05.12 2.05.518 2.83 1.155.197.161.42.247.652.247.288 0 .565-.133.743-.362.593-.762 1.486-1.121 2.455-1.121.97 0 1.862.359 2.455 1.121.178.229.455.362.743.362.232 0 .455-.086.652-.247.78-.637 1.78-1.035 2.83-1.155.213-.024.376-.201.376-.417 0-.188-.127-.346-.309-.394-.789-.208-1.346-.537-1.744-.978-.42-.466-.563-.903-.61-1.29 1.086-.56 1.656-1.688 1.722-2.612.012-.173-.075-.332-.227-.41-.153-.078-.334-.066-.496.017-.227.117-.567.243-.983.243-.676 0-1.138-.302-1.408-.482.342-.826.83-2.077.83-3.328 0-2.656-2.008-5.32-5.83-5.32z"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
        </svg>
      );
    case 'pinterest':
      return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026z"/>
        </svg>
      );
    default:
      return <Globe className="w-5 h-5" />;
  }
}

interface SocialLinksProps {
  className?: string;
}

export default function SocialLinks({ className = '' }: SocialLinksProps) {
  const { data: socialConfig } = useDoc('appConfig', 'social');

  const links: SocialLinkItem[] = (socialConfig?.links || []).filter((l: SocialLinkItem) => l.enabled !== false && l.url);

  if (!links || links.length === 0) return null;

  return (
    <div className={cn("flex items-center justify-center gap-2.5 flex-wrap pt-2 pb-1", className)}>
      {links.map((link) => {
        const info = getSocialPlatformInfo(link.url, link.name);
        
        let href = (link.url || '').trim();
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          href = `https://${href}`;
        }

        return (
          <a
            key={link.id || link.url}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.name || info.label}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm active:scale-95 hover:scale-110 shrink-0",
              info.colorClass
            )}
          >
            <SocialPlatformIcon platform={info.platform} />
          </a>
        );
      })}
    </div>
  );
}
