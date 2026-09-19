import React from 'react';
import {
  Globe,
  ExternalLink,
  Link as LinkIcon,
  Compass,
  Navigation,
  Bookmark,
  Layers,
  FileText,
  Shield,
  ShieldCheck,
  FileCheck,
  Info,
  HelpCircle,
  BookOpen,
  Scale,
  Lock,
  Heart,
  Star,
  Sparkles,
  Crown,
  Zap,
  Award,
  MessageSquare,
  MessageCircle,
  Phone,
  Mail,
  Send,
  Share2,
  Instagram,
  Twitter,
  Youtube,
  ShoppingBag,
  Store,
  Tag,
  Download,
  Smartphone,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';

export interface PageIconOption {
  id: string;
  name: string;
  icon: LucideIcon;
  category: string;
}

export const PAGE_ICON_OPTIONS: PageIconOption[] = [
  // عام وروابط خارجية
  { id: 'Globe', name: 'موقع إلكتروني', icon: Globe, category: 'روابط ومواقع' },
  { id: 'ExternalLink', name: 'رابط خارجي', icon: ExternalLink, category: 'روابط ومواقع' },
  { id: 'Link', name: 'رابط مباشر', icon: LinkIcon, category: 'روابط ومواقع' },
  { id: 'Compass', name: 'دليل واستكشاف', icon: Compass, category: 'روابط ومواقع' },
  { id: 'Navigation', name: 'توجيه ومسار', icon: Navigation, category: 'روابط ومواقع' },
  { id: 'Bookmark', name: 'مفضلة ورابط محفوظ', icon: Bookmark, category: 'روابط ومواقع' },
  { id: 'Layers', name: 'خدمات وأقسام', icon: Layers, category: 'روابط ومواقع' },
  { id: 'Smartphone', name: 'تطبيق وجوال', icon: Smartphone, category: 'روابط ومواقع' },
  { id: 'Download', name: 'تنزيل وتحميل', icon: Download, category: 'روابط ومواقع' },

  // منصات وتواصل
  { id: 'Send', name: 'تيليجرام وقناة', icon: Send, category: 'تواصل واجتماعي' },
  { id: 'MessageCircle', name: 'واتساب ودردشة', icon: MessageCircle, category: 'تواصل واجتماعي' },
  { id: 'MessageSquare', name: 'تواصل ودعم', icon: MessageSquare, category: 'تواصل واجتماعي' },
  { id: 'Instagram', name: 'انستقرام', icon: Instagram, category: 'تواصل واجتماعي' },
  { id: 'Twitter', name: 'تويتر / X', icon: Twitter, category: 'تواصل واجتماعي' },
  { id: 'Youtube', name: 'يوتيوب وقناة', icon: Youtube, category: 'تواصل واجتماعي' },
  { id: 'Share2', name: 'مشاركة ومجتمع', icon: Share2, category: 'تواصل واجتماعي' },
  { id: 'Mail', name: 'بريد ومراسلة', icon: Mail, category: 'تواصل واجتماعي' },
  { id: 'Phone', name: 'اتصال ومساعدة', icon: Phone, category: 'تواصل واجتماعي' },

  // متاجر وتميز
  { id: 'ShoppingBag', name: 'متجر وشراء', icon: ShoppingBag, category: 'متاجر وتميز' },
  { id: 'Store', name: 'منصة تسوق', icon: Store, category: 'متاجر وتميز' },
  { id: 'Crown', name: 'عضوية واشتراك مميز', icon: Crown, category: 'متاجر وتميز' },
  { id: 'Sparkles', name: 'ميزات وجديد', icon: Sparkles, category: 'متاجر وتميز' },
  { id: 'Star', name: 'تقييم ومميزات', icon: Star, category: 'متاجر وتميز' },
  { id: 'Award', name: 'جوائز واعتمادات', icon: Award, category: 'متاجر وتميز' },
  { id: 'Zap', name: 'خدمات سريعة', icon: Zap, category: 'متاجر وتميز' },
  { id: 'Heart', name: 'شكر ومفضلة', icon: Heart, category: 'متاجر وتميز' },

  // معلومات ومساعدة
  { id: 'Info', name: 'عن التطبيق / معلومات', icon: Info, category: 'معلومات ومساعدة' },
  { id: 'HelpCircle', name: 'مساعدة وأسئلة شائعة', icon: HelpCircle, category: 'معلومات ومساعدة' },
  { id: 'BookOpen', name: 'دليل وإرشادات', icon: BookOpen, category: 'معلومات ومساعدة' },
  { id: 'FileText', name: 'مستند عام', icon: FileText, category: 'معلومات ومساعدة' },
  { id: 'AlertCircle', name: 'تنبيه وإخلاء مسؤولية', icon: AlertCircle, category: 'معلومات ومساعدة' },

  // أمان وشروط
  { id: 'Shield', name: 'حماية وخصوصية', icon: Shield, category: 'أمان وقانون' },
  { id: 'ShieldCheck', name: 'أمان وتحقق', icon: ShieldCheck, category: 'أمان وقانون' },
  { id: 'Scale', name: 'قوانين وشروط', icon: Scale, category: 'أمان وقانون' },
  { id: 'FileCheck', name: 'اتفاقية واستخدام', icon: FileCheck, category: 'أمان وقانون' },
  { id: 'Lock', name: 'حماية البيانات', icon: Lock, category: 'أمان وقانون' },
];

export const ICON_MAP: Record<string, LucideIcon> = PAGE_ICON_OPTIONS.reduce((acc, curr) => {
  acc[curr.id] = curr.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

export function getPageIcon(iconName?: string): LucideIcon {
  if (!iconName) return Globe;
  return ICON_MAP[iconName] || Globe;
}

export function slugifyArabic(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '') // Keep alphanumeric, spaces, and Arabic letters
    .replace(/[\s_]+/g, '-')              // Replace spaces with hyphen
    .replace(/^-+|-+$/g, '');             // Trim leading/trailing hyphens
}
