'use client';
import { useState, useEffect } from 'react';
import { useAuth, useCollection, useDoc, handleFirestoreError, OperationType } from '@/hooks/useFirebase';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { cn, isPinterestUrl, resolvePinterestUrl, getDirectLink, isFirebaseUrl, convertFirebaseToDirectUrl, isMediaFireUrl, resolveMediaFireUrl, isMediaFireDirectUrl } from '@/lib/utils';
import { Shield, Globe, Database, AlertTriangle, CheckCircle, Copy, LogIn, Plus, FolderPlus, FilePlus, List, ChevronDown, ChevronUp, Trash2, Palette, BellRing, Send, Lock, Download, Edit3, ChevronRight, X, Settings, UserPlus, MessageSquare, MessageCircle, User, ShieldCheck, Bell, MousePointer2, Hammer, Ticket, Zap, Home, Users, ArrowUp, ArrowDown, Info, Heart, Star, Target, Rocket, Award, Instagram, Twitter, Github, MapPin, Clock, Phone, Mail, ExternalLink, Share2, Wrench, Power, Eye, KeyRound, Code2, Terminal, Check, EyeOff, Type, Upload, Sparkles, RefreshCw, BookOpen, Layers, Search, FolderInput, CheckSquare, Square, ArrowRightLeft, FileText } from 'lucide-react';
import SocialLinks, { SocialPlatformIcon, getSocialPlatformInfo, SocialLinkItem } from '@/components/SocialLinks';
import MaintenanceView from '@/components/MaintenanceView';
import BlogsManager from '@/components/admin/BlogsManager';
import PagesManager from '@/components/admin/PagesManager';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, writeBatch, deleteField } from 'firebase/firestore';
const iconMap: Record<string, any> = {
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Send,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  Github,
  Globe,
  Settings,
  Shield,
  Palette,
  Bell,
  Info,
  User,
  Users,
  Target,
  Rocket,
  Award
};
import { triggerAppShare } from '@/components/AppShareModal';

const POPULAR_PROMPT_APPS = [
  'Midjourney',
  'ChatGPT',
  'Flux',
  'Leonardo AI',
  'Ideogram',
  'Stable Diffusion',
  'Photoshop',
  'Illustrator',
  'Canva',
  'DALL·E 3',
  'Recraft',
  'Runway',
  'SeaArt',
  'Krea AI'
];

export default function AdminPage() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAdmin, isEditor, loading, loginWithGoogle, logout } = useAuth();
  const [currentDomain, setCurrentDomain] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'users' | 'content' | 'blogs' | 'pages' | 'colors' | 'notifications' | 'dialog' | 'floatingButton' | 'about' | 'contact' | 'social' | 'security' | 'maintenance' | 'share' | 'appName' | 'font'>('menu');
  const [viewLevel, setViewLevel] = useState<'categories' | 'subcategories' | 'items'>('categories');
  const router = useRouter();
  // User Management State
  const { data: whitelistData } = useCollection(isAdmin ? 'whitelist' : '');
  const [newUserId, setNewUserId] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor');
  // System Management State
  const { data: theme } = useDoc('appConfig', 'theme');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [darkPrimaryColor, setDarkPrimaryColor] = useState('#3B82F6');
  const [backgroundColor, setBackgroundColor] = useState('#F8F9FC');
  const [darkBackgroundColor, setDarkBackgroundColor] = useState('#020617');
  const [cardColor, setCardColor] = useState('#ffffff');
  const [darkCardColor, setDarkCardColor] = useState('#020617');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'high-contrast'>('light');
  const [autoThemeEnabled, setAutoThemeEnabled] = useState(false);
  const [autoThemeMode, setAutoThemeMode] = useState<'system' | 'time'>('system');
  const [autoThemeDarkStart, setAutoThemeDarkStart] = useState('18:00');
  const [autoThemeDarkEnd, setAutoThemeDarkEnd] = useState('06:00');
  const [useGradient, setUseGradient] = useState(false);
  const [gradientStart, setGradientStart] = useState('#3B82F6');
  const [gradientEnd, setGradientEnd] = useState('#8B5CF6');
  const [darkGradientStart, setDarkGradientStart] = useState('#3B82F6');
  const [darkGradientEnd, setDarkGradientEnd] = useState('#8B5CF6');
  const [bottomNavColor, setBottomNavColor] = useState('#ffffff');
  const [darkBottomNavColor, setDarkBottomNavColor] = useState('#020617');
  useEffect(() => {
    if (theme?.primaryColor) setPrimaryColor(theme.primaryColor);
    if (theme?.darkPrimaryColor) setDarkPrimaryColor(theme.darkPrimaryColor);
    if (theme?.backgroundColor) setBackgroundColor(theme.backgroundColor);
    if (theme?.darkBackgroundColor) setDarkBackgroundColor(theme.darkBackgroundColor);
    if (theme?.cardColor) setCardColor(theme.cardColor);
    if (theme?.darkCardColor) setDarkCardColor(theme.darkCardColor);
    if (theme?.themeMode) setThemeMode(theme.themeMode);
    if (theme?.autoThemeEnabled !== undefined) setAutoThemeEnabled(theme.autoThemeEnabled);
    if (theme?.autoThemeMode) setAutoThemeMode(theme.autoThemeMode);
    if (theme?.autoThemeDarkStart) setAutoThemeDarkStart(theme.autoThemeDarkStart);
    if (theme?.autoThemeDarkEnd) setAutoThemeDarkEnd(theme.autoThemeDarkEnd);
    if (theme?.useGradient !== undefined) setUseGradient(theme.useGradient);
    if (theme?.gradientStart) setGradientStart(theme.gradientStart);
    if (theme?.gradientEnd) setGradientEnd(theme.gradientEnd);
    if (theme?.darkGradientStart) setDarkGradientStart(theme.darkGradientStart);
    if (theme?.darkGradientEnd) setDarkGradientEnd(theme.darkGradientEnd);
    if (theme?.bottomNavColor) setBottomNavColor(theme.bottomNavColor);
    if (theme?.darkBottomNavColor) setDarkBottomNavColor(theme.darkBottomNavColor);
  }, [theme]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifLink, setNotifLink] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [customAppInput, setCustomAppInput] = useState('');
  const [resolvingPinterestField, setResolvingPinterestField] = useState<string | null>(null);

  const handleUrlAutoConvert = async (
    rawUrl: string,
    fieldKey: string,
    onSuccess: (directUrl: string) => void
  ) => {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const trimmed = rawUrl.trim();

    // 1. MediaFire URL Auto Conversion (mediafire.com/file/... -> direct CDN download link)
    if (isMediaFireUrl(trimmed)) {
      if (isMediaFireDirectUrl(trimmed)) {
        return;
      }
      setResolvingPinterestField(fieldKey);
      try {
        const result = await resolveMediaFireUrl(trimmed);
        if (result.directUrl && result.directUrl !== trimmed) {
          onSuccess(result.directUrl);
          toast({
            title: "⚡ تم تحويل رابط ميديا فاير تلقائياً",
            description: "تم استخراج رابط التحميل المباشر من MediaFire بنجاح لبدء التنزيل الفوري!",
          });
        }
      } catch (e) {
        console.error("MediaFire auto convert error:", e);
      } finally {
        setResolvingPinterestField(null);
      }
      return;
    }

    // 2. Firebase URL Auto Conversion (gs://, console urls, alt=media, storage.googleapis.com)
    if (isFirebaseUrl(trimmed)) {
      const directFirebase = convertFirebaseToDirectUrl(trimmed);
      if (directFirebase && directFirebase !== trimmed) {
        onSuccess(directFirebase);
        toast({
          title: "⚡ تم تحويل رابط فايربيس تلقائياً",
          description: "تم تحويل رابط Firebase Storage إلى رابط تحميل مباشر (alt=media) بنجاح!",
        });
        return;
      }
    }

    // 3. Google Drive / GitHub / Dropbox conversion
    const directOther = getDirectLink(trimmed);
    if (directOther && directOther !== trimmed && !isPinterestUrl(trimmed) && !isMediaFireUrl(trimmed)) {
      onSuccess(directOther);
      toast({
        title: "⚡ تم تحويل الرابط تلقائياً",
        description: "تم تحويل الرابط إلى رابط مباشر بنجاح!",
      });
      return;
    }

    // 4. Pinterest URL Auto Conversion
    if (isPinterestUrl(trimmed)) {
      if (trimmed.includes('i.pinimg.com') && (trimmed.includes('/originals/') || trimmed.includes('/736x/'))) {
        return;
      }

      setResolvingPinterestField(fieldKey);
      try {
        const direct = await resolvePinterestUrl(trimmed);
        if (direct && direct !== trimmed) {
          onSuccess(direct);
          toast({
            title: "⚡ تم تحويل رابط بينترست تلقائياً",
            description: "تم استخراج وتحويل الرابط إلى رابط صورة مباشر عالي الدقة (i.pinimg.com) بنجاح!",
          });
        }
      } catch (e) {
        console.error("Pinterest auto convert error:", e);
      } finally {
        setResolvingPinterestField(null);
      }
      return;
    }
  };

  const handlePinterestAutoConvert = handleUrlAutoConvert;
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<{type: 'category' | 'subcategory', id: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryViewTab, setCategoryViewTab] = useState<'all' | 'subcategories' | 'items'>('all');
  // Content selection and transfer state
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [transferModal, setTransferModal] = useState<{ itemIds: string[] } | null>(null);
  const [targetDestinationId, setTargetDestinationId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [transferTab, setTransferTab] = useState<'subs' | 'all'>('subs');

  const handleSetViewLevel = (level: 'categories' | 'subcategories' | 'items') => {
    setViewLevel(level);
    setSearchQuery('');
    setCategoryViewTab('all');
    setSelectedItemIds([]);
    setTransferModal(null);
  };
  const handleSetSelectedManager = (idObj: {type: 'category' | 'subcategory', id: string} | null) => {
    setSelectedManagerId(idObj);
    setSearchQuery('');
    setCategoryViewTab('all');
    setSelectedItemIds([]);
    setTransferModal(null);
  };
  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: string, label: string } | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(0);
  const [canDelete, setCanDelete] = useState(false);
  useEffect(() => {
    let timer: any;
    if (deleteConfirm && deleteCountdown > 0) {
      timer = setInterval(() => {
        setDeleteCountdown(prev => prev - 1);
      }, 1000);
    } else if (deleteCountdown === 0 && deleteConfirm) {
      setCanDelete(true);
    }
    return () => clearInterval(timer);
  }, [deleteConfirm, deleteCountdown]);
  const initiateDelete = (id: string, type: string, label: string) => {
    setDeleteConfirm({ id, type, label });
    setDeleteCountdown(5);
    setCanDelete(false);
  };
  // Dialog State
  const { data: dialogConfig } = useDoc('appConfig', 'dialog');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogCancelText, setDialogCancelText] = useState('إلغاء');
  const [dialogActionText, setDialogActionText] = useState('اشتراك الآن');
  const [dialogActionUrl, setDialogActionUrl] = useState('');
  const [dialogFrequency, setDialogFrequency] = useState(24); // hours
  const [dialogFrequencyUnit, setDialogFrequencyUnit] = useState<'hours' | 'minutes'>('hours');
  const [isDialogActive, setIsDialogActive] = useState(false);
  // About Page State
  const { data: aboutConfig } = useDoc('appConfig', 'about');
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutSubtitle, setAboutSubtitle] = useState('');
  const [aboutDeveloperName, setAboutDeveloperName] = useState('');
  const [aboutPhoneNumber, setAboutPhoneNumber] = useState('');
  const [aboutHidePhoneNumber, setAboutHidePhoneNumber] = useState(false);
  const [aboutVersionStatus, setAboutVersionStatus] = useState('');
  const [aboutRating, setAboutRating] = useState(5);
  const [aboutWhatsappNumber, setAboutWhatsappNumber] = useState('');
  const [aboutWhatsappText, setAboutWhatsappText] = useState('');
  const [aboutShowWhatsapp, setAboutShowWhatsapp] = useState(true);
  const [aboutWebLink, setAboutWebLink] = useState('');
  const [aboutWebLinkText, setAboutWebLinkText] = useState('');
  const [aboutWebLinkPlatform, setAboutWebLinkPlatform] = useState('auto');
  const [aboutSecondaryLink, setAboutSecondaryLink] = useState('');
  const [aboutSecondaryLinkText, setAboutSecondaryLinkText] = useState('');
  const [aboutSecondaryLinkPlatform, setAboutSecondaryLinkPlatform] = useState('auto');
  const [aboutLogoImage, setAboutLogoImage] = useState('');
  const [aboutDescription, setAboutDescription] = useState('');
  const [aboutVision, setAboutVision] = useState('');
  const [aboutHeroImage, setAboutHeroImage] = useState('');
  const [aboutFeatures, setAboutFeatures] = useState<any[]>([]);
  // Contact Page State
  const { data: contactConfig } = useDoc('appConfig', 'contact');
  const [contactTitle, setContactTitle] = useState('');
  const [contactSubtitle, setContactSubtitle] = useState('');
  const [contactBtnLink, setContactBtnLink] = useState('');
  const [isContactBtnActive, setIsContactBtnActive] = useState(false);
  // Floating Button State
  const { data: fbConfig } = useDoc('appConfig', 'floatingButton');
  const [fbLabel, setFbLabel] = useState('');
  const [fbLink, setFbLink] = useState('');
  const [fbDuration, setFbDuration] = useState(30);
  const [isFbActive, setIsFbActive] = useState(false);
  const [globalShowShareButton, setGlobalShowShareButton] = useState(true);
  // Security Config State
  const { data: securityConfig } = useDoc('appConfig', 'security');
  const [preventCopy, setPreventCopy] = useState(true);
  const [preventContextMenu, setPreventContextMenu] = useState(true);
  // Social Config State
  const { data: socialConfig } = useDoc('appConfig', 'social');
  const [socialLinksList, setSocialLinksList] = useState<SocialLinkItem[]>([]);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  // Maintenance Config State
  const { data: maintenanceConfig } = useDoc('appConfig', 'maintenance');
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('الموقع قيد الصيانة والتحديث');
  const [maintenanceMessage, setMaintenanceMessage] = useState('نعمل حالياً على إجراء تحديثات وتطويرات مهمة لنقدم لكم أفضل تجربة تصميم وأداء. يرجى العودة لاحقاً.');
  const [maintenanceEstimatedTime, setMaintenanceEstimatedTime] = useState('ساعتين');
  const [maintenanceShowSocial, setMaintenanceShowSocial] = useState(true);
  const [maintenanceWhatsapp, setMaintenanceWhatsapp] = useState('');
  const [maintenanceTelegram, setMaintenanceTelegram] = useState('');

  useEffect(() => {
    if (maintenanceConfig) {
      setMaintenanceEnabled(maintenanceConfig.isEnabled ?? false);
      setMaintenanceTitle(maintenanceConfig.title || 'الموقع قيد الصيانة والتحديث');
      setMaintenanceMessage(maintenanceConfig.message || 'نعمل حالياً على إجراء تحديثات وتطويرات مهمة لنقدم لكم أفضل تجربة تصميم وأداء. يرجى العودة لاحقاً.');
      setMaintenanceEstimatedTime(maintenanceConfig.estimatedTime || 'ساعتين');
      setMaintenanceShowSocial(maintenanceConfig.showSocialLinks !== false);
      setMaintenanceWhatsapp(maintenanceConfig.whatsappNumber || '');
      setMaintenanceTelegram(maintenanceConfig.telegramUsername || '');
    }
  }, [maintenanceConfig]);

  // Share App Config State
  const { data: shareConfig } = useDoc('appConfig', 'share');
  const [shareTitle, setShareTitle] = useState('تطبيق رفيق المصمم');
  const [shareText, setShareText] = useState('تطبيق رفيق المصمم - منصتك المتكاملة لأفضل الملحقات والتصاميم والخطوط. حمل التطبيق الآن واستفد من كافة المميزات!');
  const [shareUrl, setShareUrl] = useState('');
  const [shareEnabled, setShareEnabled] = useState(true);

  useEffect(() => {
    if (shareConfig) {
      setShareTitle(shareConfig.title || 'تطبيق رفيق المصمم');
      setShareText(shareConfig.text || 'تطبيق رفيق المصمم - منصتك المتكاملة لأفضل الملحقات والتصاميم والخطوط. حمل التطبيق الآن واستفد من كافة المميزات!');
      setShareUrl(shareConfig.url || '');
      setShareEnabled(shareConfig.enabled !== false);
    }
  }, [shareConfig]);

  const handleSaveShareConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'share'), {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
        enabled: shareEnabled,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم حفظ إعدادات مشاركة التطبيق بنجاح.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/share');
    } finally {
      setIsSaving(false);
    }
  };

  // General App Identity (App Name & Logo & Splash Text) State
  const { data: generalConfig } = useDoc('appConfig', 'general');
  const [appNameInput, setAppNameInput] = useState('رفيق المصمم');
  const [appSubtitleInput, setAppSubtitleInput] = useState('');
  const [splashWelcomeInput, setSplashWelcomeInput] = useState('');
  const [appLogoInput, setAppLogoInput] = useState('');

  useEffect(() => {
    if (generalConfig) {
      if (generalConfig.appName !== undefined) {
        setAppNameInput(generalConfig.appName);
      } else if (aboutConfig?.appName || aboutConfig?.title) {
        setAppNameInput(aboutConfig.appName || aboutConfig.title);
      }
      if (generalConfig.appSubtitle !== undefined) {
        setAppSubtitleInput(generalConfig.appSubtitle);
      }
      if (generalConfig.splashWelcomeText !== undefined) {
        setSplashWelcomeInput(generalConfig.splashWelcomeText);
      }
      if (generalConfig.appLogo !== undefined) {
        setAppLogoInput(generalConfig.appLogo);
      } else if (aboutConfig?.appLogoImage || aboutConfig?.logoImage) {
        setAppLogoInput(aboutConfig.appLogoImage || aboutConfig.logoImage);
      }
    } else if (aboutConfig) {
      if (aboutConfig.appName || aboutConfig.title) {
        setAppNameInput(aboutConfig.appName || aboutConfig.title);
      }
      if (aboutConfig.subtitle !== undefined) {
        setAppSubtitleInput(aboutConfig.subtitle);
      }
      if (aboutConfig.appLogoImage || aboutConfig.logoImage) {
        setAppLogoInput(aboutConfig.appLogoImage || aboutConfig.logoImage);
      }
    }
  }, [generalConfig, aboutConfig]);

  const handleLogoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'الصورة كبيرة جداً',
        description: 'يرجى اختيار صورة بحجم أقل من 2 ميجابايت.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAppLogoInput(dataUrl);
      toast({
        title: 'تم اختيار صورة الشعار',
        description: 'اضغط حفظ لتطبيق الشعار الجديد على شاشة البداية وكافة واجهات التطبيق.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAppName = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'general'), {
        appName: appNameInput,
        appSubtitle: appSubtitleInput,
        splashWelcomeText: splashWelcomeInput,
        appLogo: appLogoInput,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      await setDoc(doc(db, 'appConfig', 'about'), {
        appName: appNameInput,
        title: appNameInput,
        subtitle: appSubtitleInput,
        appLogoImage: appLogoInput,
        logoImage: appLogoInput,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast({
        title: 'تم التحديث بنجاح',
        description: 'تم تحديث نصوص وشعار شاشة البداية والتطبيق بنجاح.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/general');
    } finally {
      setIsSaving(false);
    }
  };

  // Custom Font Config State
  const { data: dbFontConfig } = useDoc('appConfig', 'font');
  const [fontType, setFontType] = useState<'preset' | 'custom_file' | 'custom_url' | 'default'>('default');
  const [presetFont, setPresetFont] = useState('Cairo');
  const [customFontName, setCustomFontName] = useState('');
  const [customFontDataUrl, setCustomFontDataUrl] = useState('');
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [fontFormat, setFontFormat] = useState('truetype');
  const [fontFileName, setFontFileName] = useState('');
  const [fontFileSize, setFontFileSize] = useState('');

  useEffect(() => {
    if (dbFontConfig) {
      setFontType(dbFontConfig.fontType || 'default');
      setPresetFont(dbFontConfig.presetFont || 'Cairo');
      setCustomFontName(dbFontConfig.customFontName || '');
      setCustomFontDataUrl(dbFontConfig.customFontDataUrl || '');
      setCustomFontUrl(dbFontConfig.customFontUrl || '');
      setFontFormat(dbFontConfig.fontFormat || 'truetype');
      setFontFileName(dbFontConfig.fontFileName || '');
    }
  }, [dbFontConfig]);

  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'الملف كبير جداً',
        description: 'يرجى اختيار ملف خط بحجم أقل من 2 ميجابايت.',
      });
      return;
    }

    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    setFontFileName(file.name);
    setFontFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setCustomFontName(nameWithoutExt);

    let format = 'truetype';
    if (file.name.endsWith('.woff2')) format = 'woff2';
    else if (file.name.endsWith('.woff')) format = 'woff';
    else if (file.name.endsWith('.otf')) format = 'opentype';
    setFontFormat(format);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomFontDataUrl(dataUrl);
      setFontType('custom_file');
      toast({
        title: 'تم قراءة ملف الخط بنجاح',
        description: `تم تجهيز الخط "${file.name}". اضغط حفظ لتطبيقه على كافة أجزاء التطبيق.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFontConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'font'), {
        fontType,
        presetFont,
        customFontName,
        customFontDataUrl,
        customFontUrl,
        fontFormat,
        fontFileName,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: 'تم حفظ إعدادات الخط',
        description: 'تم تحديث الخط وتطبيقه على كافة أجهزة مستخدمي التطبيق بنجاح.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/font');
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveMaintenance = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'maintenance'), {
        isEnabled: maintenanceEnabled,
        title: maintenanceTitle,
        message: maintenanceMessage,
        estimatedTime: maintenanceEstimatedTime,
        showSocialLinks: maintenanceShowSocial,
        whatsappNumber: maintenanceWhatsapp,
        telegramUsername: maintenanceTelegram,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({
        title: "تم النجاح",
        description: maintenanceEnabled ? "تم تفعيل وضع صيانة الموقع بنجاح!" : "تم إيقاف وضع صيانة الموقع بنجاح!"
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/maintenance');
    } finally {
      setIsSaving(false);
    }
  };
  const handleQuickToggleMaintenance = async (newState: boolean) => {
    setMaintenanceEnabled(newState);
    try {
      await setDoc(doc(db, 'appConfig', 'maintenance'), {
        isEnabled: newState,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({
        title: newState ? "تم تفعيل الصيانة" : "تم إيقاف الصيانة",
        description: newState ? "الموقع الآن في وضع الصيانة للزوار" : "الموقع الآن متاح للزوار بشكل طبيعي",
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/maintenance');
    }
  };


  useEffect(() => {
    if (socialConfig?.links) {
      setSocialLinksList(socialConfig.links);
    }
  }, [socialConfig]);
  const handleAddSocialLink = () => {
    if (!newSocialUrl.trim()) {
      toast({ title: "تنبيه", description: "يرجى إضافة رابط المنصة", variant: "destructive" });
      return;
    }
    const info = getSocialPlatformInfo(newSocialUrl, newSocialName);
    const newLink: SocialLinkItem = {
      id: Date.now().toString(),
      name: newSocialName.trim() || info.label,
      url: newSocialUrl.trim(),
      enabled: true
    };
    setSocialLinksList(prev => [...prev, newLink]);
    setNewSocialName('');
    setNewSocialUrl('');
    toast({ title: "تم الإضافة", description: `تمت إضافة ${newLink.name} بنجاح!` });
  };
  const handleRemoveSocialLink = (id: string) => {
    setSocialLinksList(prev => prev.filter(item => item.id !== id));
  };
  const handleToggleSocialLink = (id: string) => {
    setSocialLinksList(prev => prev.map(item => item.id === id ? { ...item, enabled: item.enabled === false } : item));
  };
  const handleSaveSocialLinks = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'social'), {
        links: socialLinksList,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم الحفظ", description: "تم حفظ روابط مواقع التواصل الاجتماعي بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/social');
    } finally {
      setIsSaving(false);
    }
  };
  // Dynamic Contacts State
  const { data: contactsData } = useCollection(isAdmin ? 'contacts' : '');
  const [editingContact, setEditingContact] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  useEffect(() => {
    if (dialogConfig) {
      setDialogTitle(dialogConfig.title || '');
      setDialogMessage(dialogConfig.message || '');
      setDialogCancelText(dialogConfig.cancelText || 'إلغاء');
      setDialogActionText(dialogConfig.actionText || 'اشتراك الآن');
      setDialogActionUrl(dialogConfig.actionUrl || '');
      setDialogFrequency(dialogConfig.frequency || 24);
      setDialogFrequencyUnit(dialogConfig.frequencyUnit || 'hours');
      setIsDialogActive(dialogConfig.isActive || false);
    }
  }, [dialogConfig]);
  useEffect(() => {
    if (aboutConfig) {
      setAboutTitle(aboutConfig.title || aboutConfig.appName || 'رفيق المصمم');
      setAboutSubtitle(aboutConfig.subtitle || 'شريكك الإبداعي في كل خطوة');
      setAboutDeveloperName(aboutConfig.developerName || 'YOSSEF / تطوير');
      setAboutPhoneNumber(aboutConfig.phoneNumber || '01029892573');
      setAboutHidePhoneNumber(aboutConfig.hidePhoneNumber ?? false);
      setAboutVersionStatus(aboutConfig.versionStatus || 'إصدار مكتمل ومستقر');
      setAboutRating(typeof aboutConfig.rating === 'number' ? aboutConfig.rating : 5);
      setAboutShowWhatsapp(aboutConfig.showWhatsapp !== false);
      setAboutWhatsappNumber(aboutConfig.whatsappNumber || '01029892573');
      setAboutWhatsappText(aboutConfig.whatsappText || 'تواصل عبر واتساب مباشر (01029892573)');
      setAboutWebLink(aboutConfig.webLink || '');
      setAboutWebLinkText(aboutConfig.webLinkText || 'زيارة الموقع الإلكتروني');
      setAboutWebLinkPlatform(aboutConfig.webLinkPlatform || 'auto');
      setAboutSecondaryLink(aboutConfig.secondaryLink || '');
      setAboutSecondaryLinkText(aboutConfig.secondaryLinkText || '');
      setAboutSecondaryLinkPlatform(aboutConfig.secondaryLinkPlatform || 'auto');
      setAboutLogoImage(aboutConfig.logoImage || '');
      setAboutDescription(aboutConfig.description || '');
      setAboutVision(aboutConfig.vision || '');
      setAboutHeroImage(aboutConfig.heroImage || '');
      setAboutFeatures(aboutConfig.features || []);
    } else {
      setAboutTitle('رفيق المصمم');
      setAboutSubtitle('شريكك الإبداعي في كل خطوة');
      setAboutDeveloperName('YOSSEF / تطوير');
      setAboutPhoneNumber('01029892573');
      setAboutHidePhoneNumber(false);
      setAboutVersionStatus('إصدار مكتمل ومستقر');
      setAboutRating(5);
      setAboutShowWhatsapp(true);
      setAboutWhatsappNumber('01029892573');
      setAboutWhatsappText('تواصل عبر واتساب مباشر (01029892573)');
      setAboutWebLink('');
      setAboutWebLinkText('زيارة الموقع الإلكتروني');
      setAboutWebLinkPlatform('auto');
      setAboutSecondaryLink('');
      setAboutSecondaryLinkText('');
      setAboutSecondaryLinkPlatform('auto');
      setAboutLogoImage('');
    }
  }, [aboutConfig]);
  useEffect(() => {
    if (contactConfig) {
      setContactTitle(contactConfig.title || '');
      setContactSubtitle(contactConfig.subtitle || '');
      setContactBtnLink(contactConfig.whatsAppUrl || '');
      setIsContactBtnActive(contactConfig.showWhatsAppBtn || false);
    }
  }, [contactConfig]);
  useEffect(() => {
    if (fbConfig) {
      setFbLabel(fbConfig.label || '');
      setFbLink(fbConfig.link || '');
      setFbDuration(fbConfig.duration || 30);
      setIsFbActive(fbConfig.isActive || false);
    }
  }, [fbConfig]);
  useEffect(() => {
    if (securityConfig) {
      setPreventCopy(securityConfig.preventCopy ?? true);
      setPreventContextMenu(securityConfig.preventContextMenu ?? true);
      if (securityConfig.showShareButton !== undefined) {
        setGlobalShowShareButton(securityConfig.showShareButton);
      } else if (securityConfig.globalShowShareButton !== undefined) {
        setGlobalShowShareButton(securityConfig.globalShowShareButton);
      }
    }
  }, [securityConfig]);
  const { data: allCategoriesData } = useCollection(isAdmin ? 'categories' : '');
  const { data: notifications } = useCollection(isAdmin ? 'notifications' : '');
  // Items fetching based on selection
  const itemsPath = (isAdmin && selectedManagerId?.id) ? `categories/${selectedManagerId.id}/items` : null;
  const { data: itemsData } = useCollection(itemsPath || '');
  const allCategories = (allCategoriesData || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const categories = allCategories.filter(c => !c.parentId);
  const subCategories = allCategories.filter(c => c.parentId);
  const items = itemsData || [];
  const contacts = (contactsData || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentParentStyle = (allCategoriesData || []).find(c => c.id === selectedManagerId?.id)?.displayStyle || 'style1';
  const relevantSubs = subCategories.filter(s => s.parentId === selectedManagerId?.id);
  const hasSubCategories = relevantSubs.length > 0;
  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentCat = categories[currentIndex];
    const targetCat = categories[targetIndex];
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'categories', currentCat.id), { order: targetIndex });
      await updateDoc(doc(db, 'categories', targetCat.id), { order: currentIndex });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveItem = async (itemId: string, direction: 'up' | 'down') => {
    if (!selectedManagerId?.id) return;
    const sorted = [...items].sort((a, b) => {
      if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
        return a.order - b.order;
      }
      return 0;
    });
    const currentIndex = sorted.findIndex(i => i.id === itemId);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sorted.length - 1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentItem = sorted[currentIndex];
    const targetItem = sorted[targetIndex];
    setIsSaving(true);
    try {
      const currentOrder = typeof targetItem.order === 'number' ? targetItem.order : targetIndex;
      const targetOrder = typeof currentItem.order === 'number' ? currentItem.order : currentIndex;
      await updateDoc(doc(db, 'categories', selectedManagerId.id, 'items', currentItem.id), { order: currentOrder });
      await updateDoc(doc(db, 'categories', selectedManagerId.id, 'items', targetItem.id), { order: targetOrder });
      toast({ title: "تم الترتيب", description: "تم تحديث ترتيب المنشور بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${selectedManagerId.id}/items`);
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.origin);
    }
  }, []);
  // Remove the automatic redirect to allow debugging
  // useEffect(() => {
  //   if (!loading && !isAdmin && user) {
  //     // If logged in but not admin, redirect home
  //     router.push('/');
  //   }
  // }, [isAdmin, loading, user, router]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'whitelist', newUserId.toLowerCase()), {
        email: newUserId.toLowerCase(),
        role: newUserRole,
        activatedByUid: user?.uid
      });
      setNewUserId('');
      toast({ title: "تم النجاح", description: "تم إضافة المستخدم بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'whitelist');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateDialog = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'dialog'), {
        title: dialogTitle,
        message: dialogMessage,
        cancelText: dialogCancelText,
        actionText: dialogActionText,
        actionUrl: dialogActionUrl,
        frequency: dialogFrequency,
        frequencyUnit: dialogFrequencyUnit,
        isActive: isDialogActive,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم النجاح", description: "تم تحديث إعدادات الديالوج بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/dialog');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateAbout = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'about'), {
        title: aboutTitle,
        appName: aboutTitle,
        subtitle: aboutSubtitle,
        developerName: aboutDeveloperName,
        phoneNumber: aboutPhoneNumber,
        hidePhoneNumber: aboutHidePhoneNumber,
        versionStatus: aboutVersionStatus,
        rating: aboutRating,
        showWhatsapp: aboutShowWhatsapp,
        whatsappNumber: aboutWhatsappNumber,
        whatsappText: aboutWhatsappText,
        webLink: aboutWebLink,
        webLinkText: aboutWebLinkText,
        webLinkPlatform: aboutWebLinkPlatform,
        secondaryLink: aboutSecondaryLink,
        secondaryLinkText: aboutSecondaryLinkText,
        secondaryLinkPlatform: aboutSecondaryLinkPlatform,
        logoImage: aboutLogoImage,
        description: aboutDescription,
        vision: aboutVision,
        heroImage: aboutHeroImage,
        features: aboutFeatures,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم النجاح", description: "تم تحديث إعدادات عن التطبيق بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/about');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateContact = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'contact'), {
        title: contactTitle,
        subtitle: contactSubtitle,
        showWhatsAppBtn: isContactBtnActive,
        whatsAppUrl: contactBtnLink,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم النجاح", description: "تم تحديث البيانات العامة بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/contact');
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveContactItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact?.label || !editingContact?.value) return;
    setIsSaving(true);
    try {
      const data = {
        label: editingContact.label,
        value: editingContact.value,
        type: editingContact.type || 'phone',
        icon: editingContact.icon || 'Phone',
        actionUrl: editingContact.actionUrl || '',
        order: editingContact.order || contacts.length,
        active: editingContact.active !== false,
        updatedAt: new Date().toISOString()
      };
      if (editingContact.id) {
        await updateDoc(doc(db, 'contacts', editingContact.id), data);
      } else {
        await addDoc(collection(db, 'contacts'), data);
      }
      setEditingContact(null);
      setIsContactModalOpen(false);
      toast({ title: "تم النجاح", description: "تم حفظ وسيلة التواصل بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, editingContact.id ? OperationType.UPDATE : OperationType.CREATE, 'contacts');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateFloatingButton = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'floatingButton'), {
        label: fbLabel,
        link: fbLink,
        duration: fbDuration,
        isActive: isFbActive,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم النجاح", description: "تم تحديث إعدادات الزر العائم بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/floatingButton');
    } finally {
      setIsSaving(false);
    }
  };
  const handleSaveSecurity = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'appConfig', 'security'), {
        preventCopy,
        preventContextMenu,
        showShareButton: globalShowShareButton,
        globalShowShareButton: globalShowShareButton,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "تم النجاح", description: "تم تحديث إعدادات حماية المحتوى والمشاركة بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/security');
    } finally {
      setIsSaving(false);
    }
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: editingCategory.name,
        fileTypes: editingCategory.fileTypes || 'XML',
        displayStyle: editingCategory.displayStyle || 'style1',
        subCategoryLayout: editingCategory.subCategoryLayout || 'vertical',
        isUnderMaintenance: editingCategory.isUnderMaintenance || false,
        isHidden: editingCategory.isHidden || false,
        showShareButton: editingCategory.showShareButton !== false,
        isNew: editingCategory.isNew !== undefined ? editingCategory.isNew : true,
        hasNewContent: true,
        accentColor: editingCategory.accentColor || '',
        useCustomAccent: editingCategory.useCustomAccent || false,
        order: categories.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setEditingCategory(null);
      toast({ title: "تم النجاح", description: "تم إضافة القسم بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteUser = async (email: string) => {
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'whitelist', email.toLowerCase()));
      setDeleteConfirm(null);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, 'whitelist');
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory?.name || !editingSubCategory?.categoryId) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'categories'), {
        parentId: editingSubCategory.categoryId,
        name: editingSubCategory.name,
        description: editingSubCategory.description || '',
        displayStyle: editingSubCategory.displayStyle || 'style1',
        fileTypes: editingSubCategory.fileTypes || '',
        isUnderMaintenance: editingSubCategory.isUnderMaintenance || false,
        isHidden: editingSubCategory.isHidden || false,
        showShareButton: editingSubCategory.showShareButton !== false,
        isNew: editingSubCategory.isNew !== undefined ? editingSubCategory.isNew : true,
        hasNewContent: true,
        accentColor: editingSubCategory.accentColor || '',
        useCustomAccent: editingSubCategory.useCustomAccent || false,
        order: subCategories.filter(s => s.parentId === editingSubCategory.categoryId).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      try {
        await updateDoc(doc(db, 'categories', editingSubCategory.categoryId), {
          hasNewContent: true,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed updating parent category new status:", err);
      }
      setEditingSubCategory(null);
      toast({ title: "تم النجاح", description: "تم إضافة القسم الفرعي بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.subCategoryId) return;
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      
      // Auto resolve MediaFire / Pinterest / Firebase / Google Drive URLs to direct links
      let finalImageUrl = getDirectLink(editingItem.imageUrl || editingItem.downloadUrl || '');
      if (isMediaFireUrl(finalImageUrl) && !isMediaFireDirectUrl(finalImageUrl)) {
        const mf = await resolveMediaFireUrl(finalImageUrl);
        if (mf.directUrl) finalImageUrl = mf.directUrl;
      } else if (isPinterestUrl(finalImageUrl) && !finalImageUrl.includes('i.pinimg.com')) {
        finalImageUrl = await resolvePinterestUrl(finalImageUrl);
      }
      
      let finalDownloadUrl = getDirectLink(editingItem.downloadUrl || '');
      if (isMediaFireUrl(finalDownloadUrl)) {
        const mf = await resolveMediaFireUrl(finalDownloadUrl);
        if (mf.permanentUrl) finalDownloadUrl = mf.permanentUrl;
        else if (mf.directUrl) finalDownloadUrl = mf.directUrl;
      } else if (isPinterestUrl(finalDownloadUrl) && !finalDownloadUrl.includes('i.pinimg.com')) {
        finalDownloadUrl = await resolvePinterestUrl(finalDownloadUrl);
      }
      
      let finalDownloadUrl2 = getDirectLink(editingItem.downloadUrl2 || '');
      if (isMediaFireUrl(finalDownloadUrl2)) {
        const mf = await resolveMediaFireUrl(finalDownloadUrl2);
        if (mf.permanentUrl) finalDownloadUrl2 = mf.permanentUrl;
        else if (mf.directUrl) finalDownloadUrl2 = mf.directUrl;
      } else if (isPinterestUrl(finalDownloadUrl2) && !finalDownloadUrl2.includes('i.pinimg.com')) {
        finalDownloadUrl2 = await resolvePinterestUrl(finalDownloadUrl2);
      }

      let finalMaterialsUrl = getDirectLink(editingItem.materialsUrl || '');
      if (isMediaFireUrl(finalMaterialsUrl)) {
        const mf = await resolveMediaFireUrl(finalMaterialsUrl);
        if (mf.permanentUrl) finalMaterialsUrl = mf.permanentUrl;
        else if (mf.directUrl) finalMaterialsUrl = mf.directUrl;
      } else if (isPinterestUrl(finalMaterialsUrl) && !finalMaterialsUrl.includes('i.pinimg.com')) {
        finalMaterialsUrl = await resolvePinterestUrl(finalMaterialsUrl);
      }

      let finalScreenshots = editingItem.screenshots || [];
      if (Array.isArray(finalScreenshots) && finalScreenshots.length > 0) {
        finalScreenshots = await Promise.all(
          finalScreenshots.map(async (s: string) => {
            let direct = getDirectLink(s);
            if (isPinterestUrl(direct) && !direct.includes('i.pinimg.com')) {
              return await resolvePinterestUrl(direct);
            }
            return direct;
          })
        );
      }

      await addDoc(collection(db, 'categories', editingItem.subCategoryId, 'items'), {
        title: editingItem.title,
        description: editingItem.description || '',
        downloadUrl: finalDownloadUrl,
        downloadUrlLabel: editingItem.downloadUrlLabel || '',
        downloadUrl2: finalDownloadUrl2,
        downloadUrl2Label: editingItem.downloadUrl2Label || '',
        videoUrl: editingItem.videoUrl || '',
        imageUrl: finalImageUrl,
        style: editingItem.style || '',
        rating: editingItem.rating || '',
        reviewCount: editingItem.reviewCount || '',
        ageRating: editingItem.ageRating || '',
        size: editingItem.size || '',
        screenshots: finalScreenshots,
        prompt: editingItem.prompt || '',
        promptInstructions: editingItem.promptInstructions || '',
        usedApps: Array.isArray(editingItem.usedApps) ? editingItem.usedApps : (editingItem.usedApps ? [editingItem.usedApps] : []),
        hasMaterials: !!editingItem.hasMaterials,
        materialsUrl: finalMaterialsUrl,
        materialsLabel: editingItem.materialsLabel || '',
        materialsDescription: editingItem.materialsDescription || '',
        sourceUrl: editingItem.sourceUrl || '',
        showCopyButton: editingItem.showCopyButton !== false,
        showDownloadButton: editingItem.showDownloadButton !== false,
        showShareButton: editingItem.showShareButton !== false,
        order: typeof editingItem.order === 'number' ? editingItem.order : (editingItem.order !== undefined && editingItem.order !== '' ? parseInt(editingItem.order) : items.length),
        isNew: true,
        createdAt: nowIso,
        updatedAt: nowIso
      });
      try {
        await updateDoc(doc(db, 'categories', editingItem.subCategoryId), {
          hasNewContent: true,
          lastContentAddedAt: nowIso,
          updatedAt: nowIso
        });
        const targetSub = subCategories.find(s => s.id === editingItem.subCategoryId);
        if (targetSub && targetSub.parentId) {
          await updateDoc(doc(db, 'categories', targetSub.parentId), {
            hasNewContent: true,
            lastContentAddedAt: nowIso,
            updatedAt: nowIso
          });
        }
      } catch (err) {
        console.error("Failed updating parent category new status on item creation:", err);
      }
      setEditingItem(null);
      toast({ title: "تم النجاح", description: "تم إضافة المحتوى بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${editingItem.subCategoryId}/items`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAllItems = (currentList: any[]) => {
    const listIds = currentList.map(i => i.id);
    const allSelected = listIds.length > 0 && listIds.every(id => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !listIds.includes(id)));
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...listIds])));
    }
  };

  const openSingleItemTransfer = (itemId: string) => {
    setTransferModal({ itemIds: [itemId] });
    setTargetDestinationId('');
    setTransferSearchQuery('');
    setTransferTab(relevantSubs.length > 0 ? 'subs' : 'all');
  };

  const openBatchTransfer = () => {
    if (selectedItemIds.length === 0) return;
    setTransferModal({ itemIds: [...selectedItemIds] });
    setTargetDestinationId('');
    setTransferSearchQuery('');
    setTransferTab(relevantSubs.length > 0 ? 'subs' : 'all');
  };

  const handleTransferItems = async () => {
    if (!transferModal || !selectedManagerId?.id || !targetDestinationId || transferModal.itemIds.length === 0) return;
    if (targetDestinationId === selectedManagerId.id) {
      toast({ title: "تنبيه", description: "لا يمكن النقل إلى نفس القسم الحالي!", variant: "destructive" });
      return;
    }

    setIsTransferring(true);
    try {
      const itemsToMove = items.filter(item => transferModal.itemIds.includes(item.id));
      if (itemsToMove.length === 0) {
        toast({ title: "تنبيه", description: "لم يتم العثور على المنشورات المحددة.", variant: "destructive" });
        return;
      }

      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      for (const item of itemsToMove) {
        const { id: itemId, ...itemData } = item;
        const targetDocRef = doc(db, 'categories', targetDestinationId, 'items', itemId);
        const sourceDocRef = doc(db, 'categories', selectedManagerId.id, 'items', itemId);

        const cleanData: Record<string, any> = {};
        Object.entries(itemData).forEach(([key, val]) => {
          if (val !== undefined) {
            cleanData[key] = val;
          }
        });
        cleanData.subCategoryId = targetDestinationId;
        cleanData.updatedAt = nowIso;

        batch.set(targetDocRef, cleanData);
        batch.delete(sourceDocRef);
      }

      await batch.commit();

      try {
        await updateDoc(doc(db, 'categories', targetDestinationId), {
          hasNewContent: true,
          lastContentAddedAt: nowIso,
          updatedAt: nowIso
        });
        const destCat = allCategories.find(c => c.id === targetDestinationId);
        if (destCat && destCat.parentId) {
          await updateDoc(doc(db, 'categories', destCat.parentId), {
            hasNewContent: true,
            lastContentAddedAt: nowIso,
            updatedAt: nowIso
          });
        }
      } catch (err) {
        console.error("Failed updating target category new status on item transfer:", err);
      }

      const destName = allCategories.find(c => c.id === targetDestinationId)?.name || 'القسم المحدد';
      toast({
        title: "تم النقل بنجاح! 🎉",
        description: `تم نقل ${itemsToMove.length} منشور بنجاح إلى "${destName}".`
      });

      setSelectedItemIds(prev => prev.filter(id => !transferModal.itemIds.includes(id)));
      setTransferModal(null);
      setTargetDestinationId('');
    } catch (error: any) {
      console.error("Error transferring items:", error);
      toast({
        title: "خطأ أثناء النقل",
        description: error.message || "حدث خطأ غير متوقع أثناء نقل المحتوى",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: editingCategory.name,
        fileTypes: editingCategory.fileTypes || 'XML',
        displayStyle: editingCategory.displayStyle || 'style1',
        subCategoryLayout: editingCategory.subCategoryLayout || 'vertical',
        isUnderMaintenance: editingCategory.isUnderMaintenance || false,
        isHidden: editingCategory.isHidden || false,
        showShareButton: editingCategory.showShareButton !== false,
        isNew: editingCategory.isNew || false,
        hasNewContent: editingCategory.hasNewContent || false,
        accentColor: editingCategory.accentColor || '',
        useCustomAccent: editingCategory.useCustomAccent || false,
        updatedAt: new Date().toISOString()
      });
      setEditingCategory(null);
      toast({ title: "تم النجاح", description: "تم تحديث القسم بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubCategory) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'categories', editingSubCategory.id), {
        name: editingSubCategory.name,
        description: editingSubCategory.description || '',
        parentId: editingSubCategory.categoryId,
        displayStyle: editingSubCategory.displayStyle || 'style1',
        fileTypes: editingSubCategory.fileTypes || '',
        isUnderMaintenance: editingSubCategory.isUnderMaintenance || false,
        isHidden: editingSubCategory.isHidden || false,
        showShareButton: editingSubCategory.showShareButton !== false,
        isNew: editingSubCategory.isNew || false,
        hasNewContent: editingSubCategory.hasNewContent || false,
        accentColor: editingSubCategory.accentColor || '',
        useCustomAccent: editingSubCategory.useCustomAccent || false,
        updatedAt: new Date().toISOString()
      });
      setEditingSubCategory(null);
      toast({ title: "تم النجاح", description: "تم تحديث القسم الفرعي بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCategoryVisibility = async (catId: string, currentHidden: boolean) => {
    try {
      await updateDoc(doc(db, 'categories', catId), {
        isHidden: !currentHidden,
        updatedAt: new Date().toISOString()
      });
      toast({
        title: !currentHidden ? "تم إخفاء القسم" : "تم إظهار القسم للزوار",
        description: !currentHidden ? "أصبح القسم الآن مخفياً عن جميع الزوار في الموقع" : "أصبح القسم الآن معروضاً للزوار في الموقع"
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    }
  };

  const handleToggleSubCategoryVisibility = async (subId: string, currentHidden: boolean) => {
    try {
      await updateDoc(doc(db, 'categories', subId), {
        isHidden: !currentHidden,
        updatedAt: new Date().toISOString()
      });
      toast({
        title: !currentHidden ? "تم إخفاء القسم الفرعي" : "تم إظهار القسم الفرعي",
        description: !currentHidden ? "القسم الفرعي الآن مخفي عن الزوار" : "القسم الفرعي الآن ظاهر ومعروض للزوار"
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    }
  };
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const subCatId = editingItem.subCategoryId || selectedManagerId?.id;
    if (!subCatId || !editingItem.id) {
      toast({ title: "خطأ", description: "تعذر تحديد القسم الفرعي الخاص بالمحتوى", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      // Auto resolve MediaFire / Pinterest / Firebase / Google Drive URLs to direct links
      let finalImageUrl = getDirectLink(editingItem.imageUrl || '');
      if (isMediaFireUrl(finalImageUrl) && !isMediaFireDirectUrl(finalImageUrl)) {
        const mf = await resolveMediaFireUrl(finalImageUrl);
        if (mf.directUrl) finalImageUrl = mf.directUrl;
      } else if (isPinterestUrl(finalImageUrl) && !finalImageUrl.includes('i.pinimg.com')) {
        finalImageUrl = await resolvePinterestUrl(finalImageUrl);
      }
      
      let finalDownloadUrl = getDirectLink(editingItem.downloadUrl || '');
      if (isMediaFireUrl(finalDownloadUrl)) {
        const mf = await resolveMediaFireUrl(finalDownloadUrl);
        if (mf.permanentUrl) finalDownloadUrl = mf.permanentUrl;
        else if (mf.directUrl) finalDownloadUrl = mf.directUrl;
      } else if (isPinterestUrl(finalDownloadUrl) && !finalDownloadUrl.includes('i.pinimg.com')) {
        finalDownloadUrl = await resolvePinterestUrl(finalDownloadUrl);
      }
      
      let finalDownloadUrl2 = getDirectLink(editingItem.downloadUrl2 || '');
      if (isMediaFireUrl(finalDownloadUrl2)) {
        const mf = await resolveMediaFireUrl(finalDownloadUrl2);
        if (mf.permanentUrl) finalDownloadUrl2 = mf.permanentUrl;
        else if (mf.directUrl) finalDownloadUrl2 = mf.directUrl;
      } else if (isPinterestUrl(finalDownloadUrl2) && !finalDownloadUrl2.includes('i.pinimg.com')) {
        finalDownloadUrl2 = await resolvePinterestUrl(finalDownloadUrl2);
      }

      let finalMaterialsUrl = getDirectLink(editingItem.materialsUrl || '');
      if (isMediaFireUrl(finalMaterialsUrl)) {
        const mf = await resolveMediaFireUrl(finalMaterialsUrl);
        if (mf.permanentUrl) finalMaterialsUrl = mf.permanentUrl;
        else if (mf.directUrl) finalMaterialsUrl = mf.directUrl;
      } else if (isPinterestUrl(finalMaterialsUrl) && !finalMaterialsUrl.includes('i.pinimg.com')) {
        finalMaterialsUrl = await resolvePinterestUrl(finalMaterialsUrl);
      }

      let finalScreenshots = editingItem.screenshots || [];
      if (Array.isArray(finalScreenshots) && finalScreenshots.length > 0) {
        finalScreenshots = await Promise.all(
          finalScreenshots.map(async (s: string) => {
            let direct = getDirectLink(s);
            if (isPinterestUrl(direct) && !direct.includes('i.pinimg.com')) {
              return await resolvePinterestUrl(direct);
            }
            return direct;
          })
        );
      }

      await updateDoc(doc(db, 'categories', subCatId, 'items', editingItem.id), {
        title: editingItem.title,
        description: editingItem.description || '',
        downloadUrl: finalDownloadUrl,
        downloadUrlLabel: editingItem.downloadUrlLabel || '',
        downloadUrl2: finalDownloadUrl2,
        downloadUrl2Label: editingItem.downloadUrl2Label || '',
        videoUrl: editingItem.videoUrl || '',
        imageUrl: finalImageUrl,
        style: editingItem.style || '',
        rating: editingItem.rating || '',
        reviewCount: editingItem.reviewCount || '',
        ageRating: editingItem.ageRating || '',
        size: editingItem.size || '',
        screenshots: finalScreenshots,
        prompt: editingItem.prompt || '',
        promptInstructions: editingItem.promptInstructions || '',
        usedApps: Array.isArray(editingItem.usedApps) ? editingItem.usedApps : (editingItem.usedApps ? [editingItem.usedApps] : []),
        hasMaterials: !!editingItem.hasMaterials,
        materialsUrl: finalMaterialsUrl,
        materialsLabel: editingItem.materialsLabel || '',
        materialsDescription: editingItem.materialsDescription || '',
        sourceUrl: editingItem.sourceUrl || '',
        showCopyButton: editingItem.showCopyButton !== false,
        showDownloadButton: editingItem.showDownloadButton !== false,
        showShareButton: editingItem.showShareButton !== false,
        order: typeof editingItem.order === 'number' ? editingItem.order : (editingItem.order !== undefined && editingItem.order !== '' ? parseInt(editingItem.order) : 0),
        updatedAt: new Date().toISOString()
      });
      setEditingItem(null);
      toast({ title: "تم النجاح", description: "تم تحديث المحتوى بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${subCatId}/items`);
    } finally {
      setIsSaving(false);
    }
  };
  const handleMoveSubCategory = async (id: string, direction: 'up' | 'down') => {
    const parentId = subCategories.find(s => s.id === id)?.parentId;
    if (!parentId) return;
    const relevantSubs = subCategories.filter(s => s.parentId === parentId);
    const currentIndex = relevantSubs.findIndex(s => s.id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === relevantSubs.length - 1) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentSub = relevantSubs[currentIndex];
    const targetSub = relevantSubs[targetIndex];
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'categories', currentSub.id), { order: targetIndex });
      await updateDoc(doc(db, 'categories', targetSub.id), { order: currentIndex });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'categories');
    } finally {
      setIsSaving(false);
    }
  };
  const handleUpdateTheme = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'appConfig', 'theme'), {
        primaryColor,
        darkPrimaryColor,
        backgroundColor,
        darkBackgroundColor,
        cardColor,
        darkCardColor,
        themeMode,
        autoThemeEnabled,
        autoThemeMode,
        autoThemeDarkStart,
        autoThemeDarkEnd,
        useGradient,
        gradientStart,
        gradientEnd,
        darkGradientStart,
        darkGradientEnd,
        bottomNavColor,
        darkBottomNavColor,
        customCss: deleteField(),
        updatedAt: new Date().toISOString()
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'appConfig/theme');
    } finally {
      setIsSaving(false);
    }
  };
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifBody) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: notifTitle,
        body: notifBody,
        link: notifLink || '',
        createdAt: new Date().toISOString(),
        read: false,
        isNew: true
      });
      setNotifTitle('');
      setNotifBody('');
      setNotifLink('');
      toast({ title: "تم النجاح", description: "تم إرسال الإشعار بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async (path: string) => {
    try {
      await deleteDoc(doc(db, path));
      setDeleteConfirm(null);
      toast({ title: "تم الحذف", description: "تم حذف العنصر بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };
  const domainToAuthorize = currentDomain.replace(/^https?:\/\//, '');
  const devDomain = "ais-dev-wdz3ydwwnvsr5dasvcbb6c-177196040326.europe-west2.run.app";
  const preDomain = "ais-pre-wdz3ydwwnvsr5dasvcbb6c-177196040326.europe-west2.run.app";
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'users': return 'إدارة المستخدمين';
      case 'content': return 'المحتوى والأقسام';
      case 'pages': return 'إدارة الصفحات';
      case 'blogs': return 'إدارة المدونات';
      case 'colors': return 'المظهر والألوان';
      case 'notifications': return 'الإشعارات';
      case 'dialog': return 'النافذة المنبثقة';
      case 'floatingButton': return 'الزر العائم';
      case 'about': return 'من نحن';
      case 'contact': return 'تواصل معنا';
      case 'security': return 'حماية المحتوى والأمان';
      default: return 'لوحة التحكم';
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20" dir="rtl">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header
        title={getHeaderTitle()}
        onMenuClick={activeTab === 'menu' ? () => setIsSidebarOpen(true) : undefined}
        showBackButton={activeTab !== 'menu'}
        onBackClick={() => setActiveTab('menu')}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10">
        {!isAdmin ? (
          !user ? (
            <div className="bg-card rounded-[28px] sm:rounded-[40px] p-8 sm:p-12 text-center shadow-2xl shadow-muted/50 border border-border my-12">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <Lock size={32} className="sm:hidden" />
                <Lock size={48} className="hidden sm:block" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-4 text-foreground">يتطلب دخول لوحة التحكم تسجيل الدخول</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                لوحة التحكم مخصصة للمشرفين المعتمدين فقط. يرجى تسجيل الدخول بحساب المشرف للمتابعة.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 text-white rounded-2xl font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  <LogIn size={20} />
                  <span>تسجيل دخول المشرف</span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-[28px] sm:rounded-[40px] p-8 sm:p-12 text-center shadow-2xl shadow-muted/50 border border-border">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                <AlertTriangle size={32} className="sm:hidden" />
                <AlertTriangle size={48} className="hidden sm:block" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-4 text-foreground">عذراً، ليس لديك صلاحية الوصول</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                أنت مسجل الدخول حالياً بـ: <span className="font-bold text-foreground">{user.email}</span>
                <br />
                هذا البريد غير مدرج في قائمة المسؤولين المعتمدين.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                >
                  العودة للرئيسية
                </button>
                <button
                  onClick={() => logout()}
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          )
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
              <div className="flex items-center gap-3">
                {activeTab !== 'menu' ? (
                  <button
                    onClick={() => setActiveTab('menu')}
                    className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-all flex items-center gap-1.5 text-xs font-black shadow-sm"
                  >
                    <ChevronRight size={18} />
                    <span>العودة للقائمة</span>
                  </button>
                ) : (
                  <Settings className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                )}
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                  <span className="block sm:inline">لوحة تحكم المدير</span>
                  <span className="hidden sm:inline"> | </span>
                  <span className="block sm:inline text-primary/70 sm:text-inherit">
                    {activeTab === 'blogs' ? 'إدارة المدونات' : 'الملكية'}
                  </span>
                </h1>
              </div>
              <button
                onClick={() => logout()}
                className="bg-muted text-foreground/70 px-4 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-muted/80 transition-colors w-full sm:w-auto text-center"
              >
                تسجيل الخروج
              </button>
            </div>
            <AnimatePresence mode="wait">
              {activeTab === 'menu' ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-12"
                >
                  {/* Quick Stats Dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'الأقسام', value: categories.length + subCategories.length, icon: Database, color: 'text-blue-500', bg: 'bg-blue-50' },
                      { label: 'المستخدمين', value: whitelistData?.length || 0, icon: User, color: 'text-orange-500', bg: 'bg-orange-50' },
                      { label: 'الإشعارات', value: notifications?.length || 0, icon: Bell, color: 'text-pink-500', bg: 'bg-pink-50' },
                      { label: 'جهات الاتصال', value: contacts.length, icon: MessageCircle, color: 'text-green-500', bg: 'bg-green-50' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                          <stat.icon size={24} />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <span className="text-xl font-black text-gray-900">{stat.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Quick Maintenance Control Widget */}
                  <div className={cn(
                    "p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm",
                    maintenanceEnabled
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                  )}>
                    <div className="flex items-center gap-4 text-right w-full sm:w-auto">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold shadow-lg",
                        maintenanceEnabled ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                      )}>
                        <Wrench size={28} className={maintenanceEnabled ? "animate-spin" : ""} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg sm:text-xl">وضع صيانة الموقع والتطبيق</h3>
                          <span className={cn(
                            "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                            maintenanceEnabled ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                          )}>
                            {maintenanceEnabled ? "الصيانة مفعلة" : "الموقع يعمل"}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold opacity-80 mt-1">
                          {maintenanceEnabled
                            ? "الموقع مغلق حالياً أمام جميع الزوار وتظهر لهم صفحة الصيانة والتطوير الاحترافية."
                            : "الموقع متاح ويعمل بشكل طبيعي لجميع المستخدمين والزوار."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleQuickToggleMaintenance(!maintenanceEnabled)}
                        className={cn(
                          "px-5 py-3 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 flex-1 sm:flex-none",
                          maintenanceEnabled
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                        )}
                      >
                        <Power size={18} />
                        <span>{maintenanceEnabled ? "إيقاف الصيانة وتنشيط الموقع" : "تفعيل صيانة الموقع الآن"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('maintenance')}
                        className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl font-black text-xs sm:text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Settings size={16} />
                        <span>تخصيص الإعدادات</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-10">
                    {[
                      {
                        title: 'إدارة المحتوى والمستخدمين',
                        items: [
                          { id: 'content', label: 'المحتوى والأقسام', icon: Home, desc: 'إدارة الأقسام والمنشورات' },
                          { id: 'blogs', label: 'إدارة المدونات (Blogger)', icon: BookOpen, desc: 'إضافة ومزامنة وتحديث مدونات Blogger والمقالات' },
                          { id: 'users', label: 'المستخدمين', icon: Users, desc: 'إدارة صلاحيات الوصول' },
                          { id: 'security', label: 'حماية المحتوى والنسخ', icon: Lock, desc: 'منع النسخ وحماية حقوق النشر والزر الأيمن' },
                        ]
                      },
                      {
                        title: 'المظهر والهوية',
                        items: [
                          { id: 'appName', label: 'اسم الهوية والتطبيق', icon: Type, desc: 'تعديل اسم التطبيق الظاهر في الهيدر والصفحة الرئيسية والقائمة الجانبية' },
                          { id: 'font', label: 'خط التطبيق (تحميل مخصص)', icon: Type, desc: 'تحميل ملف خط مخصص (TTF, OTF, WOFF) أو اختيار خط عربي متميز' },
                          { id: 'colors', label: 'ألوان الموقع', icon: Palette, desc: 'تخصيص ألوان الواجهة' },
                          { id: 'maintenance', label: 'صيانة الموقع', icon: Wrench, desc: 'تفعيل وتخصيص صفحة صيانة الموقع للتطبيقات' },
                        ]
                      },
                      {
                        title: 'التفاعل والتواصل',
                        items: [
                          { id: 'share', label: 'مشاركة التطبيق', icon: Share2, desc: 'التحكم بنص وعنوان ورابط مشاركة التطبيق للمستخدمين' },
                          { id: 'notifications', label: 'الإشعارات', icon: BellRing, desc: 'إرسال تنبيهات للمستخدمين' },
                          { id: 'social', label: 'مواقع التواصل الاجتماعي', icon: Share2, desc: 'روابط وأيقونات التواصل الدائرية أسفل القائمة' },
                          { id: 'dialog', label: 'النافذة المنبثقة', icon: MessageSquare, desc: 'إعداد ديالوج الاشتراك' },
                          { id: 'floatingButton', label: 'الزر العائم', icon: MousePointer2, desc: 'زر الوصول السريع' },
                        ]
                      },
                      {
                        title: 'صفحات الموقع',
                        items: [
                          { id: 'pages', label: 'إدارة الصفحات', icon: FileText, desc: 'إضافة وتعديل وحذف الصفحات المخصصة ونشرها بالقائمة' },
                          { id: 'about', label: 'من نحن', icon: Info, desc: 'تعديل صفحة حول التطبيق' },
                          { id: 'contact', label: 'تواصل معنا', icon: MessageCircle, desc: 'إدارة أرقام وروابط التواصل' },
                        ]
                      }
                    ].map((group, idx) => (
                      <div key={idx} className="space-y-5">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mr-4">{group.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.items.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id as any)}
                              className="flex items-center p-6 rounded-[2rem] transition-all duration-300 gap-5 shadow-sm border bg-white text-gray-900 border-gray-100 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 active:scale-95 group text-right"
                            >
                              <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                                <tab.icon size={28} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-base sm:text-lg mb-1">{tab.label}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 font-bold leading-tight line-clamp-1">{tab.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : activeTab === 'pages' ? (
                <motion.div
                  key="pages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <PagesManager />
                </motion.div>
              ) : activeTab === 'blogs' ? (
                <motion.div
                  key="blogs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <BlogsManager />
                </motion.div>
              ) : activeTab === 'users' ? (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <UserPlus size={18} className="sm:hidden" />
                        <UserPlus size={20} className="hidden sm:block" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold">إضافة مستخدم جديد</h2>
                    </div>
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">البريد الإلكتروني</label>
                        <input
                          type="email"
                          placeholder="example@gmail.com"
                          value={newUserId}
                          onChange={(e) => setNewUserId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الصلاحية</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                        >
                          <option value="admin">مسؤول (Admin)</option>
                          <option value="editor">محرر (Editor)</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? 'جاري الإضافة...' : 'إضافة المستخدم'}
                      </button>
                    </form>
                  </section>
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
                      <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">قائمة المستخدمين</h2>
                        <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">إدارة الصلاحيات والوصول</p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400">
                        <Users size={20} className="sm:hidden" />
                        <Users size={24} className="hidden sm:block" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {whitelistData?.map((entry: any, idx: number) => (
                        <div key={`${entry.id}-${idx}`} className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                          {/* Top Section: Avatar & Info */}
                          <div className="flex items-start justify-between mb-6 sm:mb-8">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-inner",
                                entry.role === 'admin' ? "bg-orange-500 text-white" : "bg-blue-500 text-white"
                              )}>
                                {entry.email.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-1 min-w-0 flex-1">
                                <h3 className="font-black text-lg text-gray-900 break-words">{entry.email.split('@')[0]}</h3>
                                <p className="text-xs font-medium text-gray-400 break-all">{entry.email}</p>
                              </div>
                            </div>
                            <div className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                              entry.role === 'admin' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                            )}>
                              {entry.role === 'admin' ? 'مسؤول' : 'محرر'}
                            </div>
                          </div>
                          {/* Status Badge */}
                          <div className="flex items-center gap-2 mb-6">
                            <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              نشط الآن
                            </div>
                            <div className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black">
                              مجاني
                            </div>
                          </div>
                          {/* Stats Card */}
                          <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 mb-6 relative overflow-hidden group-hover:bg-white transition-colors duration-500">
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">المنشورات</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-black text-gray-900">12 منشور</span>
                                  <Send size={14} className="text-primary -rotate-45" />
                                </div>
                              </div>
                              <div className="space-y-1 border-r border-gray-200 pr-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">نوع الحساب</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-black text-primary">حساب {entry.role === 'admin' ? 'إداري' : 'محرر'}</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-[9px] text-gray-300 font-bold mt-4 text-center">آخر ظهور: اليوم في 10:00 م</p>
                          </div>
                          {/* Actions */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => initiateDelete(entry.email, 'user', entry.email)}
                              className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                              <Trash2 size={16} />
                              حذف المستخدم
                            </button>
                            <button className="flex-1 py-4 bg-primary/5 text-primary rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-95">
                              <Settings size={16} />
                              إدارة الصلاحيات
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'colors' ? (
                <motion.div
                  key="colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-card rounded-3xl p-8 shadow-sm border border-border">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-xl flex items-center justify-center">
                        <Palette size={20} />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">ألوان الموقع والمظهر</h2>
                    </div>
                    <div className="space-y-8">
                      <div className="p-6 bg-muted rounded-2xl border border-border">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">نمط المظهر الافتراضي</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'light', label: 'فاتح', icon: '☀️' },
                            { id: 'dark', label: 'داكن', icon: '🌙' },
                            { id: 'high-contrast', label: 'تباين عالٍ', icon: '👁️' }
                          ].map((mode) => (
                            <button
                              key={mode.id}
                              type="button"
                              onClick={() => setThemeMode(mode.id as any)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                themeMode === mode.id
                                  ? "bg-card border-primary shadow-md text-primary"
                                  : "bg-card/50 border-transparent text-gray-400 hover:border-border"
                              )}
                            >
                              <span className="text-2xl">{mode.icon}</span>
                              <span className="text-xs font-bold">{mode.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto Theme Switcher Feature Block */}
                      <div className="p-6 bg-muted rounded-2xl border border-border space-y-6">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">🌓</span>
                              <p className="text-sm font-bold text-foreground">التبديل التلقائي بين الوضع الفاتح والداكن</p>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                              تغيير المظهر تلقائياً وبشكل سلس بناءً على إعدادات نظام المستخدم أو توقيت الجهاز المحلي
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAutoThemeEnabled(!autoThemeEnabled)}
                            className={cn(
                              "w-14 h-8 rounded-full transition-all relative shrink-0",
                              autoThemeEnabled ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
                              autoThemeEnabled ? "right-1" : "right-7"
                            )} />
                          </button>
                        </div>

                        {autoThemeEnabled && (
                          <div className="space-y-5 pt-4 border-t border-border/60 animate-in fade-in duration-300">
                            <div>
                              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-3">
                                معيار التبديل التلقائي
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { id: 'system', label: 'إعدادات النظام (الجهاز)', desc: 'يتبع الوضع الداكن/الفاتح بالهاتف تلقائياً', icon: '📱' },
                                  { id: 'time', label: 'توقيت الجهاز (ساعات الليل)', desc: 'تبديل تلقائي بناءً على ساعات الليل والنهار', icon: '⏰' }
                                ].map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setAutoThemeMode(item.id as any)}
                                    className={cn(
                                      "flex flex-col text-right p-4 rounded-2xl border-2 transition-all gap-1",
                                      autoThemeMode === item.id
                                        ? "bg-card border-primary shadow-sm text-primary"
                                        : "bg-card/50 border-transparent text-gray-400 hover:border-border"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 font-bold text-xs">
                                      <span>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.desc}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {autoThemeMode === 'time' && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <span>🌙</span>
                                    <span>بداية الوضع الداكن (مساءً)</span>
                                  </label>
                                  <input
                                    type="time"
                                    value={autoThemeDarkStart}
                                    onChange={(e) => setAutoThemeDarkStart(e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <span>☀️</span>
                                    <span>بداية الوضع الفاتح (صباحاً)</span>
                                  </label>
                                  <input
                                    type="time"
                                    value={autoThemeDarkEnd}
                                    onChange={(e) => setAutoThemeDarkEnd(e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-6 bg-muted rounded-2xl border border-border">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">تفعيل التدرج اللوني (Gradient)</label>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-foreground">استخدام التدرج</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">سيتم تطبيق التدرج على الأزرار والعناصر الرئيسية</p>
                          </div>
                          <button
                            onClick={() => setUseGradient(!useGradient)}
                            className={cn(
                              "w-14 h-8 rounded-full transition-all relative",
                              useGradient ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                              useGradient ? "right-1" : "right-7"
                            )} />
                          </button>
                        </div>
                      </div>
                      {useGradient && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-muted rounded-2xl border border-border">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">تدرج البداية (فاتح)</label>
                            <div className="flex items-center gap-4">
                              <input type="color" value={gradientStart} onChange={(e) => setGradientStart(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                              <input type="text" value={gradientStart} onChange={(e) => setGradientStart(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                            </div>
                          </div>
                          <div className="p-6 bg-muted rounded-2xl border border-border">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">تدرج النهاية (فاتح)</label>
                            <div className="flex items-center gap-4">
                              <input type="color" value={gradientEnd} onChange={(e) => setGradientEnd(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                              <input type="text" value={gradientEnd} onChange={(e) => setGradientEnd(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                            </div>
                          </div>
                          <div className="p-6 bg-muted rounded-2xl border border-border">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">تدرج البداية (داكن)</label>
                            <div className="flex items-center gap-4">
                              <input type="color" value={darkGradientStart} onChange={(e) => setDarkGradientStart(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                              <input type="text" value={darkGradientStart} onChange={(e) => setDarkGradientStart(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                            </div>
                          </div>
                          <div className="p-6 bg-muted rounded-2xl border border-border">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">تدرج النهاية (داكن)</label>
                            <div className="flex items-center gap-4">
                              <input type="color" value={darkGradientEnd} onChange={(e) => setDarkGradientEnd(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                              <input type="text" value={darkGradientEnd} onChange={(e) => setDarkGradientEnd(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">اللون الرئيسي (فاتح)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">اللون الرئيسي (داكن)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={darkPrimaryColor} onChange={(e) => setDarkPrimaryColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={darkPrimaryColor} onChange={(e) => setDarkPrimaryColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون الخلفية (فاتح)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون الخلفية (داكن)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={darkBackgroundColor} onChange={(e) => setDarkBackgroundColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={darkBackgroundColor} onChange={(e) => setDarkBackgroundColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون الكروت (فاتح)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={cardColor} onChange={(e) => setCardColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={cardColor} onChange={(e) => setCardColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون الكروت (داكن)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={darkCardColor} onChange={(e) => setDarkCardColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={darkCardColor} onChange={(e) => setDarkCardColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون القائمة السفلية (فاتح)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={bottomNavColor} onChange={(e) => setBottomNavColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={bottomNavColor} onChange={(e) => setBottomNavColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                        <div className="p-6 bg-muted rounded-2xl border border-border">
                          <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">لون القائمة السفلية (داكن)</label>
                          <div className="flex items-center gap-4">
                            <input type="color" value={darkBottomNavColor} onChange={(e) => setDarkBottomNavColor(e.target.value)} className="w-12 h-12 cursor-pointer rounded-xl border-2 border-card shadow-sm" />
                            <input type="text" value={darkBottomNavColor} onChange={(e) => setDarkBottomNavColor(e.target.value)} className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono font-bold text-foreground" />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleUpdateTheme}
                        disabled={isSaving}
                        className="w-full text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : showSuccess ? (
                          <ShieldCheck size={20} />
                        ) : null}
                        {isSaving ? 'جاري الحفظ...' : showSuccess ? 'تم الحفظ بنجاح!' : 'حفظ إعدادات الألوان'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'notifications' ? (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <BellRing size={20} />
                      </div>
                      <h2 className="text-xl font-bold">إرسال إشعار جديد</h2>
                    </div>
                    <form onSubmit={handleSendNotification} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">عنوان الإشعار</label>
                        <input
                          type="text"
                          placeholder="اكتب العنوان هنا..."
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">محتوى الرسالة</label>
                        <textarea
                          placeholder="اكتب تفاصيل الرسالة..."
                          value={notifBody}
                          onChange={(e) => setNotifBody(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">رابط الإشعار (اختياري)</label>
                        <input
                          type="text"
                          placeholder="https://example.com"
                          value={notifLink}
                          onChange={(e) => setNotifLink(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        <span>إرسال الإشعار الآن</span>
                      </button>
                    </form>
                  </section>
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center">
                        <Bell size={20} />
                      </div>
                      <h2 className="text-xl font-bold">الإشعارات المرسلة</h2>
                    </div>
                    <div className="space-y-4">
                      {notifications?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((notif, idx) => (
                        <div key={`${notif.id}-${idx}`} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex justify-between items-start gap-4 group">
                          <div className="flex gap-4 fill-mode-forwards">
                            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                                <Bell size={24} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-gray-900 leading-tight">{notif.title}</h3>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{notif.body}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {new Date(notif.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400">
                                        {new Date(notif.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {notif.link && (
                                        <div className="flex items-center gap-1 text-[9px] text-blue-500 font-bold">
                                            <ExternalLink size={10} />
                                            <span>يحتوي رابط</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                          </div>
                          <button
                            onClick={() => initiateDelete(`notifications/${notif.id}`, 'إشعار', notif.title)}
                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      {(!notifications || notifications.length === 0) && (
                        <div className="text-center py-12 px-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm font-bold">لا توجد إشعارات مرسلة بعد</p>
                        </div>
                      )}
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'dialog' ? (
                <motion.div
                  key="dialog"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <MessageSquare size={20} />
                      </div>
                      <h2 className="text-xl font-bold">إعدادات الديالوج (iPhone Style)</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold">تفعيل الديالوج</p>
                          <p className="text-xs text-gray-400">إظهار الديالوج للمستخدمين عند الدخول</p>
                        </div>
                        <button
                          onClick={() => setIsDialogActive(!isDialogActive)}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            isDialogActive ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                            isDialogActive ? "right-1" : "right-7"
                          )} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">العنوان</label>
                        <input
                          type="text"
                          value={dialogTitle}
                          onChange={(e) => setDialogTitle(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الرسالة</label>
                        <textarea
                          value={dialogMessage}
                          onChange={(e) => setDialogMessage(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-24 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">نص زر الإجراء (اشتراك/تحميل)</label>
                          <input
                            type="text"
                            value={dialogActionText}
                            onChange={(e) => setDialogActionText(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">نص زر الإلغاء</label>
                          <input
                            type="text"
                            value={dialogCancelText}
                            onChange={(e) => setDialogCancelText(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">رابط زر الإجراء (اختياري)</label>
                        <input
                          type="url"
                          placeholder="https://example.com"
                          value={dialogActionUrl}
                          onChange={(e) => setDialogActionUrl(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">تكرار الظهور</label>
                          <input
                            type="number"
                            value={dialogFrequency}
                            onChange={(e) => setDialogFrequency(parseInt(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الوحدة</label>
                          <select
                            value={dialogFrequencyUnit}
                            onChange={(e) => setDialogFrequencyUnit(e.target.value as any)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                          >
                            <option value="hours">ساعة</option>
                            <option value="minutes">دقيقة</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={handleUpdateDialog}
                        disabled={isSaving}
                        className="w-full text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات الديالوج'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'about' ? (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Info size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">إعدادات عن التطبيق (بطاقة حول التطبيق)</h2>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">تعديل كافة بيانات بطاقة عن التطبيق والنافذة المنبثقة مباشرة</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">اسم التطبيق (العنوان الرئيسي)</label>
                          <input
                            type="text"
                            value={aboutTitle}
                            onChange={(e) => setAboutTitle(e.target.value)}
                            placeholder="تطبيق مسلم للقرآن الكريم"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">العنوان الفرعي (الوصف)</label>
                          <input
                            type="text"
                            value={aboutSubtitle}
                            onChange={(e) => setAboutSubtitle(e.target.value)}
                            placeholder="منصة للاستماع والتنزيل المباشر بأعلى جودة"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                      </div>
                      {/* Developer & Phone & Update Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">تطوير وتصميم (اسم المطور)</label>
                          <input
                            type="text"
                            value={aboutDeveloperName}
                            onChange={(e) => setAboutDeveloperName(e.target.value)}
                            placeholder="YOSSEF / تطوير"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">رقم الهاتف</label>
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 transition-colors">
                              <input
                                type="checkbox"
                                checked={aboutHidePhoneNumber}
                                onChange={(e) => setAboutHidePhoneNumber(e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                              />
                              <span>إخفاء الرقم افتراضياً</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            value={aboutPhoneNumber}
                            onChange={(e) => setAboutPhoneNumber(e.target.value)}
                            placeholder="01029892573"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">حالة التحديث</label>
                          <input
                            type="text"
                            value={aboutVersionStatus}
                            onChange={(e) => setAboutVersionStatus(e.target.value)}
                            placeholder="إصدار مكتمل ومستقر"
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                      </div>
                      {/* Link 1 (Primary Button Settings) */}
                      <div className="p-5 bg-gray-50/80 rounded-3xl border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                          <span>🌐</span> الزر الرئيسي (الرابط الأول)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">منصة الزر (تحديد اللون والأيقونة)</label>
                            <select
                              value={aboutWebLinkPlatform}
                              onChange={(e) => setAboutWebLinkPlatform(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            >
                              <option value="auto">✨ تلقائي (كشف المنصة من الرابط)</option>
                              <option value="youtube">🔴 يوتيوب (YouTube - أحمر)</option>
                              <option value="facebook">🔵 فيسبوك (Facebook - أزرق)</option>
                              <option value="instagram">📸 إنستغرام (Instagram - وردي/متدرج)</option>
                              <option value="whatsapp">💬 واتساب (WhatsApp - أخضر)</option>
                              <option value="telegram">✈️ تليجرام (Telegram - أزرق سماوي)</option>
                              <option value="tiktok">🎵 تيك توك (TikTok - أسود)</option>
                              <option value="twitter">🐦 تويتر / X (أسود)</option>
                              <option value="website">🌐 موقع إلكتروني (افتراضي - لون الهوية)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">نص الزر الرئيسي</label>
                            <input
                              type="text"
                              value={aboutWebLinkText}
                              onChange={(e) => setAboutWebLinkText(e.target.value)}
                              placeholder="زيارة الموقع الإلكتروني"
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">رابط الزر (URL)</label>
                            <input
                              type="text"
                              value={aboutWebLink}
                              onChange={(e) => setAboutWebLink(e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Link 2 (Secondary / Additional Button Settings) */}
                      <div className="p-5 bg-gray-50/80 rounded-3xl border border-gray-100 space-y-4">
                        <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
                          <span>➕</span> الزر الإضافي الثاني (اختياري)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">منصة الزر (تحديد اللون والأيقونة)</label>
                            <select
                              value={aboutSecondaryLinkPlatform}
                              onChange={(e) => setAboutSecondaryLinkPlatform(e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            >
                              <option value="auto">✨ تلقائي (كشف المنصة من الرابط)</option>
                              <option value="youtube">🔴 يوتيوب (YouTube - أحمر)</option>
                              <option value="facebook">🔵 فيسبوك (Facebook - أزرق)</option>
                              <option value="instagram">📸 إنستغرام (Instagram - وردي/متدرج)</option>
                              <option value="whatsapp">💬 واتساب (WhatsApp - أخضر)</option>
                              <option value="telegram">✈️ تليجرام (Telegram - أزرق سماوي)</option>
                              <option value="tiktok">🎵 تيك توك (TikTok - أسود)</option>
                              <option value="twitter">🐦 تويتر / X (أسود)</option>
                              <option value="website">🌐 موقع إلكتروني (افتراضي - لون الهوية)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">نص الزر الإضافي</label>
                            <input
                              type="text"
                              value={aboutSecondaryLinkText}
                              onChange={(e) => setAboutSecondaryLinkText(e.target.value)}
                              placeholder="مثال: قناتنا على يوتيوب"
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-1">
                            <label className="text-[11px] font-bold text-gray-600 block ml-2">رابط الزر (URL)</label>
                            <input
                              type="text"
                              value={aboutSecondaryLink}
                              onChange={(e) => setAboutSecondaryLink(e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                      {/* WhatsApp Settings & Toggle */}
                      <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                            <span>💬</span> إعدادات زر الواتساب
                          </h4>
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={aboutShowWhatsapp}
                              onChange={(e) => setAboutShowWhatsapp(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-gray-700">تفعيل إظهار زر الواتساب</span>
                          </label>
                        </div>
                        {aboutShowWhatsapp && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-emerald-100">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-600 block ml-2">رقم الواتساب المباشر</label>
                              <input
                                type="text"
                                value={aboutWhatsappNumber}
                                onChange={(e) => setAboutWhatsappNumber(e.target.value)}
                                placeholder="01029892573"
                                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-600 block ml-2">نص زر الواتساب</label>
                              <input
                                type="text"
                                value={aboutWhatsappText}
                                onChange={(e) => setAboutWhatsappText(e.target.value)}
                                placeholder="تواصل عبر واتساب مباشر (01029892573)"
                                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">رابط شعار مخصص (إذا رغبت في استبدال شعار رفيق المصمم بصورة)</label>
                        <input
                          type="text"
                          value={aboutLogoImage}
                          onChange={(e) => setAboutLogoImage(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">التقييم بالنجوم</label>
                        <select
                          value={aboutRating}
                          onChange={(e) => setAboutRating(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        >
                          <option value={5}>5 نجوم ⭐⭐⭐⭐⭐</option>
                          <option value={4}>4 نجوم ⭐⭐⭐⭐</option>
                          <option value={3}>3 نجوم ⭐⭐⭐</option>
                          <option value={2}>2 نجوم ⭐⭐</option>
                          <option value={1}>نجمة واحدة ⭐</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">الوصف الإضافي (اختياري)</label>
                        <textarea
                          value={aboutDescription}
                          onChange={(e) => setAboutDescription(e.target.value)}
                          placeholder="وصف إضافي يظهر تحت البطاقة..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-24 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block ml-2">الرؤية (اختياري)</label>
                        <textarea
                          value={aboutVision}
                          onChange={(e) => setAboutVision(e.target.value)}
                          placeholder="رؤيتنا المستقبيلة..."
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-24 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleUpdateAbout}
                        disabled={isSaving}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ كافة إعدادات بطاقة عن التطبيق'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'contact' ? (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <MessageCircle size={20} />
                      </div>
                      <h2 className="text-xl font-bold">إعدادات صفحة تواصل معنا</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">العنوان الرئيسي</label>
                          <input
                            type="text"
                            value={contactTitle}
                            onChange={(e) => setContactTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">العنوان الفرعي</label>
                          <input
                            type="text"
                            value={contactSubtitle}
                            onChange={(e) => setContactSubtitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                      </div>
                      <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-green-700">زر واتساب العائم</h4>
                            <div
                                onClick={() => setIsContactBtnActive(!isContactBtnActive)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                                    isContactBtnActive ? "bg-green-500" : "bg-gray-300"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full transition-transform",
                                    isContactBtnActive ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-green-600 uppercase">رابط محادثة واتساب (https://wa.me/xxx)</label>
                          <input
                            type="text"
                            value={contactBtnLink}
                            onChange={(e) => setContactBtnLink(e.target.value)}
                            className="w-full bg-white border border-green-100 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                            placeholder="https://wa.me/9665xxxxxxxx"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleUpdateContact}
                        disabled={isSaving}
                        className="w-full h-14 rounded-2xl text-white font-bold bg-primary shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ البيانات العامة'}
                      </button>
                    </div>
                  </section>
                  <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-[#1A1C1E]">وسائل التواصل</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">إضافة أو حذف وسائل التواصل المعروضة</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingContact({ type: 'phone', label: '', value: '', icon: 'Phone', actionUrl: '', order: contacts.length, active: true });
                                setIsContactModalOpen(true);
                        }}
                            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contacts.map((contact, idx) => {
                            const Icon = iconMap[contact.icon] || Phone;
                            return (
                                <div key={contact.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                            <Icon size={24} />
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-black text-gray-900">{contact.label}</h4>
                                                {!contact.active && <span className="text-[8px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">معطل</span>}
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-bold" dir="ltr">{contact.value}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingContact(contact);
                                                setIsContactModalOpen(true);
                                            }}
                                            className="p-2 text-primary bg-primary/5 rounded-xl hover:bg-primary hover:text-white transition-all"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => initiateDelete(`contacts/${contact.id}`, 'وسيلة تواصل', contact.label)}
                                            className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                  </section>
                  {isContactModalOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsContactModalOpen(false)} />
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-[3rem] w-full max-w-lg p-10 relative z-10 shadow-3xl space-y-8"
                          >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black">{editingContact?.id ? 'تعديل' : 'إضافة'} وسيلة تواصل</h3>
                                <button onClick={() => setIsContactModalOpen(false)} className="text-gray-400">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveContactItem} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">التسمية</label>
                                        <input
                                            required
                                            value={editingContact?.label || ''}
                                            onChange={(e) => setEditingContact({...editingContact, label: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="اتصال / واتساب"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">القيمة</label>
                                        <input
                                            required
                                            value={editingContact?.value || ''}
                                            onChange={(e) => setEditingContact({...editingContact, value: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                            placeholder="784240692"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">النوع</label>
                                        <select
                                            value={editingContact?.type || 'phone'}
                                            onChange={(e) => setEditingContact({...editingContact, type: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none appearance-none"
                                        >
                                            <option value="phone">هاتف</option>
                                            <option value="email">بريد إلكتروني</option>
                                            <option value="whatsapp">واتساب</option>
                                            <option value="link">رابط آخر</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">الأيقونة</label>
                                        <select
                                            value={editingContact?.icon || 'Phone'}
                                            onChange={(e) => setEditingContact({...editingContact, icon: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none appearance-none"
                                        >
                                            <option value="Phone">هاتف</option>
                                            <option value="Mail">بريد</option>
                                            <option value="MessageCircle">محادثة</option>
                                            <option value="ExternalLink">رابط خارجي</option>
                                            <option value="Send">تيليجرام / طيارة</option>
                                            <option value="Instagram">انستقرام</option>
                                            <option value="Twitter">تويتر</option>
                                            <option value="Github">جيت هاب</option>
                                            <option value="Globe">كروم / ويب</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">رابط الإجراء (tel:, mailto:, ...)</label>
                                    <input
                                        required
                                        value={editingContact?.actionUrl || ''}
                                        onChange={(e) => setEditingContact({...editingContact, actionUrl: e.target.value})}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                                        placeholder="tel:+9665xxxxxxxx"
                                    />
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">الترتيب</label>
                                        <input
                                            type="number"
                                            value={editingContact?.order || 0}
                                            onChange={(e) => setEditingContact({...editingContact, order: parseInt(e.target.value)})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 mt-6">
                                        <input
                                            type="checkbox"
                                            checked={editingContact?.active !== false}
                                            onChange={(e) => setEditingContact({...editingContact, active: e.target.checked})}
                                            className="w-5 h-5 accent-primary"
                                        />
                                        <label className="text-xs font-black">نشط</label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full h-14 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ وسيلة التواصل'}
                                </button>
                            </form>
                          </motion.div>
                      </div>
                  )}
                </motion.div>
              ) : activeTab === 'floatingButton' ? (
                <motion.div
                  key="floatingButton"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <MessageCircle size={20} />
                      </div>
                      <h2 className="text-xl font-bold">إعدادات الزر العائم</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold">تفعيل الزر العائم</p>
                          <p className="text-xs text-gray-400">إظهار زر التواصل السريع في الزاوية</p>
                        </div>
                        <button
                          onClick={() => setIsFbActive(!isFbActive)}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            isFbActive ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all",
                            isFbActive ? "right-1" : "right-7"
                          )} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">نص الزر</label>
                        <input
                          type="text"
                          value={fbLabel}
                          onChange={(e) => setFbLabel(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الرابط (واتساب أو تيليجرام)</label>
                        <input
                          type="text"
                          value={fbLink}
                          onChange={(e) => setFbLink(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          placeholder="https://wa.me/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">مدة الظهور (بالأيام)</label>
                        <input
                          type="number"
                          value={fbDuration}
                          onChange={(e) => setFbDuration(parseInt(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleUpdateFloatingButton}
                        disabled={isSaving}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات الزر العائم'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'security' ? (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Lock size={20} />
                      </div>
                      <h2 className="text-xl font-bold">حماية المحتوى والأمان</h2>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold">منع نسخ النصوص والسرقة (Prevent Copy)</p>
                          <p className="text-xs text-gray-400 mt-1">منع الزوار من نسخ النصوص أو تحديد المحتوى البرمجي لحماية أفكارك ومجهودك الفكري.</p>
                        </div>
                        <button
                          onClick={() => setPreventCopy(!preventCopy)}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            preventCopy ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <span className={cn(
                            "w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                            preventCopy ? "left-1" : "right-1"
                          )} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                          <p className="font-bold">تعطيل زر الفأرة الأيمن (Disable Right Click)</p>
                          <p className="text-xs text-gray-400 mt-1">تعطيل الضغط بزر الفأرة الأيمن ومنع إظهار القائمة المنبثقة لحماية صورك وعناصر الواجهة.</p>
                        </div>
                        <button
                          onClick={() => setPreventContextMenu(!preventContextMenu)}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            preventContextMenu ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <span className={cn(
                            "w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                            preventContextMenu ? "left-1" : "right-1"
                          )} />
                        </button>
                      </div>

                      <button
                        onClick={handleSaveSecurity}
                        disabled={isSaving}
                        className="w-full text-white h-14 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <ShieldCheck size={20} />}
                        {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات الأمان والحماية'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'share' ? (
                <motion.div
                  key="share"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                          <Share2 size={28} />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-gray-900">إعدادات مشاركة التطبيق</h2>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">التحكم في العنوان والنص والرابط الظاهر عند مشاركة التطبيق من قبل المستخدمين</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={triggerAppShare}
                        className="hidden sm:flex items-center gap-2 bg-slate-900 text-white hover:bg-black px-5 py-3 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-md"
                      >
                        <Share2 size={16} />
                        <span>تجربة فتح نافذة المشاركة</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Status Switch */}
                      <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 border border-gray-100">
                        <div>
                          <p className="font-black text-sm text-gray-800">تفعيل زر مشاركة التطبيق</p>
                          <p className="text-xs font-bold text-gray-400">إظهار زر المشاركة في القائمة الجانبية وأعلى الصفحات</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShareEnabled(!shareEnabled)}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            shareEnabled ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                              shareEnabled ? "translate-x-0" : "-translate-x-5"
                            )}
                          />
                        </button>
                      </div>

                      {/* Share Title */}
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700 block">عنوان المشاركة (Title)</label>
                        <input
                          type="text"
                          value={shareTitle}
                          onChange={(e) => setShareTitle(e.target.value)}
                          placeholder="عنوان التطبيق (مثال: تطبيق رفيق المصمم)"
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all"
                        />
                      </div>

                      {/* Share Text / Message */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-black text-gray-700 block">نص المشاركة (Text / Message)</label>
                          <span className="text-xs font-bold text-gray-400">{shareText.length} حرف</span>
                        </div>
                        <textarea
                          rows={4}
                          value={shareText}
                          onChange={(e) => setShareText(e.target.value)}
                          placeholder="ادخل الرسالة أو النص الذي يظهر للمستخدم عند المشاركة..."
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all leading-relaxed"
                        />
                      </div>

                      {/* Share URL */}
                      <div className="space-y-2">
                        <label className="text-sm font-black text-gray-700 block">رابط التطبيق (URL / Download Link)</label>
                        <input
                          type="url"
                          value={shareUrl}
                          onChange={(e) => setShareUrl(e.target.value)}
                          placeholder="اتركه فارغاً لاستخدام رابط الموقع الحالي بشكل تلقائي"
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary focus:bg-white transition-all dir-ltr text-left"
                        />
                        <p className="text-[11px] font-bold text-gray-400 mr-1">
                          إذا تُرك فارغاً سيتم مشاركة عنوان الرابط الحالي تلقائياً.
                        </p>
                      </div>

                      {/* Live Preview Box */}
                      <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Eye size={14} /> معاينة النص النهائي للمشاركة
                          </span>
                          <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full text-white/80">
                            مظهر النص للمستلم
                          </span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                          <p className="text-sm font-bold text-white/90 leading-relaxed whitespace-pre-wrap">
                            {shareText || 'لم يتم إدخال نص المشاركة بعد.'}
                          </p>
                          <p className="text-xs font-mono text-blue-400 dir-ltr text-left break-all">
                            {shareUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://example.com')}
                          </p>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={handleSaveShareConfig}
                          disabled={isSaving}
                          className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                          style={{ background: 'var(--primary-gradient)' }}
                        >
                          {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : <CheckCircle size={20} />}
                          {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات المشاركة'}
                        </button>

                        <button
                          onClick={triggerAppShare}
                          type="button"
                          className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-black text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          <Share2 size={18} />
                          <span>تجربة المشاركة الحية</span>
                        </button>
                      </div>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'appName' ? (
                <motion.div
                  key="appName"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                      <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <Type size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">تعديل اسم التطبيق والهوية</h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">تغيير اسم التطبيق الظاهر في الصفحة الرئيسية الهيدر العلوي، والقائمة الجانبية، والنوافذ المنبثقة</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Inputs */}
                      <div className="space-y-6 bg-gray-50/60 p-6 rounded-3xl border border-gray-100">
                        <div className="space-y-2">
                          <label className="text-sm font-black text-gray-800 block">اسم التطبيق الكامل (App Name)</label>
                          <input
                            type="text"
                            value={appNameInput}
                            onChange={(e) => setAppNameInput(e.target.value)}
                            placeholder="مثال: رفيق المصمم أو مصمم بلس"
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                          />
                          <p className="text-xs font-semibold text-gray-400 mr-1">
                            إذا كان الاسم يتكون من كلمتين (مثل: &quot;رفيق المصمم&quot;) سيتم عرض الكلمة الأولى في الأعلى والكلمة الثانية في الشارة الملونة.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-gray-800 block">وصف / شعار شاشة البداية للتطبيق (App Subtitle)</label>
                            {appSubtitleInput && (
                              <button
                                type="button"
                                onClick={() => setAppSubtitleInput('')}
                                className="text-[11px] font-bold text-red-500 hover:underline"
                              >
                                حذف / إخفاء الوصف
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={appSubtitleInput}
                            onChange={(e) => setAppSubtitleInput(e.target.value)}
                            placeholder="مثال: شريكك الإبداعي في كل خطوة (اتركه فارغاً لإخفائه)"
                            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                          />
                          <p className="text-xs font-semibold text-gray-400 mr-1">
                            النص الظاهر أسفل اسم التطبيق في شاشة البداية. اتركه فارغاً للحذف.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-black text-gray-800 block">رسالة الترحيب في شاشة البداية (Splash Welcome)</label>
                            {splashWelcomeInput && (
                              <button
                                type="button"
                                onClick={() => setSplashWelcomeInput('')}
                                className="text-[11px] font-bold text-red-500 hover:underline"
                              >
                                حذف / إخفاء رسالة الترحيب
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={splashWelcomeInput}
                            onChange={(e) => setSplashWelcomeInput(e.target.value)}
                            placeholder="مثال: مرحباً بكم 👋 (اتركه فارغاً لإخفائه)"
                            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                          />
                          <p className="text-xs font-semibold text-gray-400 mr-1">
                            النص الظاهر أسفل الشعار عند تحميل شاشة البداية. اتركه فارغاً لإلغائه تماماً.
                          </p>
                        </div>

                        {/* App Logo Image Input & Upload */}
                        <div className="space-y-3 pt-2 border-t border-gray-100">
                          <label className="text-sm font-black text-gray-800 block flex items-center gap-2">
                            <Upload size={18} className="text-primary" />
                            شعار / لوجو التطبيق (App Logo)
                          </label>
                          <p className="text-xs font-bold text-gray-400">
                            يُعرض اللوجو في شاشة بداية التطبيق (Splash Screen) والصفحة الرئيسية وحول التطبيق.
                          </p>

                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <input
                              type="text"
                              value={appLogoInput}
                              onChange={(e) => setAppLogoInput(e.target.value)}
                              placeholder="ضع رابط صورة الشعار (URL) هنا أو قم ببرفع ملف صورة"
                              className="w-full sm:flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all dir-ltr text-left"
                            />
                            
                            <label className="w-full sm:w-auto shrink-0 px-5 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary font-black text-xs rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-primary/20">
                              <Upload size={16} />
                              <span>رفع صورة</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {appLogoInput && (
                            <div className="mt-3 p-3 bg-white rounded-2xl border border-gray-200 flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 p-1 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={appLogoInput} alt="شعار التطبيق" className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">معاينة صورة الشعار المختارة</p>
                                <button
                                  type="button"
                                  onClick={() => setAppLogoInput('')}
                                  className="text-[11px] font-bold text-red-500 hover:underline mt-0.5"
                                >
                                  حذف الشعار واستخدام النص فقط
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Preview Box */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                          <Eye size={18} className="text-primary" />
                          معاينة حية لشكل اسم التطبيق في الواجهات
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Header Preview */}
                          <div className="p-6 rounded-3xl text-white space-y-3 shadow-lg relative overflow-hidden flex flex-col items-center justify-between" style={{ background: 'var(--primary-gradient)' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10">
                              معاينة هيدر الصفحة الرئيسية
                            </span>
                            <div className="flex flex-col items-center py-4">
                              {(() => {
                                const words = (appNameInput || 'رفيق المصمم').trim().split(/\s+/);
                                const topW = words.length > 1 ? words[0] : '';
                                const bottomW = words.length > 1 ? words.slice(1).join(' ') : words[0];
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    {topW && <span className="text-white text-3xl font-black uppercase tracking-tighter drop-shadow">{topW}</span>}
                                    <div className="bg-white px-5 py-1 rounded-2xl shadow-xl">
                                      <span className="font-black text-lg" style={{ color: 'var(--primary)' }}>{bottomW}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Splash Screen Preview */}
                          <div className="p-6 rounded-3xl text-white space-y-3 shadow-lg relative overflow-hidden flex flex-col items-center justify-between text-center" style={{ background: 'var(--primary-gradient)' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10">
                              معاينة شاشة البداية (Splash)
                            </span>
                            <div className="flex flex-col items-center py-4 gap-2">
                              {appLogoInput && (
                                <div className="w-12 h-12 bg-white/20 rounded-2xl p-1 mb-1">
                                  <img src={appLogoInput} alt="لوجو" className="w-full h-full object-contain" />
                                </div>
                              )}
                              {(() => {
                                const words = (appNameInput || 'رفيق المصمم').trim().split(/\s+/);
                                const topW = words.length > 1 ? words[0] : '';
                                const bottomW = words.length > 1 ? words.slice(1).join(' ') : words[0];
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    {topW && <span className="text-white text-2xl font-black uppercase tracking-tighter drop-shadow">{topW}</span>}
                                    <div className="bg-white px-4 py-1 rounded-2xl shadow-xl">
                                      <span className="font-black text-sm" style={{ color: 'var(--primary)' }}>{bottomW}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                              {appSubtitleInput && (
                                <p className="text-xs font-bold text-white/80 mt-1 max-w-[180px]">
                                  {appSubtitleInput}
                                </p>
                              )}
                              {splashWelcomeInput && (
                                <span className="text-xs font-black text-white/95 mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                  {splashWelcomeInput}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sidebar Preview */}
                          <div className="p-6 rounded-3xl text-white space-y-3 shadow-lg relative overflow-hidden flex flex-col items-center justify-between" style={{ background: 'var(--primary-gradient)' }}>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full border border-white/10">
                              معاينة القائمة الجانبية
                            </span>
                            <div className="flex flex-col items-center py-4">
                              {(() => {
                                const words = (appNameInput || 'رفيق المصمم').trim().split(/\s+/);
                                const topW = words.length > 1 ? words[0] : '';
                                const bottomW = words.length > 1 ? words.slice(1).join(' ') : words[0];
                                return (
                                  <div className="flex flex-col items-center gap-1">
                                    {topW && <span className="text-white text-3xl font-black uppercase tracking-tighter drop-shadow-lg">{topW}</span>}
                                    <div className="bg-white px-5 py-1.5 rounded-full shadow-xl transform -rotate-1">
                                      <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--primary)' }}>{bottomW}</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSaveAppName}
                        disabled={isSaving}
                        className="w-full text-white h-14 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <CheckCircle size={20} />}
                        {isSaving ? 'جاري الحفظ...' : 'حفظ اسم التطبيق والهوية الجديد'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'font' ? (
                <motion.div
                  key="font"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <Type size={28} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">إعدادات خط التطبيق (تحميل خط مخصص)</h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">تغيير الخط العام لكافة صفحات التطبيق عبر تحميل ملف خط مخصص (TTF, OTF, WOFF) أو اختيار خط عربي متميز</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Font Source Selector */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button
                          type="button"
                          onClick={() => setFontType('custom_file')}
                          className={cn(
                            "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all",
                            fontType === 'custom_file'
                              ? "border-primary bg-primary/5 text-primary font-black shadow-sm"
                              : "border-gray-200 hover:border-gray-300 text-gray-600 font-bold"
                          )}
                        >
                          <Upload size={22} />
                          <span className="text-xs">تحميل ملف خط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFontType('preset')}
                          className={cn(
                            "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all",
                            fontType === 'preset'
                              ? "border-primary bg-primary/5 text-primary font-black shadow-sm"
                              : "border-gray-200 hover:border-gray-300 text-gray-600 font-bold"
                          )}
                        >
                          <Sparkles size={22} />
                          <span className="text-xs">خطوط جاهزة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFontType('custom_url')}
                          className={cn(
                            "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all",
                            fontType === 'custom_url'
                              ? "border-primary bg-primary/5 text-primary font-black shadow-sm"
                              : "border-gray-200 hover:border-gray-300 text-gray-600 font-bold"
                          )}
                        >
                          <Code2 size={22} />
                          <span className="text-xs">رابط خط خارجي</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFontType('default')}
                          className={cn(
                            "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 text-center transition-all",
                            fontType === 'default'
                              ? "border-primary bg-primary/5 text-primary font-black shadow-sm"
                              : "border-gray-200 hover:border-gray-300 text-gray-600 font-bold"
                          )}
                        >
                          <RefreshCw size={22} />
                          <span className="text-xs">الخط الافتراضي</span>
                        </button>
                      </div>

                      {/* Option 1: File Upload */}
                      {fontType === 'custom_file' && (
                        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 space-y-4">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <Upload size={18} className="text-primary" />
                            تحميل ملف الخط من جهازك
                          </h3>
                          <p className="text-xs font-bold text-gray-500">
                            صيغ الخطوط المدعومة: TTF, OTF, WOFF, WOFF2. يفضل استخدام ملف بحجم مناسب للحصول على تحميل سريع للمستخدمين.
                          </p>

                          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-primary transition-all relative">
                            <input
                              type="file"
                              accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                              onChange={handleFontFileUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              id="app-custom-font-file"
                            />
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                              <Upload size={28} />
                            </div>
                            <p className="font-black text-sm text-slate-800">اضغط هنا لاختيار ملف الخط من جهازك</p>
                            <p className="text-xs font-bold text-gray-400 mt-1">أو اسحب ملف الخط وأسقطه هنا</p>

                            {fontFileName && (
                              <div className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs font-black">
                                <CheckCircle size={16} />
                                <span>الملف المحدد: {fontFileName} ({fontFileSize})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Option 2: Preset Fonts */}
                      {fontType === 'preset' && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                            <Sparkles size={18} className="text-primary" />
                            اختر خطك العربي المفضل من المكتبة الجاهزة
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { name: 'Cairo', label: 'خط كايرو (Cairo)' },
                              { name: 'Tajawal', label: 'خط تجوال (Tajawal)' },
                              { name: 'Almarai', label: 'خط المراعي (Almarai)' },
                              { name: 'Readex Pro', label: 'خط ريدكس برو (Readex Pro)' },
                              { name: 'Alexandria', label: 'خط الإسكندرية (Alexandria)' },
                              { name: 'IBM Plex Sans Arabic', label: 'خط أي بي إم بليكس (IBM Plex)' },
                              { name: 'Changa', label: 'خط تشانغا (Changa)' },
                              { name: 'Lalezar', label: 'خط لاليزار (Lalezar)' },
                              { name: 'Amiri', label: 'خط أميري (Amiri)' },
                              { name: 'Noto Sans Arabic', label: 'خط نوتو سانز (Noto Sans)' },
                              { name: 'Vazirmatn', label: 'خط وزير متن (Vazirmatn)' },
                              { name: 'El Messiri', label: 'خط المسيري (El Messiri)' },
                            ].map((f) => (
                              <button
                                key={f.name}
                                type="button"
                                onClick={() => setPresetFont(f.name)}
                                className={cn(
                                  "p-4 rounded-2xl border-2 text-right transition-all flex flex-col gap-1",
                                  presetFont === f.name
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-gray-100 hover:border-gray-200 bg-gray-50/50"
                                )}
                              >
                                <span className="text-xs font-black text-gray-900">{f.label}</span>
                                <span className="text-sm font-bold text-primary mt-1" style={{ fontFamily: f.name }}>
                                  بسم الله الرحمن الرحيم
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Option 3: External URL */}
                      {fontType === 'custom_url' && (
                        <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-200">
                          <h3 className="text-sm font-black text-gray-800">رابط ملف الخط الخارجي (URL)</h3>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 block">اسم الخط الخارجي</label>
                            <input
                              type="text"
                              value={customFontName}
                              onChange={(e) => setCustomFontName(e.target.value)}
                              placeholder="مثال: MyCustomFont"
                              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-600 block">رابط الخط (Direct Font File or Google Fonts URL)</label>
                            <input
                              type="url"
                              value={customFontUrl}
                              onChange={(e) => setCustomFontUrl(e.target.value)}
                              placeholder="https://fonts.googleapis.com/css2?family=..."
                              className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono outline-none dir-ltr text-left"
                            />
                          </div>
                        </div>
                      )}

                      {/* Font Live Preview Workbench */}
                      <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Eye size={14} /> معاينة واختبار الخط المباشر
                          </span>
                          <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full text-white/80">
                            {fontType === 'custom_file' ? (customFontName || 'خط مخصص محمل') : fontType === 'preset' ? presetFont : fontType === 'custom_url' ? (customFontName || 'رابط خارجي') : 'الخط الافتراضي'}
                          </span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                          <p className="text-lg font-bold leading-relaxed text-emerald-100">
                            أهلاً بك في تطبيق رفيق المصمم - منصتك المتكاملة لأفضل التصاميم، الملحقات، الأدوات، والخطوط العربية.
                          </p>
                          <p className="text-xs text-gray-300 font-medium">
                            ABCDEFGHIJKLM NOPQRSTUVWXYZ 1234567890
                          </p>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={handleSaveFontConfig}
                        disabled={isSaving}
                        className="w-full text-white h-14 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ background: 'var(--primary-gradient)' }}
                      >
                        {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : <CheckCircle size={20} />}
                        {isSaving ? 'جاري الحفظ...' : 'حفظ وتطبيق الخط على لكافة المستخدمين'}
                      </button>
                    </div>
                  </section>
                </motion.div>
              ) : activeTab === 'social' ? (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                        <Share2 size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900">مواقع التواصل الاجتماعي</h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">إضافة وتعديل روابط التواصل الاجتماعي التي تظهر كدوائر أفقية أسفل القائمة الجانبية</p>
                      </div>
                    </div>
                    {/* Add New Link Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-primary/5 p-6 rounded-3xl border border-gray-200/80 mb-8 space-y-5">
                      <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                        <Plus size={18} className="text-primary" />
                        إضافة منصة جديدة
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 block">اسم المنصة أو الحساب (اختياري)</label>
                          <input
                            type="text"
                            value={newSocialName}
                            onChange={(e) => setNewSocialName(e.target.value)}
                            placeholder="مثال: قناة اليوتيوب، صفحة الفيسبوك، حساب إنستغرام"
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-500 block">رابط المنصة (URL) *</label>
                          <input
                            type="url"
                            value={newSocialUrl}
                            onChange={(e) => setNewSocialUrl(e.target.value)}
                            placeholder="https://youtube.com/@channel, https://facebook.com/..., إلخ"
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/10 transition-all ltr"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      {/* Live Icon Preview */}
                      {newSocialUrl.trim() && (() => {
                        const info = getSocialPlatformInfo(newSocialUrl, newSocialName);
                        return (
                          <div className="flex items-center gap-3 p-4 bg-white/80 rounded-2xl border border-gray-200/60 backdrop-blur-sm">
                            <span className="text-xs font-bold text-gray-500">معاينة الأيقونة التلقائية:</span>
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm", info.colorClass)}>
                              <SocialPlatformIcon platform={info.platform} />
                            </div>
                            <div className="text-xs font-bold text-gray-700">
                              المنصة المكتشفة: <span className="text-primary font-black">{info.label}</span>
                            </div>
                          </div>
                        );
                      })()}
                      <button
                        onClick={handleAddSocialLink}
                        className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs hover:bg-primary/90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        إضافة المنصة للقائمة
                      </button>
                    </div>
                    {/* Social Links List */}
                    <div className="space-y-4 mb-8">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mr-2">
                        الروابط المضافة حالياً ({socialLinksList.length})
                      </h3>
                      {socialLinksList.length === 0 ? (
                        <div className="text-center py-12 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <Share2 size={40} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm font-bold text-gray-500">لا توجد روابط تواصل مضافة حالياً</p>
                          <p className="text-xs text-gray-400 mt-1">قم بإضافة رابط جديد بالأعلى ليتم إظهاره كدائرة تفاعلية أسفل القائمة الجانبية.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {socialLinksList.map((item) => {
                            const info = getSocialPlatformInfo(item.url, item.name);
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "p-5 rounded-3xl border transition-all flex items-center justify-between gap-4 bg-white",
                                  item.enabled !== false ? "border-gray-200 shadow-sm" : "border-gray-100 opacity-60 bg-gray-50/50"
                                )}
                              >
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm", info.colorClass)}>
                                    <SocialPlatformIcon platform={info.platform} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-black text-sm text-gray-900 truncate">{item.name || info.label}</h4>
                                    <p className="text-[11px] font-mono text-gray-400 truncate dir-ltr text-left" dir="ltr">{item.url}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Toggle Button */}
                                  <button
                                    onClick={() => handleToggleSocialLink(item.id)}
                                    title={item.enabled !== false ? "تعطيل الرابط" : "تفعيل الرابط"}
                                    className={cn(
                                      "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all",
                                      item.enabled !== false ? "bg-emerald-50 text-emerald-600" : "bg-gray-200 text-gray-600"
                                    )}
                                  >
                                    {item.enabled !== false ? 'مفعل' : 'معطل'}
                                  </button>
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleRemoveSocialLink(item.id)}
                                    title="حذف الرابط"
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {/* Preview in Sidebar Simulation */}
                    {socialLinksList.length > 0 && (
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200/80 mb-8 space-y-3">
                        <span className="text-xs font-black text-gray-500 block">معاينة ظهور الروابط أسفل القائمة الجانبية:</span>
                        <div className="bg-white p-4 rounded-2xl border border-gray-200/60 shadow-inner flex justify-center">
                          <SocialLinks />
                        </div>
                      </div>
                    )}
                    {/* Save Button */}
                    <button
                      onClick={handleSaveSocialLinks}
                      disabled={isSaving}
                      className="w-full text-white h-14 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary-gradient)' }}
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <ShieldCheck size={20} />}
                      {isSaving ? 'جاري الحفظ...' : 'حفظ روابط مواقع التواصل الاجتماعي'}
                    </button>
                  </section>
                </motion.div>
              ) : activeTab === 'maintenance' ? (
                <motion.div
                  key="maintenance"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <section className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center">
                          <Wrench size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-gray-900">إدارة صيانة الموقع والتطبيق</h2>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">تفعيل إغلاق الموقع المؤقت للزوار مع عرض صفحة صيانة حديثة ومصممة بألوان الموقع</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider hidden sm:inline-flex items-center gap-1.5",
                        maintenanceEnabled ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                      )}>
                        <Power size={14} />
                        <span>{maintenanceEnabled ? "الصيانة نشطة الان" : "الموقع متاح للجميع"}</span>
                      </span>
                    </div>
                    {/* Main Enable Switch Banner */}
                    <div className={cn(
                      "p-6 sm:p-8 rounded-3xl border transition-all mb-8 flex flex-col sm:flex-row items-center justify-between gap-6",
                      maintenanceEnabled
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="space-y-1 text-center sm:text-right">
                        <h3 className="font-black text-base sm:text-lg text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                          <span>تفعيل وضع الصيانة العام للموقع</span>
                          {maintenanceEnabled && <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span></span>}
                        </h3>
                        <p className="text-xs text-gray-500 font-bold max-w-xl">
                          عند التفعيل، سيتم إعادة توجيه جميع الزوار لصفحة الصيانة التفاعلية العصريّة، بينما يمكنك أنت والمشرفين تصفح الموقع والعمل عليه بحرية.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                        className={cn(
                          "w-20 h-10 rounded-full transition-all relative shrink-0 shadow-inner cursor-pointer",
                          maintenanceEnabled ? "bg-amber-500" : "bg-gray-300"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 bg-white rounded-full absolute top-1 transition-all shadow-md flex items-center justify-center text-xs font-black",
                          maintenanceEnabled ? "left-1 text-amber-600" : "right-1 text-gray-400"
                        )}>
                          {maintenanceEnabled ? "ON" : "OFF"}
                        </span>
                      </button>
                    </div>
                    {/* Form inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {/* Title Input */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-700 block">عنوان صفحة الصيانة الرئيسية *</label>
                        <input
                          type="text"
                          value={maintenanceTitle}
                          onChange={(e) => setMaintenanceTitle(e.target.value)}
                          placeholder="مثال: الموقع قيد الصيانة والتحديث"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        />
                      </div>
                      {/* Detailed Message */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-gray-700 block">رسالة الصيانة والشرح للزوار *</label>
                        <textarea
                          rows={3}
                          value={maintenanceMessage}
                          onChange={(e) => setMaintenanceMessage(e.target.value)}
                          placeholder="اكتب توضيحاً لطيفاً للزوار..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all resize-none"
                        />
                      </div>
                      {/* Estimated Time */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 block">الوقت المتوقع للانتهاء</label>
                        <input
                          type="text"
                          value={maintenanceEstimatedTime}
                          onChange={(e) => setMaintenanceEstimatedTime(e.target.value)}
                          placeholder="مثال: ساعتين، قريباً جداً، 30 دقيقة"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                        />
                      </div>
                      {/* WhatsApp support number */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 block">رقم الواتساب للتواصل والدعم</label>
                        <input
                          type="text"
                          value={maintenanceWhatsapp}
                          onChange={(e) => setMaintenanceWhatsapp(e.target.value)}
                          placeholder="مثال: 01029892573"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all dir-ltr"
                          dir="ltr"
                        />
                      </div>
                      {/* Telegram link */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-700 block">حساب أو قناة التلجرام للتحديثات</label>
                        <input
                          type="text"
                          value={maintenanceTelegram}
                          onChange={(e) => setMaintenanceTelegram(e.target.value)}
                          placeholder="مثال: https://t.me/rayanapp أو @rayanapp"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all dir-ltr"
                          dir="ltr"
                        />
                      </div>
                      {/* Show Social Links Toggle */}
                      <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-200 self-end">
                        <div>
                          <p className="font-bold text-xs text-gray-800">إظهار أزرار التواصل والدعم</p>
                          <p className="text-[11px] text-gray-400">إظهار رابط التلجرام والواتساب في صفحة الصيانة</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMaintenanceShowSocial(!maintenanceShowSocial)}
                          className={cn(
                            "w-12 h-7 rounded-full transition-all relative shrink-0",
                            maintenanceShowSocial ? "bg-primary" : "bg-gray-300"
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                            maintenanceShowSocial ? "left-1" : "right-1"
                          )} />
                        </button>
                      </div>
                    </div>
                    {/* Live Preview Box */}
                    <div className="mb-8 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                        <Eye size={16} className="text-primary" />
                        <span>معاينة حيّة ومباشرة لصفحة الصيانة (تتأثر بلون الهوية):</span>
                      </div>
                      <div className="p-4 sm:p-6 bg-slate-950 text-white rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
                        <MaintenanceView
                          isFullPage={false}
                          title={maintenanceTitle}
                          message={maintenanceMessage}
                          estimatedTime={maintenanceEstimatedTime}
                          showSocialLinks={maintenanceShowSocial}
                        />
                      </div>
                    </div>
                    {/* Save Button */}
                    <button
                      onClick={handleSaveMaintenance}
                      disabled={isSaving}
                      className="w-full text-white h-14 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: 'var(--primary-gradient)' }}
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : <ShieldCheck size={20} />}
                      {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر إعدادات الصيانة'}
                    </button>
                  </section>
                </motion.div>
              ) : activeTab === 'content' ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {/* Content Header - Only show at top level */}
                   {viewLevel === 'categories' && (
                    <div className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                      <div className="text-center md:text-right">
                        <h2 className="text-2xl sm:text-3xl font-black mb-1">إدارة المحتوى</h2>
                        <p className="text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest">تعديل أقسام الموقع والمنشورات</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="بحث في الأقسام..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-3 pr-12 text-sm font-bold w-full md:w-64 outline-none focus:bg-white focus:border-primary/30 transition-all"
                          />
                          <Database size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <button
                          onClick={() => setEditingCategory({ name: '', type: 'XML', displayStyle: 'style1', isHidden: false, useCustomAccent: false, accentColor: '' })}
                          className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                        >
                          <Plus size={18} />
                          <span>قسم جديد</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {viewLevel === 'categories' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                      {categories
                        .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((cat, idx) => (
                        <div key={`cat-${cat.id}-${idx}`} className="bg-white rounded-[28px] sm:rounded-[40px] overflow-hidden shadow-sm border border-gray-100 group hover:shadow-xl transition-all duration-500">
                          <div 
                            className="p-6 sm:p-8 text-white relative transition-all"
                            style={{
                              background: cat.useCustomAccent && cat.accentColor 
                                ? `linear-gradient(135deg, ${cat.accentColor}, ${cat.accentColor}dd)` 
                                : 'var(--primary-gradient, #2563EB)'
                            }}
                          >
                            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                                  {cat.displayStyle || 'style1'}
                                </span>
                                {cat.useCustomAccent && cat.accentColor ? (
                                  <span className="px-2 py-0.5 bg-black/20 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.accentColor }} />
                                    لون مخصص
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-white/15 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold">
                                    لون الموقع الرئيسي
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCategoryVisibility(cat.id, !!cat.isHidden);
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md transition-all shadow-xs",
                                    cat.isHidden 
                                      ? "bg-red-500/90 text-white hover:bg-red-600" 
                                      : "bg-emerald-500/90 text-white hover:bg-emerald-600"
                                  )}
                                  title={cat.isHidden ? "القسم مخفي عن الزوار - انقر لإظهاره" : "القسم ظاهر للزوار - انقر لإخفائه"}
                                >
                                  {cat.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                                  <span>{cat.isHidden ? 'مخفي عن الزوار' : 'ظاهر للزوار'}</span>
                                </button>
                                <div className="w-2 h-8 sm:h-10 bg-white/20 rounded-full" />
                              </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black">{cat.name}</h3>
                          </div>
                          <div className="p-4 sm:p-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="flex justify-between sm:justify-start gap-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMoveCategory(cat.id, 'up')}
                                  disabled={categories.indexOf(cat) === 0}
                                  className="p-2 sm:p-2.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                                >
                                  <ArrowUp size={16} />
                                </button>
                                <button
                                  onClick={() => handleMoveCategory(cat.id, 'down')}
                                  disabled={categories.indexOf(cat) === categories.length - 1}
                                  className="p-2 sm:p-2.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                                >
                                  <ArrowDown size={16} />
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleToggleCategoryVisibility(cat.id, !!cat.isHidden)}
                                  className={cn(
                                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors border",
                                    cat.isHidden
                                      ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                      : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
                                  )}
                                  title={cat.isHidden ? "القسم مخفي - انقر لإظهاره للزوار" : "القسم ظاهر - انقر لإخفائه عن الزوار"}
                                >
                                  {cat.isHidden ? <EyeOff size={18} className="sm:hidden" /> : <Eye size={18} className="sm:hidden" />}
                                  {cat.isHidden ? <EyeOff size={20} className="hidden sm:block" /> : <Eye size={20} className="hidden sm:block" />}
                                </button>
                                <button
                                  onClick={() => initiateDelete(`categories/${cat.id}`, 'category', cat.name)}
                                  className="p-3 sm:p-4 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 size={18} className="sm:hidden" />
                                  <Trash2 size={20} className="hidden sm:block" />
                                </button>
                                <button
                                  onClick={() => setEditingCategory(cat)}
                                  className="p-3 sm:p-4 bg-gray-50 text-gray-400 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100"
                                >
                                  <Edit3 size={18} className="sm:hidden" />
                                  <Edit3 size={20} className="hidden sm:block" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                handleSetSelectedManager({type: 'category', id: cat.id});
                                handleSetViewLevel('subcategories');
                              }}
                              className="py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-primary/10 hover:opacity-90 transition-all active:scale-95"
                            >
                              إدارة القسم
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : viewLevel === 'subcategories' ? (
                    <div className="space-y-6 sm:space-y-8">
                       <div className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 text-center shadow-sm border border-gray-100 relative">
                        <div className="flex flex-col items-center gap-4">
                          {/* Breadcrumbs for easier navigation */}
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full mb-2">
                            <button onClick={() => handleSetViewLevel('categories')} className="hover:text-primary transition-colors">المحتوى</button>
                            <ChevronRight size={12} />
                            <span className="text-primary truncate max-w-[150px]">
                              {categories.find(c => c.id === selectedManagerId?.id)?.name}
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {categories.find(c => c.id === selectedManagerId?.id)?.name}
                          </h2>
                          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">إدارة المنشورات والأقسام الفرعية</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mx-auto mt-6 sm:mt-8">
                          <button
                            onClick={() => setEditingSubCategory({ name: '', categoryId: selectedManagerId?.id, description: '', displayStyle: 'style1', fileTypes: '', isHidden: false, useCustomAccent: false, accentColor: '' })}
                            className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-gray-50 transition-all active:scale-95"
                          >
                            <FolderPlus size={18} className="sm:hidden" />
                            <FolderPlus size={20} className="hidden sm:block" />
                            <span>إضافة قسم فرعي</span>
                          </button>
                          <button
                            onClick={() => setEditingItem({ 
                              title: '', 
                              subCategoryId: selectedManagerId?.id, 
                              description: '', 
                              downloadUrl: '', 
                              prompt: '', 
                              promptInstructions: '', 
                              usedApps: [], 
                              hasMaterials: false, 
                              materialsUrl: '', 
                              materialsLabel: '', 
                              materialsDescription: '' 
                            })}
                            className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                          >
                            <Plus size={18} className="sm:hidden" />
                            <Plus size={20} className="hidden sm:block" />
                            <span>إضافة محتوى مباشر</span>
                          </button>
                        </div>
                        {(relevantSubs.length > 0 || items.length > 0) && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 border-t border-gray-100 mt-6 sm:mt-8">
                            {relevantSubs.length > 0 && items.length > 0 ? (
                              <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl w-full sm:w-auto">
                                <button
                                  onClick={() => setCategoryViewTab('all')}
                                  className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    categoryViewTab === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                  )}
                                >
                                  <span>عرض الكل</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-black">
                                    {relevantSubs.length + items.length}
                                  </span>
                                </button>
                                <button
                                  onClick={() => setCategoryViewTab('subcategories')}
                                  className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    categoryViewTab === 'subcategories' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                  )}
                                >
                                  <List size={14} />
                                  <span>الأقسام الفرعية</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-black">
                                    {relevantSubs.length}
                                  </span>
                                </button>
                                <button
                                  onClick={() => setCategoryViewTab('items')}
                                  className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                    categoryViewTab === 'items' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                  )}
                                >
                                  <Database size={14} />
                                  <span>المحتوى المباشر</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-black">
                                    {items.length}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-gray-400">
                                {relevantSubs.length > 0 ? `الأقسام الفرعية (${relevantSubs.length})` : `المحتوى المباشر (${items.length})`}
                              </div>
                            )}
                            <div className="relative group w-full sm:w-64">
                              <input
                                type="text"
                                placeholder="بحث في الأقسام أو المحتوى..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2.5 pr-10 text-xs font-bold w-full outline-none focus:bg-white focus:border-primary/30 transition-all"
                              />
                              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-6 sm:space-y-8">
                        {/* Subcategories */}
                        {(categoryViewTab === 'all' || categoryViewTab === 'subcategories') && (
                          relevantSubs.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex items-center justify-between mr-2 sm:mr-4">
                                <h3 className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                                  <List size={16} />
                                  <span>الأقسام الفرعية ({relevantSubs.length})</span>
                                </h3>
                              </div>
                              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {relevantSubs
                                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map((sub, idx) => (
                                  <div key={`sub-${sub.id}-${idx}`} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                      <div 
                                        className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-colors shrink-0"
                                        style={{
                                          backgroundColor: sub.useCustomAccent && sub.accentColor ? `${sub.accentColor}18` : undefined,
                                          color: sub.useCustomAccent && sub.accentColor ? sub.accentColor : undefined
                                        }}
                                      >
                                        <List size={18} className="sm:hidden" />
                                        <List size={20} className="hidden sm:block" />
                                      </div>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-black text-base sm:text-lg">{sub.name}</span>
                                          {sub.isHidden ? (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 flex items-center gap-1">
                                              <EyeOff size={10} /> مخفي عن الزوار
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                              <Eye size={10} /> معروض للزوار
                                            </span>
                                          )}
                                          {sub.useCustomAccent && sub.accentColor && (
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-700 flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: sub.accentColor }} />
                                              لون مخصص
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                          {sub.displayStyle || 'style1'} • {sub.fileTypes || 'بدون صيغة'} • {sub.useCustomAccent && sub.accentColor ? 'لون مخصص' : 'لون الموقع الرئيسي'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                                      <div className="flex items-center gap-1 sm:gap-1.5 ml-0 sm:ml-2">
                                        <button
                                          onClick={() => handleMoveSubCategory(sub.id, 'up')}
                                          disabled={idx === 0}
                                          className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all border border-transparent"
                                        >
                                          <ArrowUp size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleMoveSubCategory(sub.id, 'down')}
                                          disabled={idx === relevantSubs.length - 1}
                                          className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all border border-transparent"
                                        >
                                          <ArrowDown size={14} />
                                        </button>
                                      </div>
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSubCategoryVisibility(sub.id, !!sub.isHidden)}
                                          className={cn(
                                            "p-2 sm:p-3 rounded-xl transition-colors border",
                                            sub.isHidden
                                              ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                                              : "bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100 hover:text-gray-600"
                                          )}
                                          title={sub.isHidden ? "القسم الفرعي مخفي - انقر لإظهاره للزوار" : "القسم الفرعي معروض - انقر لإخفائه عن الزوار"}
                                        >
                                          {sub.isHidden ? <EyeOff size={18} className="sm:hidden" /> : <Eye size={18} className="sm:hidden" />}
                                          {sub.isHidden ? <EyeOff size={20} className="hidden sm:block" /> : <Eye size={20} className="hidden sm:block" />}
                                        </button>
                                        <button
                                          onClick={() => initiateDelete(`categories/${sub.id}`, 'subcategory', sub.name)}
                                          className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                          title="حذف القسم الفرعي"
                                        >
                                          <Trash2 size={18} className="sm:hidden" />
                                          <Trash2 size={20} className="hidden sm:block" />
                                        </button>
                                        <button
                                          onClick={() => setEditingSubCategory({...sub, categoryId: sub.parentId})}
                                          className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                          title="تعديل القسم الفرعي"
                                        >
                                          <Edit3 size={18} className="sm:hidden" />
                                          <Edit3 size={20} className="hidden sm:block" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedManagerId({type: 'subcategory', id: sub.id});
                                            setViewLevel('items');
                                          }}
                                          className="px-4 py-2 sm:p-3 bg-primary/5 sm:bg-transparent text-primary hover:bg-primary/10 rounded-xl transition-all font-bold text-xs sm:text-sm flex items-center gap-2"
                                        >
                                          <Database size={18} className="sm:hidden" />
                                          <Database size={20} className="hidden sm:block" />
                                          <span className="sm:hidden text-xs">إدارة المحتوى</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : categoryViewTab === 'subcategories' ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              <p className="text-gray-400 text-xs font-bold">لا توجد أقسام فرعية في هذا القسم بعد</p>
                            </div>
                          ) : null
                        )}

                        {/* Direct Items */}
                        {(categoryViewTab === 'all' || categoryViewTab === 'items') && (
                          items.length > 0 ? (
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mr-2 sm:mr-4">
                                <h3 className="text-primary font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                                  <Database size={16} />
                                  <span>المحتوى المباشر في هذا القسم ({items.length})</span>
                                </h3>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectAllItems(
                                      items.filter(item =>
                                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
                                      )
                                    )}
                                    className="text-xs font-bold text-gray-500 hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200"
                                  >
                                    {items
                                      .filter(item =>
                                        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        item.description.toLowerCase().includes(searchQuery.toLowerCase())
                                      )
                                      .every(i => selectedItemIds.includes(i.id)) && selectedItemIds.length > 0 ? (
                                      <>
                                        <CheckSquare size={14} className="text-primary" />
                                        <span>إلغاء تحديد الكل</span>
                                      </>
                                    ) : (
                                      <>
                                        <Square size={14} />
                                        <span>تحديد الكل</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Selected Items Action Bar */}
                              {selectedItemIds.length > 0 && (
                                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 border-2 border-primary/20 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-sm">
                                      {selectedItemIds.length}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-black text-xs sm:text-sm text-gray-900">
                                        تم تحديد {selectedItemIds.length} منشور
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-gray-500">
                                        يمكنك نقل المنشورات المحددة إلى أي قسم فرعي أو رئيسي
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedItemIds([])}
                                      className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 transition-all"
                                    >
                                      إلغاء التحديد
                                    </button>
                                    <button
                                      type="button"
                                      onClick={openBatchTransfer}
                                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition-all active:scale-95"
                                    >
                                      <FolderInput size={16} />
                                      <span>نقل المحدد ({selectedItemIds.length})</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {(() => {
                                  const sortedItemsList = [...items].sort((a, b) => {
                                    if (typeof a.order === 'number' && typeof b.order === 'number' && a.order !== b.order) {
                                      return a.order - b.order;
                                    }
                                    return 0;
                                  });
                                  const filteredSortedItems = sortedItemsList.filter(item =>
                                    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    item.description.toLowerCase().includes(searchQuery.toLowerCase())
                                  );
                                  return filteredSortedItems.map((item, idx) => (
                                    <div
                                      key={`item-${item.id}-${idx}`}
                                      className={cn(
                                        "bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border transition-all flex items-center justify-between group hover:shadow-md",
                                        selectedItemIds.includes(item.id)
                                          ? "border-primary/40 ring-2 ring-primary/15 bg-primary/[0.02]"
                                          : "border-gray-100"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelectItem(item.id);
                                          }}
                                          className={cn(
                                            "p-2 rounded-xl border transition-all flex items-center justify-center shrink-0",
                                            selectedItemIds.includes(item.id)
                                              ? "bg-primary text-white border-primary shadow-sm"
                                              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-primary/40 hover:text-gray-600"
                                          )}
                                          title={selectedItemIds.includes(item.id) ? "إلغاء التحديد" : "تحديد المنشور للنقل"}
                                        >
                                          {selectedItemIds.includes(item.id) ? (
                                            <CheckSquare size={18} />
                                          ) : (
                                            <Square size={18} />
                                          )}
                                        </button>
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 relative overflow-hidden flex-shrink-0">
                                          {item.imageUrl ? (
                                            <Image src={item.imageUrl} fill className="object-cover" alt="" referrerPolicy="no-referrer" />
                                          ) : (
                                            <>
                                              <Database size={20} className="sm:hidden" />
                                              <Database size={24} className="hidden sm:block" />
                                            </>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 shrink-0">
                                              #{typeof item.order === 'number' ? item.order : idx}
                                            </span>
                                            <h4 className="font-black text-base sm:text-lg truncate">{item.title}</h4>
                                          </div>
                                          <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{item.description}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                        <div className="flex flex-col gap-0.5 ml-1">
                                          <button
                                            type="button"
                                            onClick={() => handleMoveItem(item.id, 'up')}
                                            disabled={idx === 0 || isSaving}
                                            className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md disabled:opacity-20 transition-all"
                                            title="تقديم للأعلى (ترتيب أسبق)"
                                          >
                                            <ChevronUp size={15} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleMoveItem(item.id, 'down')}
                                            disabled={idx === filteredSortedItems.length - 1 || isSaving}
                                            className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-md disabled:opacity-20 transition-all"
                                            title="تأخير للأسفل (ترتيب تالي)"
                                          >
                                            <ChevronDown size={15} />
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => openSingleItemTransfer(item.id)}
                                          className="p-2 sm:p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                          title="نقل هذا المنشور إلى قسم آخر"
                                        >
                                          <FolderInput size={18} className="sm:hidden" />
                                          <FolderInput size={20} className="hidden sm:block" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingItem({ ...item, subCategoryId: item.subCategoryId || selectedManagerId?.id })}
                                          className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                          title="تعديل المحتوى"
                                        >
                                          <Edit3 size={18} className="sm:hidden" />
                                          <Edit3 size={20} className="hidden sm:block" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => initiateDelete(`categories/${selectedManagerId?.id}/items/${item.id}`, 'item', item.title)}
                                          className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                          title="حذف المحتوى"
                                        >
                                          <Trash2 size={18} className="sm:hidden" />
                                          <Trash2 size={20} className="hidden sm:block" />
                                        </button>
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          ) : categoryViewTab === 'items' ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                              <p className="text-gray-400 text-xs font-bold">لا يوجد محتوى مباشر في هذا القسم بعد</p>
                            </div>
                          ) : null
                        )}

                        {/* Empty State */}
                        {relevantSubs.length === 0 && items.length === 0 && (
                          <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-2">
                            <p className="text-gray-500 font-black text-sm">لا يوجد محتوى أو أقسام فرعية بعد في هذا القسم</p>
                            <p className="text-gray-400 text-xs">يمكنك البدء بإضافة قسم فرعي أو إضافة محتوى مباشر لهذا القسم</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 sm:space-y-8">
                       <div className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 text-center shadow-sm border border-gray-100 relative">
                        <div className="flex flex-col items-center gap-4">
                          {/* Breadcrumbs for easier navigation */}
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full mb-2 overflow-x-auto max-w-full">
                            <button onClick={() => handleSetViewLevel('categories')} className="hover:text-primary transition-colors whitespace-nowrap">المحتوى</button>
                            <ChevronRight size={12} className="shrink-0" />
                            <button
                              onClick={() => {
                                const sub = subCategories.find(s => s.id === selectedManagerId?.id);
                                if (sub) {
                                  handleSetSelectedManager({type: 'category', id: sub.parentId});
                                  handleSetViewLevel('subcategories');
                                }
                              }}
                              className="hover:text-primary transition-colors truncate max-w-[100px]"
                            >
                              {categories.find(c => c.id === subCategories.find(s => s.id === selectedManagerId?.id)?.parentId)?.name}
                            </button>
                            <ChevronRight size={12} className="shrink-0" />
                            <span className="text-primary truncate max-w-[100px]">
                              {subCategories.find(s => s.id === selectedManagerId?.id)?.name}
                            </span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                            {subCategories.find(s => s.id === selectedManagerId?.id)?.name}
                          </h2>
                          <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">إدارة المحتوى المضاف</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 sm:mt-8">
                          <div className="relative group w-full sm:w-64">
                            <input
                              type="text"
                              placeholder="بحث في المحتوى..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-3 pr-12 text-sm font-bold w-full outline-none focus:bg-white focus:border-primary/30 transition-all"
                            />
                            <Database size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSelectAllItems(
                              items.filter(item =>
                                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.description.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                            )}
                            className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all"
                          >
                            {items
                              .filter(item =>
                                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.description.toLowerCase().includes(searchQuery.toLowerCase())
                              )
                              .every(i => selectedItemIds.includes(i.id)) && selectedItemIds.length > 0 ? (
                              <>
                                <CheckSquare size={16} className="text-primary" />
                                <span>إلغاء تحديد الكل</span>
                              </>
                            ) : (
                              <>
                                <Square size={16} />
                                <span>تحديد الكل</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setEditingItem({ 
                              title: '', 
                              subCategoryId: selectedManagerId?.id, 
                              description: '', 
                              downloadUrl: '', 
                              prompt: '', 
                              promptInstructions: '', 
                              usedApps: [], 
                              hasMaterials: false, 
                              materialsUrl: '', 
                              materialsLabel: '', 
                              materialsDescription: '' 
                            })}
                            className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
                          >
                            <Plus size={18} className="sm:hidden" />
                            <Plus size={20} className="hidden sm:block" />
                            <span>إضافة محتوى</span>
                          </button>
                        </div>
                      </div>

                      {/* Selected Items Action Bar in Items View */}
                      {selectedItemIds.length > 0 && (
                        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-amber-500/10 border-2 border-primary/20 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-sm">
                              {selectedItemIds.length}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-xs sm:text-sm text-gray-900">
                                تم تحديد {selectedItemIds.length} منشور
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500">
                                يمكنك نقل المنشورات المحددة إلى أي قسم فرعي أو رئيسي
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setSelectedItemIds([])}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-500 transition-all"
                            >
                              إلغاء التحديد
                            </button>
                            <button
                              type="button"
                              onClick={openBatchTransfer}
                              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition-all active:scale-95"
                            >
                              <FolderInput size={16} />
                              <span>نقل المحدد ({selectedItemIds.length})</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {items
                          .filter(item =>
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((item, idx) => (
                          <div
                            key={`item-${item.id}-${idx}`}
                            className={cn(
                              "bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border transition-all flex items-center justify-between group hover:shadow-md",
                              selectedItemIds.includes(item.id)
                                ? "border-primary/40 ring-2 ring-primary/15 bg-primary/[0.02]"
                                : "border-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelectItem(item.id);
                                }}
                                className={cn(
                                  "p-2 rounded-xl border transition-all flex items-center justify-center shrink-0",
                                  selectedItemIds.includes(item.id)
                                    ? "bg-primary text-white border-primary shadow-sm"
                                    : "bg-gray-50 text-gray-400 border-gray-200 hover:border-primary/40 hover:text-gray-600"
                                )}
                                title={selectedItemIds.includes(item.id) ? "إلغاء التحديد" : "تحديد المنشور للنقل"}
                              >
                                {selectedItemIds.includes(item.id) ? (
                                  <CheckSquare size={18} />
                                ) : (
                                  <Square size={18} />
                                )}
                              </button>
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-400 relative overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                  <Image src={item.imageUrl} fill className="object-cover" alt="" referrerPolicy="no-referrer" />
                                ) : (
                                  <>
                                    <Database size={20} className="sm:hidden" />
                                    <Database size={24} className="hidden sm:block" />
                                  </>
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-base sm:text-lg truncate">{item.title}</h4>
                                <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{item.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => openSingleItemTransfer(item.id)}
                                className="p-2 sm:p-3 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                title="نقل هذا المنشور إلى قسم آخر"
                              >
                                <FolderInput size={18} className="sm:hidden" />
                                <FolderInput size={20} className="hidden sm:block" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem({ ...item, subCategoryId: item.subCategoryId || selectedManagerId?.id })}
                                className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                title="تعديل المحتوى"
                              >
                                <Edit3 size={18} className="sm:hidden" />
                                <Edit3 size={20} className="hidden sm:block" />
                              </button>
                              <button
                                type="button"
                                onClick={() => initiateDelete(`categories/${selectedManagerId?.id}/items/${item.id}`, 'item', item.title)}
                                className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                title="حذف المحتوى"
                              >
                                <Trash2 size={18} className="sm:hidden" />
                                <Trash2 size={20} className="hidden sm:block" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Modals for Editing */}
                  <AnimatePresence>
                    {/* Transfer Items Modal */}
                    {transferModal && (
                      <div
                        key="transfer-items-modal"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-white rounded-[28px] sm:rounded-[36px] p-5 sm:p-8 w-full max-w-xl shadow-2xl relative max-h-[90vh] flex flex-col"
                        >
                          {/* Close Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isTransferring) {
                                setTransferModal(null);
                                setTargetDestinationId('');
                              }
                            }}
                            disabled={isTransferring}
                            className="absolute left-4 sm:left-6 top-4 sm:top-6 p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-30"
                          >
                            <X size={20} />
                          </button>

                          {/* Header */}
                          <div className="flex items-center gap-3 mb-4 pr-1">
                            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                              <FolderInput size={24} />
                            </div>
                            <div>
                              <h2 className="text-lg sm:text-xl font-black text-gray-900">نقل المنشورات إلى قسم آخر</h2>
                              <p className="text-xs text-gray-400 font-bold">
                                تم تحديد <span className="text-primary font-black">{transferModal.itemIds.length}</span> منشور للنقل
                              </p>
                            </div>
                          </div>

                          {/* Origin Info */}
                          <div className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex items-center justify-between gap-2 mb-4 text-xs font-bold">
                            <div className="flex items-center gap-2 text-gray-500">
                              <span>القسم الحالي:</span>
                              <span className="text-gray-900 font-black">
                                {allCategories.find(c => c.id === selectedManagerId?.id)?.name || 'القسم الحالي'}
                              </span>
                            </div>
                            <div className="text-[11px] px-2 py-0.5 rounded-lg bg-gray-200/60 text-gray-600 font-black">
                              {selectedManagerId?.type === 'category' ? 'قسم رئيسي' : 'قسم فرعي'}
                            </div>
                          </div>

                          {/* Search Destinations */}
                          <div className="relative mb-3">
                            <input
                              type="text"
                              placeholder="ابحث عن اسم القسم أو القسم الفرعي..."
                              value={transferSearchQuery}
                              onChange={(e) => setTransferSearchQuery(e.target.value)}
                              className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-2.5 pr-10 text-xs font-bold w-full outline-none focus:bg-white focus:border-primary/30 transition-all"
                            />
                            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>

                          {/* Tabs if there are relevant subcategories */}
                          {relevantSubs.length > 0 && !transferSearchQuery && (
                            <div className="flex items-center bg-gray-100 p-1 rounded-2xl mb-3 text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => setTransferTab('subs')}
                                className={cn(
                                  "flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
                                  transferTab === 'subs' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                              >
                                <List size={14} />
                                <span>أقسام هذا القسم الفرعية ({relevantSubs.length})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTransferTab('all')}
                                className={cn(
                                  "flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5",
                                  transferTab === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                )}
                              >
                                <Layers size={14} />
                                <span>جميع الأقسام الأخرى</span>
                              </button>
                            </div>
                          )}

                          {/* Destination List (Scrollable) */}
                          <div className="flex-1 overflow-y-auto max-h-[260px] space-y-2 pr-1 pl-1">
                            {(() => {
                              // If searching
                              if (transferSearchQuery.trim()) {
                                const query = transferSearchQuery.toLowerCase().trim();
                                const matched = allCategories.filter(c =>
                                  c.id !== selectedManagerId?.id &&
                                  c.name.toLowerCase().includes(query)
                                );

                                if (matched.length === 0) {
                                  return (
                                    <div className="text-center py-8 text-gray-400 text-xs font-bold">
                                      لا توجد أقسام مطابقة للبحث
                                    </div>
                                  );
                                }

                                return matched.map(cat => {
                                  const isSelected = targetDestinationId === cat.id;
                                  const parentCat = cat.parentId ? categories.find(p => p.id === cat.parentId) : null;
                                  return (
                                    <button
                                      key={`dest-search-${cat.id}`}
                                      type="button"
                                      onClick={() => setTargetDestinationId(cat.id)}
                                      className={cn(
                                        "w-full text-right p-3 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 group",
                                        isSelected
                                          ? "border-primary bg-primary/5 shadow-sm"
                                          : "border-gray-100 hover:border-primary/20 hover:bg-gray-50"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                          "p-2 rounded-xl transition-colors shrink-0",
                                          isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:text-primary"
                                        )}>
                                          {cat.parentId ? <List size={16} /> : <Layers size={16} />}
                                        </div>
                                        <div className="min-w-0 text-right">
                                          <div className="font-black text-xs sm:text-sm truncate text-gray-900">{cat.name}</div>
                                          <div className="text-[10px] text-gray-400 font-bold">
                                            {parentCat ? `تابع لقسم: ${parentCat.name}` : 'قسم رئيسي'}
                                          </div>
                                        </div>
                                      </div>
                                      {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                          <Check size={14} />
                                        </div>
                                      )}
                                    </button>
                                  );
                                });
                              }

                              // Tab 1: Current Subcategories
                              if (transferTab === 'subs' && relevantSubs.length > 0) {
                                return (
                                  <div className="space-y-2">
                                    <div className="text-[11px] font-bold text-gray-400 px-1">
                                      اختر القسم الفرعي المراد نقل المنشورات إليه مباشرة:
                                    </div>
                                    {relevantSubs.map(sub => {
                                      const isSelected = targetDestinationId === sub.id;
                                      return (
                                        <button
                                          key={`sub-dest-${sub.id}`}
                                          type="button"
                                          onClick={() => setTargetDestinationId(sub.id)}
                                          className={cn(
                                            "w-full text-right p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 group",
                                            isSelected
                                              ? "border-primary bg-primary/5 shadow-sm"
                                              : "border-gray-100 hover:border-primary/20 hover:bg-gray-50"
                                          )}
                                        >
                                          <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                              "p-2.5 rounded-xl transition-colors shrink-0",
                                              isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:text-primary"
                                            )}>
                                              <List size={18} />
                                            </div>
                                            <div className="min-w-0 text-right">
                                              <div className="font-black text-xs sm:text-sm truncate text-gray-900">{sub.name}</div>
                                              <div className="text-[10px] text-gray-400 font-bold">
                                                نمط العرض: {sub.displayStyle || 'style1'} • {sub.fileTypes || 'بدون صيغة'}
                                              </div>
                                            </div>
                                          </div>
                                          {isSelected ? (
                                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                              <Check size={14} />
                                            </div>
                                          ) : (
                                            <div className="text-[11px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                              اختيار
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              // Tab 2: All Other Categories and Subcategories
                              return (
                                <div className="space-y-3">
                                  {categories
                                    .filter(c => c.id !== selectedManagerId?.id)
                                    .map(mainCat => {
                                      const mainSubs = subCategories.filter(s => s.parentId === mainCat.id && s.id !== selectedManagerId?.id);
                                      const isMainSelected = targetDestinationId === mainCat.id;

                                      return (
                                        <div key={`cat-group-${mainCat.id}`} className="space-y-1.5 bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
                                          {/* Main Category Itself */}
                                          <button
                                            type="button"
                                            onClick={() => setTargetDestinationId(mainCat.id)}
                                            className={cn(
                                              "w-full text-right p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 group",
                                              isMainSelected
                                                ? "border-primary bg-primary text-white"
                                                : "border-transparent bg-white hover:border-primary/30"
                                            )}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <Layers size={16} className={isMainSelected ? "text-white" : "text-primary"} />
                                              <span className="font-black text-xs sm:text-sm truncate">{mainCat.name}</span>
                                              <span className={cn(
                                                "text-[9px] px-1.5 py-0.5 rounded-md font-bold",
                                                isMainSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                              )}>
                                                قسم رئيسي
                                              </span>
                                            </div>
                                            {isMainSelected && <Check size={14} />}
                                          </button>

                                          {/* Its Subcategories */}
                                          {mainSubs.length > 0 && (
                                            <div className="grid grid-cols-1 gap-1 mr-3">
                                              {mainSubs.map(sub => {
                                                const isSubSelected = targetDestinationId === sub.id;
                                                return (
                                                  <button
                                                    key={`sub-under-${sub.id}`}
                                                    type="button"
                                                    onClick={() => setTargetDestinationId(sub.id)}
                                                    className={cn(
                                                      "text-right p-2 rounded-xl border transition-all flex items-center justify-between gap-2 group",
                                                      isSubSelected
                                                        ? "border-primary bg-primary/10 text-primary font-black"
                                                        : "border-gray-100 bg-white hover:border-primary/20 text-gray-700"
                                                    )}
                                                  >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <List size={14} className={isSubSelected ? "text-primary" : "text-gray-400"} />
                                                      <span className="text-xs truncate">{sub.name}</span>
                                                    </div>
                                                    {isSubSelected && <Check size={14} className="text-primary shrink-0" />}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Footer Preview & Actions */}
                          <div className="pt-4 mt-3 border-t border-gray-100 space-y-3">
                            {targetDestinationId && (
                              <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs font-bold text-primary">
                                <span className="flex items-center gap-1.5 truncate">
                                  <ArrowRightLeft size={14} />
                                  <span>الوجهة المختارة:</span>
                                  <span className="font-black text-gray-900">
                                    {allCategories.find(c => c.id === targetDestinationId)?.name}
                                  </span>
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  ({transferModal.itemIds.length} منشور)
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                disabled={isTransferring}
                                onClick={() => {
                                  setTransferModal(null);
                                  setTargetDestinationId('');
                                }}
                                className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                disabled={!targetDestinationId || isTransferring}
                                onClick={handleTransferItems}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                              >
                                {isTransferring ? (
                                  <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span>جاري النقل...</span>
                                  </>
                                ) : (
                                  <>
                                    <FolderInput size={16} />
                                    <span>تأكيد النقل الآن</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    )}
                    {editingCategory && (
                      <div
                        key="edit-category-modal"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="absolute right-4 sm:right-8 top-4 sm:top-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={20} className="sm:hidden" />
                            <X size={24} className="hidden sm:block" />
                          </button>
                          <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-10 text-center">إعدادات القسم</h2>
                          <form onSubmit={editingCategory.id ? handleUpdateCategory : handleAddCategory} className="space-y-6 sm:space-y-8">
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">اسم القسم</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editingCategory.name}
                                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                  required
                                />
                                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[10px] font-bold">
                                  {editingCategory.name || 'القسم'}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">نمط العرض</label>
                                <select
                                  value={editingCategory.displayStyle || 'style1'}
                                  onChange={(e) => setEditingCategory({...editingCategory, displayStyle: e.target.value})}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all appearance-none"
                                >
                                  <option value="style1">شبكة أيقونات (Logos)</option>
                                  <option value="style2">أغلفة عريضة (Banners)</option>
                                  <option value="style3">تطبيقات وألعاب (Apps)</option>
                                  <option value="style4">مشغل صوتيات (Audio)</option>
                                  <option value="style5">نسخ نصوص (Prompts)</option>
                                  <option value="style6">قائمة صوتيات متقدمة</option>
                                  <option value="style8">نمط الفيديو (Video)</option>
                                  <option value="style9">أدوات الذكاء الاصطناعي (AI)</option>
                                </select>
                              </div>
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">ترتيب الأقسام الفرعية</label>
                                <select
                                  value={editingCategory.subCategoryLayout || 'vertical'}
                                  onChange={(e) => setEditingCategory({...editingCategory, subCategoryLayout: e.target.value as any})}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all appearance-none"
                                >
                                  <option value="vertical">رأسي (Vertical)</option>
                                  <option value="horizontal">أفقي (Horizontal)</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">صيغ الملفات (مثلاً: PSD, AI)</label>
                              <input
                                type="text"
                                value={editingCategory.fileTypes || ''}
                                onChange={(e) => setEditingCategory({...editingCategory, fileTypes: e.target.value})}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                placeholder="XML, PLP, APK..."
                              />
                            </div>
                            {/* حالة ظهور القسم للزوار */}
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100 transition-all">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-black text-gray-900">حالة ظهور القسم</span>
                                  {editingCategory.isHidden ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 flex items-center gap-1">
                                      <EyeOff size={11} /> مخفي عن الزوار
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                      <Eye size={11} /> معروض للزوار
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                  {editingCategory.isHidden ? 'القسم مخفي حالياً ولن يظهر للزوار في واجهة الموقع' : 'القسم ظاهر ونشط لجميع الزوار في الصفحة الرئيسية'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingCategory({...editingCategory, isHidden: !editingCategory.isHidden})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative shrink-0",
                                  editingCategory.isHidden ? "bg-gray-300" : "bg-emerald-500"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xs",
                                  editingCategory.isHidden ? "right-5 sm:right-7" : "right-0.5 sm:right-1"
                                )} />
                              </button>
                            </div>

                            {/* تخصيص لون القسم */}
                            <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs sm:text-sm font-black text-gray-900">تخصيص لون القسم</span>
                                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                    {editingCategory.useCustomAccent ? 'استخدام لون مخصص يميز هذا القسم' : 'استخدام لون الموقع الرئيسي الافتراضي'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory({
                                    ...editingCategory,
                                    useCustomAccent: !editingCategory.useCustomAccent,
                                    accentColor: !editingCategory.useCustomAccent && !editingCategory.accentColor ? '#3B82F6' : editingCategory.accentColor
                                  })}
                                  className={cn(
                                    "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative shrink-0",
                                    editingCategory.useCustomAccent ? "bg-primary" : "bg-gray-300"
                                  )}
                                >
                                  <div className={cn(
                                    "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xs",
                                    editingCategory.useCustomAccent ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                  )} />
                                </button>
                              </div>

                              {/* اختيار النمط: نفس لون الموقع أو لون مخصص */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory({...editingCategory, useCustomAccent: false})}
                                  className={cn(
                                    "p-3 rounded-xl sm:rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2",
                                    !editingCategory.useCustomAccent
                                      ? "bg-white border-primary text-primary shadow-xs"
                                      : "bg-gray-100/70 border-transparent text-gray-500 hover:bg-white/60"
                                  )}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                  <span>لون الموقع الرئيسي</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCategory({
                                    ...editingCategory,
                                    useCustomAccent: true,
                                    accentColor: editingCategory.accentColor || '#3B82F6'
                                  })}
                                  className={cn(
                                    "p-3 rounded-xl sm:rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2",
                                    editingCategory.useCustomAccent
                                      ? "bg-white border-primary text-primary shadow-xs"
                                      : "bg-gray-100/70 border-transparent text-gray-500 hover:bg-white/60"
                                  )}
                                >
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: editingCategory.accentColor || '#3B82F6' }} 
                                  />
                                  <span>لون مخصص للقسم</span>
                                </button>
                              </div>

                              {editingCategory.useCustomAccent && (
                                <div className="space-y-3 pt-2 border-t border-gray-200/60">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 block">اختر اللون المخصص</label>
                                  
                                  {/* لوحة ألوان سريعة */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {[
                                      { name: 'أزرق', hex: '#2563EB' },
                                      { name: 'بنفسجي', hex: '#7C3AED' },
                                      { name: 'وردي', hex: '#EC4899' },
                                      { name: 'أحمر', hex: '#EF4444' },
                                      { name: 'برتقالي', hex: '#F97316' },
                                      { name: 'كهرماني', hex: '#F59E0B' },
                                      { name: 'أخضر زمردي', hex: '#10B981' },
                                      { name: 'فيروزي', hex: '#06B6D4' },
                                      { name: 'رمادي داكن', hex: '#374151' },
                                    ].map((palette) => (
                                      <button
                                        key={palette.hex}
                                        type="button"
                                        onClick={() => setEditingCategory({...editingCategory, accentColor: palette.hex})}
                                        className={cn(
                                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all border-2 flex items-center justify-center",
                                          editingCategory.accentColor === palette.hex 
                                            ? "border-gray-900 scale-110 shadow-sm ring-2 ring-primary/30" 
                                            : "border-white hover:scale-105"
                                        )}
                                        style={{ backgroundColor: palette.hex }}
                                        title={palette.name}
                                      >
                                        {editingCategory.accentColor === palette.hex && (
                                          <Check size={12} className="text-white drop-shadow-xs" />
                                        )}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Color Picker و Hex input */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={editingCategory.accentColor || '#3B82F6'}
                                      onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})}
                                      className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer rounded-xl border-2 border-gray-200 shadow-xs bg-white p-1"
                                    />
                                    <input
                                      type="text"
                                      value={editingCategory.accentColor || ''}
                                      onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})}
                                      className="flex-1 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold outline-none focus:border-primary transition-all uppercase"
                                      placeholder="#3B82F6"
                                    />
                                    <div 
                                      className="px-3 py-2 rounded-xl text-white font-bold text-xs shadow-xs shrink-0 flex items-center gap-1.5"
                                      style={{ backgroundColor: editingCategory.accentColor || '#3B82F6' }}
                                    >
                                      <span>معاينة اللون</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">زر مشاركة المحتوى (إظهار/إخفاء)</span>
                              <button
                                type="button"
                                onClick={() => setEditingCategory({...editingCategory, showShareButton: editingCategory.showShareButton === false ? true : false})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingCategory.showShareButton !== false ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingCategory.showShareButton !== false ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">وضع الصيانة</span>
                              <button
                                type="button"
                                onClick={() => setEditingCategory({...editingCategory, isUnderMaintenance: !editingCategory.isUnderMaintenance})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingCategory.isUnderMaintenance ? "bg-red-500" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingCategory.isUnderMaintenance ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="w-full bg-primary text-white py-4 sm:py-5 rounded-2xl sm:rounded-[28px] font-black text-base sm:text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                            >
                              {isSaving ? 'جاري الحفظ...' : 'حفظ القسم'}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                    {editingSubCategory && (
                      <div
                        key="edit-subcategory-modal-wrapper"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                      >
                        <motion.div
                          key="edit-subcategory-modal"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                          <button
                            onClick={() => setEditingSubCategory(null)}
                            className="absolute right-4 sm:right-8 top-4 sm:top-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={20} className="sm:hidden" />
                            <X size={24} className="hidden sm:block" />
                          </button>
                          <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-10 text-center leading-tight">
                            {editingSubCategory.id ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي جديد'}
                          </h2>
                          <form onSubmit={editingSubCategory.id ? handleUpdateSubCategory : handleAddSubCategory} className="space-y-6 sm:space-y-8">
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">اسم القسم الفرعي</label>
                              <input
                                type="text"
                                value={editingSubCategory.name}
                                onChange={(e) => setEditingSubCategory({...editingSubCategory, name: e.target.value})}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                required
                              />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">الوصف</label>
                              <textarea
                                value={editingSubCategory.description}
                                onChange={(e) => setEditingSubCategory({...editingSubCategory, description: e.target.value})}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium h-24 sm:h-32 resize-none outline-none focus:border-primary/30 focus:bg-white transition-all"
                                placeholder="اكتب وصفاً مختصراً للقسم الفرعي..."
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">نمط عرض المحتوى</label>
                                <select
                                  value={editingSubCategory.displayStyle || 'style1'}
                                  onChange={(e) => setEditingSubCategory({...editingSubCategory, displayStyle: e.target.value})}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all appearance-none"
                                >
                                  <option value="style1">شبكة أيقونات (Logos)</option>
                                  <option value="style2">أغلفة عريضة (Banners)</option>
                                  <option value="style3">تطبيقات وألعاب (Apps)</option>
                                  <option value="style4">مشغل صوتيات (Audio)</option>
                                  <option value="style5">نسخ نصوص (Prompts)</option>
                                  <option value="style6">قائمة صوتيات متقدمة</option>
                                  <option value="style8">نمط الفيديو (Video)</option>
                                  <option value="style9">أدوات الذكاء الاصطناعي (AI)</option>
                                </select>
                              </div>
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">صيغة الملفات (مثلاً: XML)</label>
                                <input
                                  type="text"
                                  value={editingSubCategory.fileTypes || ''}
                                  onChange={(e) => setEditingSubCategory({...editingSubCategory, fileTypes: e.target.value})}
                                  className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                  placeholder="XML, PSD, APK..."
                                />
                              </div>
                            </div>
                            {/* حالة ظهور القسم الفرعي للزوار */}
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100 transition-all">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-black text-gray-900">حالة ظهور القسم الفرعي</span>
                                  {editingSubCategory.isHidden ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-100 text-red-600 flex items-center gap-1">
                                      <EyeOff size={11} /> مخفي عن الزوار
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                      <Eye size={11} /> معروض للزوار
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                  {editingSubCategory.isHidden ? 'القسم الفرعي مخفي حالياً ولن يظهر للزوار في واجهة الموقع' : 'القسم الفرعي ظاهر ونشط لجميع الزوار'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditingSubCategory({...editingSubCategory, isHidden: !editingSubCategory.isHidden})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative shrink-0",
                                  editingSubCategory.isHidden ? "bg-gray-300" : "bg-emerald-500"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xs",
                                  editingSubCategory.isHidden ? "right-5 sm:right-7" : "right-0.5 sm:right-1"
                                )} />
                              </button>
                            </div>

                            {/* تخصيص لون القسم الفرعي */}
                            <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-xs sm:text-sm font-black text-gray-900">تخصيص لون القسم الفرعي</span>
                                  <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
                                    {editingSubCategory.useCustomAccent ? 'استخدام لون مخصص يميز هذا القسم الفرعي' : 'استخدام لون الموقع الرئيسي الافتراضي'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubCategory({
                                    ...editingSubCategory,
                                    useCustomAccent: !editingSubCategory.useCustomAccent,
                                    accentColor: !editingSubCategory.useCustomAccent && !editingSubCategory.accentColor ? '#3B82F6' : editingSubCategory.accentColor
                                  })}
                                  className={cn(
                                    "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative shrink-0",
                                    editingSubCategory.useCustomAccent ? "bg-primary" : "bg-gray-300"
                                  )}
                                >
                                  <div className={cn(
                                    "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all shadow-xs",
                                    editingSubCategory.useCustomAccent ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                  )} />
                                </button>
                              </div>

                              {/* اختيار النمط: نفس لون الموقع أو لون مخصص */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingSubCategory({...editingSubCategory, useCustomAccent: false})}
                                  className={cn(
                                    "p-3 rounded-xl sm:rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2",
                                    !editingSubCategory.useCustomAccent
                                      ? "bg-white border-primary text-primary shadow-xs"
                                      : "bg-gray-100/70 border-transparent text-gray-500 hover:bg-white/60"
                                  )}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                                  <span>لون الموقع الرئيسي</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubCategory({
                                    ...editingSubCategory,
                                    useCustomAccent: true,
                                    accentColor: editingSubCategory.accentColor || '#3B82F6'
                                  })}
                                  className={cn(
                                    "p-3 rounded-xl sm:rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2",
                                    editingSubCategory.useCustomAccent
                                      ? "bg-white border-primary text-primary shadow-xs"
                                      : "bg-gray-100/70 border-transparent text-gray-500 hover:bg-white/60"
                                  )}
                                >
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: editingSubCategory.accentColor || '#3B82F6' }} 
                                  />
                                  <span>لون مخصص للقسم</span>
                                </button>
                              </div>

                              {editingSubCategory.useCustomAccent && (
                                <div className="space-y-3 pt-2 border-t border-gray-200/60">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 block">اختر اللون المخصص</label>
                                  
                                  {/* لوحة ألوان سريعة */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {[
                                      { name: 'أزرق', hex: '#2563EB' },
                                      { name: 'بنفسجي', hex: '#7C3AED' },
                                      { name: 'وردي', hex: '#EC4899' },
                                      { name: 'أحمر', hex: '#EF4444' },
                                      { name: 'برتقالي', hex: '#F97316' },
                                      { name: 'كهرماني', hex: '#F59E0B' },
                                      { name: 'أخضر زمردي', hex: '#10B981' },
                                      { name: 'فيروزي', hex: '#06B6D4' },
                                      { name: 'رمادي داكن', hex: '#374151' },
                                    ].map((palette) => (
                                      <button
                                        key={palette.hex}
                                        type="button"
                                        onClick={() => setEditingSubCategory({...editingSubCategory, accentColor: palette.hex})}
                                        className={cn(
                                          "w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all border-2 flex items-center justify-center",
                                          editingSubCategory.accentColor === palette.hex 
                                            ? "border-gray-900 scale-110 shadow-sm ring-2 ring-primary/30" 
                                            : "border-white hover:scale-105"
                                        )}
                                        style={{ backgroundColor: palette.hex }}
                                        title={palette.name}
                                      >
                                        {editingSubCategory.accentColor === palette.hex && (
                                          <Check size={12} className="text-white drop-shadow-xs" />
                                        )}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Color Picker و Hex input */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={editingSubCategory.accentColor || '#3B82F6'}
                                      onChange={(e) => setEditingSubCategory({...editingSubCategory, accentColor: e.target.value})}
                                      className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer rounded-xl border-2 border-gray-200 shadow-xs bg-white p-1"
                                    />
                                    <input
                                      type="text"
                                      value={editingSubCategory.accentColor || ''}
                                      onChange={(e) => setEditingSubCategory({...editingSubCategory, accentColor: e.target.value})}
                                      className="flex-1 bg-white border-2 border-gray-200 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold outline-none focus:border-primary transition-all uppercase"
                                      placeholder="#3B82F6"
                                    />
                                    <div 
                                      className="px-3 py-2 rounded-xl text-white font-bold text-xs shadow-xs shrink-0 flex items-center gap-1.5"
                                      style={{ backgroundColor: editingSubCategory.accentColor || '#3B82F6' }}
                                    >
                                      <span>معاينة اللون</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">زر مشاركة المحتوى (إظهار/إخفاء)</span>
                              <button
                                type="button"
                                onClick={() => setEditingSubCategory({...editingSubCategory, showShareButton: editingSubCategory.showShareButton === false ? true : false})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingSubCategory.showShareButton !== false ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingSubCategory.showShareButton !== false ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">وضع الصيانة</span>
                              <button
                                type="button"
                                onClick={() => setEditingSubCategory({...editingSubCategory, isUnderMaintenance: !editingSubCategory.isUnderMaintenance})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingSubCategory.isUnderMaintenance ? "bg-red-500" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingSubCategory.isUnderMaintenance ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="w-full bg-primary text-white py-4 sm:py-5 rounded-2xl sm:rounded-[28px] font-black text-base sm:text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                            >
                              {isSaving ? 'جاري الحفظ...' : 'حفظ القسم الفرعي'}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                    {editingItem && (
                      <div
                        key="edit-item-modal-wrapper"
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
                      >
                        <motion.div
                          key="edit-item-modal"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                        >
                          <button
                            onClick={() => setEditingItem(null)}
                            className="absolute right-4 sm:right-8 top-4 sm:top-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X size={20} className="sm:hidden" />
                            <X size={24} className="hidden sm:block" />
                          </button>
                          <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-10 text-center">
                            {editingItem.id ? 'تعديل المحتوى' : 'إضافة محتوى جديد'}
                          </h2>
                          <form onSubmit={editingItem.id ? handleUpdateItem : handleAddItem} className="space-y-6 sm:space-y-8">
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">عنوان المحتوى</label>
                              <input
                                type="text"
                                value={editingItem.title}
                                onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                required
                              />
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">ترتيب المنشور (رقم تسلسلي، 0 للأول)</label>
                              <input
                                type="number"
                                value={editingItem.order ?? ''}
                                onChange={(e) => setEditingItem({...editingItem, order: e.target.value === '' ? '' : parseInt(e.target.value)})}
                                placeholder="0, 1, 2..."
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                              />
                            </div>
                            {/* Conditional Rendering Based on Style */}
                            <div className="space-y-6">
                              {/* Common Description - For most styles except prompt maybe? or let it be */}
                              {currentParentStyle !== 'style5' && (
                                <div className="space-y-2 sm:space-y-3">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">
                                    {currentParentStyle === 'style4' || currentParentStyle === 'style6' ? 'اسم الفنان / الوصف' : 'الوصف'}
                                  </label>
                                  <textarea
                                    value={editingItem.description}
                                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium h-24 resize-none outline-none focus:border-primary/30 focus:bg-white transition-all"
                                  />
                                </div>
                              )}
                              {/* Image URL - For most except some? */}
                              {currentParentStyle !== 'style4' && currentParentStyle !== 'style6' && (
                                <div className="space-y-2 sm:space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">
                                      رابط الصورة {currentParentStyle === 'style3' ? '(أيقونة التطبيق)' : ''}
                                    </label>
                                    {resolvingPinterestField === 'imageUrl' && (
                                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        جاري تحويل رابط بينترست لمباشر...
                                      </span>
                                    )}
                                    {editingItem.imageUrl?.includes('i.pinimg.com') && (
                                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        رابط بينترست مباشر عالي الدقة
                                      </span>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <input
                                      type="url"
                                      value={editingItem.imageUrl || ''}
                                      placeholder="https://... (رابط صورة أو رابط Pinterest)"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingItem({...editingItem, imageUrl: val});
                                        if (isPinterestUrl(val) && !val.includes('i.pinimg.com')) {
                                          handlePinterestAutoConvert(val, 'imageUrl', (direct) => {
                                            setEditingItem((prev: any) => ({ ...prev, imageUrl: direct }));
                                          });
                                        }
                                      }}
                                      onPaste={(e) => {
                                        const pasted = e.clipboardData.getData('text');
                                        if (isPinterestUrl(pasted) && !pasted.includes('i.pinimg.com')) {
                                          setTimeout(() => {
                                            handlePinterestAutoConvert(pasted, 'imageUrl', (direct) => {
                                              setEditingItem((prev: any) => ({ ...prev, imageUrl: direct }));
                                            });
                                          }, 100);
                                        }
                                      }}
                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all dir-ltr text-left font-mono"
                                    />
                                    {isPinterestUrl(editingItem.imageUrl) && !editingItem.imageUrl?.includes('i.pinimg.com') && resolvingPinterestField !== 'imageUrl' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePinterestAutoConvert(editingItem.imageUrl, 'imageUrl', (direct) => {
                                            setEditingItem((prev: any) => ({ ...prev, imageUrl: direct }));
                                          })
                                        }
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow transition-all flex items-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3" />
                                        تحويل لمباشر
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* Download / Audio URL */}
                              {(currentParentStyle === 'style1' || currentParentStyle === 'style2' || currentParentStyle === 'style3' || currentParentStyle === 'style4' || currentParentStyle === 'style5' || currentParentStyle === 'style6') && (
                                <div className="space-y-4">
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">
                                        {currentParentStyle === 'style4' || currentParentStyle === 'style6' ? 'رابط الملف الصوتي (يدعم MediaFire / Firebase / Direct / Drive)' : currentParentStyle === 'style5' ? 'رابط الملف / التحميل (اختياري - يدعم MediaFire / Firebase)' : 'رابط التحميل المباشر (اللوجو 1)'}
                                      </label>
                                      {resolvingPinterestField === 'downloadUrl' && (
                                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                          تحويل الرابط...
                                        </span>
                                      )}
                                      {isMediaFireDirectUrl(editingItem.downloadUrl) && (
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          رابط ميديا فاير مباشر
                                        </span>
                                      )}
                                      {isFirebaseUrl(editingItem.downloadUrl) && editingItem.downloadUrl?.includes('alt=media') && (
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          رابط تحميل فايربيس مباشر
                                        </span>
                                      )}
                                    </div>
                                    <input
                                      type="url"
                                      value={editingItem.downloadUrl || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingItem({...editingItem, downloadUrl: val});
                                        handleUrlAutoConvert(val, 'downloadUrl', (direct) => {
                                          setEditingItem((prev: any) => ({ ...prev, downloadUrl: direct }));
                                        });
                                      }}
                                      onPaste={(e) => {
                                        const pasted = e.clipboardData.getData('text');
                                        setTimeout(() => {
                                          handleUrlAutoConvert(pasted, 'downloadUrl', (direct) => {
                                            setEditingItem((prev: any) => ({ ...prev, downloadUrl: direct }));
                                          });
                                        }, 100);
                                      }}
                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all dir-ltr text-left font-mono"
                                      placeholder="https://... (يدعم روابط MediaFire و Firebase Storage و Google Drive)"
                                    />
                                  </div>
                                  <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">
                                        رابط التحميل الثاني (اللوجو 2 / الملحق 2) - اختياري
                                      </label>
                                      {isMediaFireDirectUrl(editingItem.downloadUrl2) && (
                                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          رابط ميديا فاير مباشر
                                        </span>
                                      )}
                                      {isFirebaseUrl(editingItem.downloadUrl2) && editingItem.downloadUrl2?.includes('alt=media') && (
                                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          رابط تحميل فايربيس مباشر
                                        </span>
                                      )}
                                    </div>
                                    <input
                                      type="url"
                                      value={editingItem.downloadUrl2 || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingItem({...editingItem, downloadUrl2: val});
                                        handleUrlAutoConvert(val, 'downloadUrl2', (direct) => {
                                          setEditingItem((prev: any) => ({ ...prev, downloadUrl2: direct }));
                                        });
                                      }}
                                      onPaste={(e) => {
                                        const pasted = e.clipboardData.getData('text');
                                        setTimeout(() => {
                                          handleUrlAutoConvert(pasted, 'downloadUrl2', (direct) => {
                                            setEditingItem((prev: any) => ({ ...prev, downloadUrl2: direct }));
                                          });
                                        }, 100);
                                      }}
                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all dir-ltr text-left font-mono"
                                      placeholder="https://... (اختياري عند وجود ملفين أو لوجو ثاني)"
                                    />
                                  </div>
                                </div>
                              )}
                              {/* Source URL for AI Tools */}
                              {currentParentStyle === 'style9' && (
                                <div className="space-y-2 sm:space-y-3">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">رابط موقع الأداة</label>
                                  <input
                                    type="url"
                                    value={editingItem.sourceUrl || ''}
                                    onChange={(e) => setEditingItem({...editingItem, sourceUrl: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                    placeholder="https://..."
                                  />
                                </div>
                              )}
                              {/* Video URL for Style 8 */}
                              {currentParentStyle === 'style8' && (
                                <div className="space-y-2 sm:space-y-3">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">رابط فيديو اليوتيوب</label>
                                  <input
                                    type="url"
                                    value={editingItem.videoUrl || ''}
                                    onChange={(e) => setEditingItem({...editingItem, videoUrl: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                  />
                                </div>
                              )}
                              {/* Prompt for Style 5 */}
                              {currentParentStyle === 'style5' && (
                                <div className="space-y-4">
                                  <div className="space-y-2 sm:space-y-3">
                                    <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2 flex items-center justify-between">
                                      <span>نص البرومبت (Prompt)</span>
                                      <span className="text-[10px] text-primary font-normal">النص الإنجليزي أو العربي المطلوب نسخه</span>
                                    </label>
                                    <textarea
                                      value={editingItem.prompt || ''}
                                      onChange={(e) => setEditingItem({...editingItem, prompt: e.target.value})}
                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono h-32 resize-none outline-none focus:border-primary/30 focus:bg-white transition-all"
                                      placeholder="اكتب البرومبت هنا..."
                                      dir="ltr"
                                    />
                                  </div>

                                  {/* Details & Instructions for Prompt */}
                                  <div className="space-y-2 sm:space-y-3">
                                    <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-primary" />
                                        تفاصيل وتعليمات استخدام البرومبت
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-normal">إرشادات التوليد، الإعدادات، والخيارات</span>
                                    </label>
                                    <textarea
                                      value={editingItem.promptInstructions || ''}
                                      onChange={(e) => setEditingItem({...editingItem, promptInstructions: e.target.value})}
                                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium h-24 resize-none outline-none focus:border-primary/30 focus:bg-white transition-all text-right"
                                      placeholder="مثال: يفضل استخدام نسبة أبعاد --ar 16:9، ووضع جودة عالية. قم بتعديل الكلمات بين الأقواس لتناسب موضوعك..."
                                    />
                                  </div>

                                  {/* Used Applications */}
                                  <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                    <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-500" />
                                        التطبيقات والمنصات المستخدمة
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-normal">اختر التطبيقات أو أضف تطبيقاً مخصصاً</span>
                                    </label>
                                    
                                    {/* Quick Select Pills */}
                                    <div className="flex flex-wrap gap-1.5">
                                      {POPULAR_PROMPT_APPS.map(appName => {
                                        const isSelected = Array.isArray(editingItem.usedApps) && editingItem.usedApps.includes(appName);
                                        return (
                                          <button
                                            key={appName}
                                            type="button"
                                            onClick={() => {
                                              const current = Array.isArray(editingItem.usedApps) ? [...editingItem.usedApps] : [];
                                              if (current.includes(appName)) {
                                                setEditingItem({ ...editingItem, usedApps: current.filter(a => a !== appName) });
                                              } else {
                                                setEditingItem({ ...editingItem, usedApps: [...current, appName] });
                                              }
                                            }}
                                            className={cn(
                                              "text-xs px-3 py-1.5 rounded-xl font-bold transition-all border",
                                              isSelected 
                                                ? "bg-primary text-white border-primary shadow-sm" 
                                                : "bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-primary/5"
                                            )}
                                          >
                                            {isSelected && <Check className="w-3 h-3 inline-block ml-1" />}
                                            {appName}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Custom app input */}
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="text"
                                        value={customAppInput}
                                        onChange={(e) => setCustomAppInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (customAppInput.trim()) {
                                              const current = Array.isArray(editingItem.usedApps) ? [...editingItem.usedApps] : [];
                                              if (!current.includes(customAppInput.trim())) {
                                                setEditingItem({ ...editingItem, usedApps: [...current, customAppInput.trim()] });
                                              }
                                              setCustomAppInput('');
                                            }
                                          }
                                        }}
                                        placeholder="أو اكتب اسم تطبيق آخر واضغط إضافة..."
                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (customAppInput.trim()) {
                                            const current = Array.isArray(editingItem.usedApps) ? [...editingItem.usedApps] : [];
                                            if (!current.includes(customAppInput.trim())) {
                                              setEditingItem({ ...editingItem, usedApps: [...current, customAppInput.trim()] });
                                            }
                                            setCustomAppInput('');
                                          }
                                        }}
                                        className="bg-gray-900 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                                      >
                                        إضافة
                                      </button>
                                    </div>

                                    {/* Selected custom tags list if any not in popular list */}
                                    {(Array.isArray(editingItem.usedApps) ? editingItem.usedApps : []).filter((a: string) => !POPULAR_PROMPT_APPS.includes(a)).length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {(editingItem.usedApps || []).filter((a: string) => !POPULAR_PROMPT_APPS.includes(a)).map((customApp: string) => (
                                          <span
                                            key={customApp}
                                            className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1"
                                          >
                                            {customApp}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const current = Array.isArray(editingItem.usedApps) ? [...editingItem.usedApps] : [];
                                                setEditingItem({ ...editingItem, usedApps: current.filter(a => a !== customApp) });
                                              }}
                                              className="hover:text-red-500"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {/* App Store Style Fields (Style 3) */}
                              {currentParentStyle === 'style3' && (
                                <div className="bg-gray-50/50 p-6 rounded-3xl border-2 border-gray-100 space-y-6">
                                  <h3 className="text-sm font-black text-primary flex items-center gap-2">
                                    <Rocket size={16} />
                                    تفاصيل المتجر (App Store)
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 mr-2">التقييم (مثلاً: 4.8)</label>
                                      <input
                                        type="text"
                                        value={editingItem.rating || ''}
                                        onChange={(e) => setEditingItem({...editingItem, rating: e.target.value})}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                        placeholder="4.8"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 mr-2">عدد المراجعات</label>
                                      <input
                                        type="text"
                                        value={editingItem.reviewCount || ''}
                                        onChange={(e) => setEditingItem({...editingItem, reviewCount: e.target.value})}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                        placeholder="12 ألف مراجعة"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 mr-2">التصنيف العمري</label>
                                      <input
                                        type="text"
                                        value={editingItem.ageRating || ''}
                                        onChange={(e) => setEditingItem({...editingItem, ageRating: e.target.value})}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                        placeholder="+3"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 mr-2">حجم الملف</label>
                                      <input
                                        type="text"
                                        value={editingItem.size || ''}
                                        onChange={(e) => setEditingItem({...editingItem, size: e.target.value})}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                                        placeholder="15MB"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="text-[10px] font-bold text-gray-400 mr-2">لقطات الشاشة (رابط في كل سطر)</label>
                                      {resolvingPinterestField === 'screenshots' && (
                                        <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                          تحويل بينترست...
                                        </span>
                                      )}
                                    </div>
                                    <textarea
                                      value={(editingItem.screenshots || []).join('\n')}
                                      onChange={async (e) => {
                                        const lines = e.target.value.split('\n');
                                        setEditingItem({...editingItem, screenshots: lines.filter(s => s.trim() !== '')});
                                        const hasUnresolvedPin = lines.some(l => isPinterestUrl(l) && !l.includes('i.pinimg.com'));
                                        if (hasUnresolvedPin) {
                                          setResolvingPinterestField('screenshots');
                                          try {
                                            const resolved = await Promise.all(
                                              lines.map(async (l) => {
                                                if (isPinterestUrl(l) && !l.includes('i.pinimg.com')) {
                                                  return await resolvePinterestUrl(l);
                                                }
                                                return l;
                                              })
                                            );
                                            setEditingItem((prev: any) => ({
                                              ...prev,
                                              screenshots: resolved.filter(s => s.trim() !== '')
                                            }));
                                          } catch (err) {
                                            console.error("Failed to auto resolve screenshots:", err);
                                          } finally {
                                            setResolvingPinterestField(null);
                                          }
                                        }
                                      }}
                                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-medium h-24 resize-none outline-none font-mono dir-ltr text-left"
                                      placeholder="أدخل روابط الصور هنا (يدعم روابط Pinterest)..."
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Materials & Attachments Section (الخامات وملحقات التصميم) */}
                              <div className="bg-amber-50/40 border-2 border-amber-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                      <Layers size={18} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                                        تفعيل الخامات والملحقات
                                        {editingItem.hasMaterials && (
                                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                                            مُفعلة
                                          </span>
                                        )}
                                      </h4>
                                      <p className="text-[10px] text-gray-500">
                                        تفعيل أو تعطيل قسم تحميل الخامات لهذا المنشور تحديداً
                                      </p>
                                    </div>
                                  </div>

                                  {/* Toggle Switch */}
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem({
                                      ...editingItem,
                                      hasMaterials: !editingItem.hasMaterials
                                    })}
                                    className={cn(
                                      "w-11 h-6 rounded-full transition-all relative flex-shrink-0",
                                      editingItem.hasMaterials ? "bg-amber-500" : "bg-gray-300"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                                      editingItem.hasMaterials ? "right-6" : "right-1"
                                    )} />
                                  </button>
                                </div>

                                {editingItem.hasMaterials && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="pt-2 border-t border-amber-200/50 space-y-3"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-900 mr-1 flex items-center gap-1.5">
                                          <span>رابط تحميل الخامات</span>
                                          <span className="text-[10px] text-amber-700 font-normal">(MediaFire, Google Drive, Mega, Pinterest...)</span>
                                        </label>
                                        {resolvingPinterestField === 'materialsUrl' && (
                                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 animate-pulse">
                                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                            تحويل بينترست...
                                          </span>
                                        )}
                                      </div>
                                      <input
                                        type="url"
                                        value={editingItem.materialsUrl || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setEditingItem({...editingItem, materialsUrl: val});
                                          handleUrlAutoConvert(val, 'materialsUrl', (directUrl) => {
                                            setEditingItem((prev: any) => ({...prev, materialsUrl: directUrl}));
                                          });
                                        }}
                                        className="w-full bg-white border-2 border-amber-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-amber-400 transition-all font-mono"
                                        placeholder="https://..."
                                        dir="ltr"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-700 mr-1">نص زر الخامات</label>
                                        <input
                                          type="text"
                                          value={editingItem.materialsLabel || ''}
                                          onChange={(e) => setEditingItem({...editingItem, materialsLabel: e.target.value})}
                                          className="w-full bg-white border-2 border-amber-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-400"
                                          placeholder="مثال: تحميل ملف الخامات (ZIP)"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-700 mr-1">وصف أو تفاصيل الخامات</label>
                                        <input
                                          type="text"
                                          value={editingItem.materialsDescription || ''}
                                          onChange={(e) => setEditingItem({...editingItem, materialsDescription: e.target.value})}
                                          className="w-full bg-white border-2 border-amber-100 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-400"
                                          placeholder="مثال: صور بدقة 4K، ملحقات PNG بدون خلفية"
                                        />
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              {(currentParentStyle === 'style5') && (
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100">
                                  <span className="text-[10px] sm:text-xs font-bold">زر النسخ</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem({...editingItem, showCopyButton: editingItem.showCopyButton === false ? true : false})}
                                    className={cn(
                                      "w-8 h-5 sm:w-10 sm:h-6 rounded-full transition-all relative",
                                      editingItem.showCopyButton !== false ? "bg-primary" : "bg-gray-300"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all",
                                      editingItem.showCopyButton !== false ? "right-0.5 sm:right-1" : "right-3.5 sm:right-5"
                                    )} />
                                  </button>
                                </div>
                              )}
                              {(currentParentStyle === 'style1' || currentParentStyle === 'style2' || currentParentStyle === 'style3' || currentParentStyle === 'style4' || currentParentStyle === 'style5' || currentParentStyle === 'style6') && (
                                <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 group">
                                  <span className="text-[10px] sm:text-xs font-bold">زر التحميل</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingItem({...editingItem, showDownloadButton: editingItem.showDownloadButton === false ? true : false})}
                                    className={cn(
                                      "w-8 h-5 sm:w-10 sm:h-6 rounded-full transition-all relative",
                                      editingItem.showDownloadButton !== false ? "bg-primary" : "bg-gray-300"
                                    )}
                                  >
                                    <div className={cn(
                                      "absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all",
                                      editingItem.showDownloadButton !== false ? "right-0.5 sm:right-1" : "right-3.5 sm:right-5"
                                    )} />
                                  </button>
                                </div>
                              )}

                            </div>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="w-full bg-primary text-white py-4 sm:py-5 rounded-2xl sm:rounded-[28px] font-black text-base sm:text-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                            >
                              {isSaving ? 'جاري الحفظ...' : 'حفظ المحتوى'}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </main>
      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <div
            key="delete-confirm-modal"
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[28px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md shadow-2xl text-center relative overflow-hidden"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <AlertTriangle size={32} className="sm:hidden" />
                <AlertTriangle size={40} className="hidden sm:block" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black mb-2">تأكيد الحذف</h2>
              <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف <span className="font-bold text-red-500">&quot;{deleteConfirm.label}&quot;</span>؟
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  disabled={!canDelete || isSaving}
                  onClick={() => {
                    if (deleteConfirm.type === 'user') {
                      handleDeleteUser(deleteConfirm.id);
                    } else {
                      handleDelete(deleteConfirm.id);
                    }
                  }}
                  className={cn(
                    "w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all active:scale-95 flex items-center justify-center gap-3",
                    canDelete
                      ? "bg-red-500 text-white shadow-xl shadow-red-500/20 hover:opacity-90"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={18} className="sm:hidden" />
                      <Trash2 size={20} className="hidden sm:block" />
                      <span>{canDelete ? 'تأكيد الحذف النهائي' : `انتظر ${deleteCountdown} ثوانٍ...`}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="w-full py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all text-sm sm:text-base"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}