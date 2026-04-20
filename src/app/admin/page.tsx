'use client';

import { useState, useEffect } from 'react';
import { useAuth, useCollection, useDoc, handleFirestoreError, OperationType } from '@/hooks/useFirebase';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { cn } from '@/lib/utils';
import { Shield, Globe, Database, AlertTriangle, CheckCircle, Copy, LogIn, Plus, FolderPlus, FilePlus, List, ChevronDown, Trash2, Palette, BellRing, Send, Lock, Download, Edit3, ChevronRight, X, Settings, UserPlus, MessageSquare, MessageCircle, User, ShieldCheck, Bell, MousePointer2, Hammer, Ticket, Zap, Home, Users, ArrowUp, ArrowDown, Info, Heart, Star, Target, Rocket, Award, Instagram, Twitter, Github, MapPin, Clock, Phone, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc } from 'firebase/firestore';

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

export default function AdminPage() {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAdmin, isEditor, loading, loginWithGoogle, logout } = useAuth();
  const [currentDomain, setCurrentDomain] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'users' | 'content' | 'colors' | 'notifications' | 'dialog' | 'floatingButton' | 'about' | 'contact'>('menu');
  const [viewLevel, setViewLevel] = useState<'categories' | 'subcategories' | 'items'>('categories');
  const router = useRouter();

  // User Management State
  const { data: whitelistData } = useCollection('whitelist');
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
  const [useGradient, setUseGradient] = useState(false);
  const [gradientStart, setGradientStart] = useState('#3B82F6');
  const [gradientEnd, setGradientEnd] = useState('#8B5CF6');
  const [darkGradientStart, setDarkGradientStart] = useState('#3B82F6');
  const [darkGradientEnd, setDarkGradientEnd] = useState('#8B5CF6');
  const [bottomNavColor, setBottomNavColor] = useState('#ffffff');
  const [darkBottomNavColor, setDarkBottomNavColor] = useState('#020617');
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    if (theme?.primaryColor) setPrimaryColor(theme.primaryColor);
    if (theme?.darkPrimaryColor) setDarkPrimaryColor(theme.darkPrimaryColor);
    if (theme?.backgroundColor) setBackgroundColor(theme.backgroundColor);
    if (theme?.darkBackgroundColor) setDarkBackgroundColor(theme.darkBackgroundColor);
    if (theme?.cardColor) setCardColor(theme.cardColor);
    if (theme?.darkCardColor) setDarkCardColor(theme.darkCardColor);
    if (theme?.themeMode) setThemeMode(theme.themeMode);
    if (theme?.useGradient !== undefined) setUseGradient(theme.useGradient);
    if (theme?.gradientStart) setGradientStart(theme.gradientStart);
    if (theme?.gradientEnd) setGradientEnd(theme.gradientEnd);
    if (theme?.darkGradientStart) setDarkGradientStart(theme.darkGradientStart);
    if (theme?.darkGradientEnd) setDarkGradientEnd(theme.darkGradientEnd);
    if (theme?.bottomNavColor) setBottomNavColor(theme.bottomNavColor);
    if (theme?.darkBottomNavColor) setDarkBottomNavColor(theme.darkBottomNavColor);
    if (theme?.customCss !== undefined) setCustomCss(theme.customCss);
  }, [theme]);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifLink, setNotifLink] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<{type: 'category' | 'subcategory', id: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSetViewLevel = (level: 'categories' | 'subcategories' | 'items') => {
    setViewLevel(level);
    setSearchQuery('');
  };

  const handleSetSelectedManager = (idObj: {type: 'category' | 'subcategory', id: string} | null) => {
    setSelectedManagerId(idObj);
    setSearchQuery('');
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

  // Dynamic Contacts State
  const { data: contactsData } = useCollection('contacts');
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
      setAboutTitle(aboutConfig.title || '');
      setAboutSubtitle(aboutConfig.subtitle || '');
      setAboutDescription(aboutConfig.description || '');
      setAboutVision(aboutConfig.vision || '');
      setAboutHeroImage(aboutConfig.heroImage || '');
      setAboutFeatures(aboutConfig.features || []);
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

  const { data: allCategoriesData } = useCollection('categories');
  const { data: notifications } = useCollection('notifications');
  
  // Items fetching based on selection
  const itemsPath = selectedManagerId?.id ? `categories/${selectedManagerId.id}/items` : null;
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
        subtitle: aboutSubtitle,
        description: aboutDescription,
        vision: aboutVision,
        heroImage: aboutHeroImage,
        features: aboutFeatures,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "تم النجاح", description: "تم تحديث صفحة حول التطبيق بنجاح!" });
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
        accentColor: editingCategory.accentColor || '',
        useCustomAccent: editingCategory.useCustomAccent || false,
        order: categories.length,
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
        accentColor: editingSubCategory.accentColor || '',
        useCustomAccent: editingSubCategory.useCustomAccent || false,
        order: subCategories.filter(s => s.parentId === editingSubCategory.categoryId).length,
        updatedAt: new Date().toISOString()
      });
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
      await addDoc(collection(db, 'categories', editingItem.subCategoryId, 'items'), {
        title: editingItem.title,
        description: editingItem.description || '',
        downloadUrl: editingItem.downloadUrl || '',
        videoUrl: editingItem.videoUrl || '',
        imageUrl: editingItem.imageUrl || editingItem.downloadUrl || '',
        style: editingItem.style || '',
        rating: editingItem.rating || '',
        reviewCount: editingItem.reviewCount || '',
        ageRating: editingItem.ageRating || '',
        size: editingItem.size || '',
        screenshots: editingItem.screenshots || [],
        prompt: editingItem.prompt || '',
        showCopyButton: editingItem.showCopyButton !== false,
        showDownloadButton: editingItem.showDownloadButton !== false,
        order: items.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setEditingItem(null);
      toast({ title: "تم النجاح", description: "تم إضافة المحتوى بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${editingItem.subCategoryId}/items`);
    } finally {
      setIsSaving(false);
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

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'categories', editingItem.subCategoryId, 'items', editingItem.id), {
        title: editingItem.title,
        description: editingItem.description || '',
        downloadUrl: editingItem.downloadUrl || '',
        videoUrl: editingItem.videoUrl || '',
        imageUrl: editingItem.imageUrl || '',
        style: editingItem.style || '',
        rating: editingItem.rating || '',
        reviewCount: editingItem.reviewCount || '',
        ageRating: editingItem.ageRating || '',
        size: editingItem.size || '',
        screenshots: editingItem.screenshots || [],
        prompt: editingItem.prompt || '',
        showCopyButton: editingItem.showCopyButton !== false,
        showDownloadButton: editingItem.showDownloadButton !== false,
        updatedAt: new Date().toISOString()
      });
      setEditingItem(null);
      toast({ title: "تم النجاح", description: "تم تحديث المحتوى بنجاح!" });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${editingItem.subCategoryId}/items`);
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
        useGradient,
        gradientStart,
        gradientEnd,
        darkGradientStart,
        darkGradientEnd,
        bottomNavColor,
        darkBottomNavColor,
        customCss,
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
      case 'colors': return 'المظهر والألوان';
      case 'notifications': return 'الإشعارات';
      case 'dialog': return 'النافذة المنبثقة';
      case 'floatingButton': return 'الزر العائم';
      case 'about': return 'من نحن';
      case 'contact': return 'تواصل معنا';
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
        {!isAdmin && user ? (
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
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-10">
              <div className="flex items-center gap-3">
                <Settings className="text-primary w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                  <span className="block sm:inline">لوحة تحكم المدير</span>
                  <span className="hidden sm:inline"> | </span>
                  <span className="block sm:inline text-primary/70 sm:text-inherit">الملكية</span>
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

                  <div className="space-y-10">
                    {[
                      {
                        title: 'إدارة المحتوى والمستخدمين',
                        items: [
                          { id: 'content', label: 'المحتوى والأقسام', icon: Home, desc: 'إدارة الأقسام والمنشورات' },
                          { id: 'users', label: 'المستخدمين', icon: Users, desc: 'إدارة صلاحيات الوصول' },
                        ]
                      },
                      {
                        title: 'المظهر والهوية',
                        items: [
                          { id: 'colors', label: 'ألوان الموقع', icon: Palette, desc: 'تخصيص ألوان الواجهة' },
                        ]
                      },
                      {
                        title: 'التفاعل والتواصل',
                        items: [
                          { id: 'notifications', label: 'الإشعارات', icon: BellRing, desc: 'إرسال تنبيهات للمستخدمين' },
                          { id: 'dialog', label: 'النافذة المنبثقة', icon: MessageSquare, desc: 'إعداد ديالوج الاشتراك' },
                          { id: 'floatingButton', label: 'الزر العائم', icon: MousePointer2, desc: 'زر الوصول السريع' },
                        ]
                      },
                      {
                        title: 'صفحات الموقع',
                        items: [
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

                      <div className="p-6 bg-muted rounded-2xl border border-border">
                        <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-4">كود CSS مخصص</label>
                        <textarea 
                          value={customCss} 
                          onChange={(e) => setCustomCss(e.target.value)} 
                          className="w-full bg-card border border-border rounded-xl px-4 py-4 text-sm font-mono font-bold h-48 resize-none focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                          placeholder="/* اكتب كود CSS هنا... */&#10;.my-class {&#10;  color: red;&#10;}"
                          dir="ltr"
                        />
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
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Info size={20} />
                      </div>
                      <h2 className="text-xl font-bold">إعدادات صفحة حول التطبيق</h2>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">العنوان الرئيسي</label>
                          <input 
                            type="text" 
                            value={aboutTitle}
                            onChange={(e) => setAboutTitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">العنوان الفرعي</label>
                          <input 
                            type="text" 
                            value={aboutSubtitle}
                            onChange={(e) => setAboutSubtitle(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الوصف</label>
                        <textarea 
                          value={aboutDescription}
                          onChange={(e) => setAboutDescription(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">الرؤية</label>
                        <textarea 
                          value={aboutVision}
                          onChange={(e) => setAboutVision(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium h-32 resize-none outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">رابط الصورة الرئيسية</label>
                        <input 
                          type="text" 
                          value={aboutHeroImage}
                          onChange={(e) => setAboutHeroImage(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block ml-2">المميزات</label>
                          <button 
                            onClick={() => setAboutFeatures([...aboutFeatures, { icon: 'Zap', title: '', desc: '' }])}
                            className="text-primary text-xs font-bold hover:underline"
                          >
                            + إضافة ميزة
                          </button>
                        </div>
                        <div className="space-y-4">
                          {aboutFeatures.map((feature, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4 relative">
                              <button 
                                onClick={() => setAboutFeatures(aboutFeatures.filter((_, i) => i !== idx))}
                                className="absolute top-2 left-2 text-red-500 p-1 hover:bg-red-50 rounded-lg"
                              >
                                <X size={16} />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                  type="text" 
                                  placeholder="العنوان"
                                  value={feature.title}
                                  onChange={(e) => {
                                    const newFeatures = [...aboutFeatures];
                                    newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                                    setAboutFeatures(newFeatures);
                                  }}
                                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                                />
                                <select 
                                  value={feature.icon}
                                  onChange={(e) => {
                                    const newFeatures = [...aboutFeatures];
                                    newFeatures[idx] = { ...newFeatures[idx], icon: e.target.value };
                                    setAboutFeatures(newFeatures);
                                  }}
                                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                                >
                                  <option value="Zap">صاعقة (Zap)</option>
                                  <option value="ShieldCheck">درع (Shield)</option>
                                  <option value="Heart">قلب (Heart)</option>
                                  <option value="Star">نجمة (Star)</option>
                                  <option value="Users">مستخدمين (Users)</option>
                                  <option value="Target">هدف (Target)</option>
                                  <option value="Rocket">صاروخ (Rocket)</option>
                                  <option value="Award">جائزة (Award)</option>
                                </select>
                              </div>
                              <input 
                                type="text" 
                                placeholder="الوصف"
                                value={feature.desc}
                                onChange={(e) => {
                                  const newFeatures = [...aboutFeatures];
                                  newFeatures[idx] = { ...newFeatures[idx], desc: e.target.value };
                                  setAboutFeatures(newFeatures);
                                }}
                                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-medium outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleUpdateAbout}
                        disabled={isSaving}
                        className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات صفحة حول التطبيق'}
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
                          onClick={() => setEditingCategory({ name: '', type: 'XML', displayStyle: 'style1' })}
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
                          <div className="bg-primary p-6 sm:p-8 text-white relative">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/20 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
                                {cat.displayStyle || 'style1'}
                              </span>
                              <div className="w-2 h-8 sm:h-10 bg-white/20 rounded-full" />
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
                            onClick={() => setEditingSubCategory({ name: '', categoryId: selectedManagerId?.id, description: '', displayStyle: 'style1', fileTypes: '' })}
                            className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-gray-50 transition-all active:scale-95"
                          >
                            <FolderPlus size={18} className="sm:hidden" />
                            <FolderPlus size={20} className="hidden sm:block" />
                            <span>إضافة قسم فرعي</span>
                          </button>

                          {!hasSubCategories && (
                            <button 
                              onClick={() => setEditingItem({ title: '', subCategoryId: selectedManagerId?.id, description: '', downloadUrl: '' })}
                              className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
                            >
                              <Plus size={18} className="sm:hidden" />
                              <Plus size={20} className="hidden sm:block" />
                              <span>إضافة محتوى</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-primary font-bold text-xs sm:text-sm mr-2 sm:mr-4 uppercase tracking-wider">
                          {hasSubCategories ? 'الأقسام الفرعية' : 'المحتوى المباشر'}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          {hasSubCategories ? (
                            relevantSubs
                              .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                              .map((sub, idx) => (
                              <div key={`sub-${sub.id}-${idx}`} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 group hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="p-2 sm:p-3 bg-gray-50 text-gray-400 rounded-xl sm:rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <List size={18} className="sm:hidden" />
                                    <List size={20} className="hidden sm:block" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-black text-base sm:text-lg">{sub.name}</span>
                                    <span className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{sub.displayStyle || 'style1'} • {sub.fileTypes || 'بدون صيغة'}</span>
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
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => initiateDelete(`categories/${sub.id}`, 'subcategory', sub.name)}
                                      className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                      <Trash2 size={18} className="sm:hidden" />
                                      <Trash2 size={20} className="hidden sm:block" />
                                    </button>
                                    <button 
                                      onClick={() => setEditingSubCategory({...sub, categoryId: sub.parentId})}
                                      className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
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
                            ))
                          ) : (
                            items.length > 0 ? (
                              items
                                .filter(item => 
                                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.description.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((item, idx) => (
                                <div key={`item-${item.id}-${idx}`} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
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
                                  <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                                    <button 
                                      onClick={() => setEditingItem(item)}
                                      className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                    >
                                      <Edit3 size={18} className="sm:hidden" />
                                      <Edit3 size={20} className="hidden sm:block" />
                                    </button>
                                    <button 
                                      onClick={() => initiateDelete(`categories/${selectedManagerId?.id}/items/${item.id}`, 'item', item.title)}
                                      className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                      <Trash2 size={18} className="sm:hidden" />
                                      <Trash2 size={20} className="hidden sm:block" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-gray-400 font-bold">لا يوجد محتوى أو أقسام فرعية بعد</p>
                              </div>
                            )
                          )}
                        </div>
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
                            onClick={() => setEditingItem({ title: '', subCategoryId: selectedManagerId?.id, description: '', downloadUrl: '' })}
                            className="flex items-center gap-2 px-6 sm:px-10 py-3 sm:py-4 bg-primary text-white rounded-xl sm:rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 w-full sm:w-auto"
                          >
                            <Plus size={18} className="sm:hidden" />
                            <Plus size={20} className="hidden sm:block" />
                            <span>إضافة محتوى</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {items
                          .filter(item => 
                            item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((item, idx) => (
                          <div key={`item-${item.id}-${idx}`} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
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
                            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                              <button 
                                onClick={() => setEditingItem(item)}
                                className="p-2 sm:p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                              >
                                <Edit3 size={18} className="sm:hidden" />
                                <Edit3 size={20} className="hidden sm:block" />
                              </button>
                              <button 
                                onClick={() => initiateDelete(`categories/${selectedManagerId?.id}/items/${item.id}`, 'item', item.title)}
                                className="p-2 sm:p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
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

                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">لون مخصص لهذا القسم</span>
                              <button 
                                type="button"
                                onClick={() => setEditingCategory({...editingCategory, useCustomAccent: !editingCategory.useCustomAccent})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingCategory.useCustomAccent ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingCategory.useCustomAccent ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>

                            {editingCategory.useCustomAccent && (
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">لون البراند المخصص (Hex)</label>
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <input 
                                    type="color" 
                                    value={editingCategory.accentColor || '#3B82F6'} 
                                    onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm" 
                                  />
                                  <input 
                                    type="text" 
                                    value={editingCategory.accentColor || ''} 
                                    onChange={(e) => setEditingCategory({...editingCategory, accentColor: e.target.value})} 
                                    className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all uppercase"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                            )}

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

                            <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[28px] border-2 border-gray-100">
                              <span className="text-xs sm:text-sm font-bold text-gray-900">لون مخصص لهذه الصفحة</span>
                              <button 
                                type="button"
                                onClick={() => setEditingSubCategory({...editingSubCategory, useCustomAccent: !editingSubCategory.useCustomAccent})}
                                className={cn(
                                  "w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-all relative",
                                  editingSubCategory.useCustomAccent ? "bg-primary" : "bg-gray-200"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 sm:top-1 w-6 h-6 bg-white rounded-full transition-all",
                                  editingSubCategory.useCustomAccent ? "right-0.5 sm:right-1" : "right-5 sm:right-7"
                                )} />
                              </button>
                            </div>

                            {editingSubCategory.useCustomAccent && (
                              <div className="space-y-2 sm:space-y-3">
                                <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">لون البراند المخصص (Hex)</label>
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <input 
                                    type="color" 
                                    value={editingSubCategory.accentColor || '#3B82F6'} 
                                    onChange={(e) => setEditingSubCategory({...editingSubCategory, accentColor: e.target.value})} 
                                    className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer rounded-lg sm:rounded-xl border-2 border-gray-100 shadow-sm" 
                                  />
                                  <input 
                                    type="text" 
                                    value={editingSubCategory.accentColor || ''} 
                                    onChange={(e) => setEditingSubCategory({...editingSubCategory, accentColor: e.target.value})} 
                                    className="flex-1 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all uppercase"
                                    placeholder="#000000"
                                  />
                                </div>
                              </div>
                            )}

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
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">رابط الصورة {currentParentStyle === 'style3' ? '(أيقونة التطبيق)' : ''}</label>
                                  <input 
                                    type="url" 
                                    value={editingItem.imageUrl || ''}
                                    onChange={(e) => setEditingItem({...editingItem, imageUrl: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold outline-none focus:border-primary/30 focus:bg-white transition-all"
                                  />
                                </div>
                              )}

                              {/* Download / Audio URL */}
                              {(currentParentStyle === 'style1' || currentParentStyle === 'style2' || currentParentStyle === 'style3' || currentParentStyle === 'style4' || currentParentStyle === 'style6') && (
                                <div className="space-y-2 sm:space-y-3">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">
                                    {currentParentStyle === 'style4' || currentParentStyle === 'style6' ? 'رابط الملف الصوتي' : 'رابط التحميل المباشر'}
                                  </label>
                                  <input 
                                    type="url" 
                                    value={editingItem.downloadUrl || ''}
                                    onChange={(e) => setEditingItem({...editingItem, downloadUrl: e.target.value})}
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
                                <div className="space-y-2 sm:space-y-3">
                                  <label className="text-xs sm:text-sm font-bold text-gray-900 mr-2">نص البرومبت (Prompt)</label>
                                  <textarea 
                                    value={editingItem.prompt || ''}
                                    onChange={(e) => setEditingItem({...editingItem, prompt: e.target.value})}
                                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-mono h-32 resize-none outline-none focus:border-primary/30 focus:bg-white transition-all"
                                    placeholder="اكتب البرومبت هنا..."
                                    dir="ltr"
                                  />
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
                                    <label className="text-[10px] font-bold text-gray-400 mr-2">لقطات الشاشة (رابط في كل سطر)</label>
                                    <textarea 
                                      value={(editingItem.screenshots || []).join('\n')}
                                      onChange={(e) => setEditingItem({...editingItem, screenshots: e.target.value.split('\n').filter(s => s.trim() !== '')})}
                                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-medium h-24 resize-none outline-none"
                                      placeholder="أدخل روابط الصور هنا..."
                                    />
                                  </div>
                                </div>
                              )}
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
                              {(currentParentStyle === 'style1' || currentParentStyle === 'style2' || currentParentStyle === 'style3' || currentParentStyle === 'style4' || currentParentStyle === 'style6') && (
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
