'use client';

import React, { useState, useMemo } from 'react';
import { useCollection, useAuth } from '@/hooks/useFirebase';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { CustomPage } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { PAGE_ICON_OPTIONS, getPageIcon } from '@/lib/pageIcons';
import {
  Plus, Search, ExternalLink, Edit3, Trash2,
  Eye, EyeOff, Check, Copy, AlertTriangle, X,
  Globe, ArrowUpDown, ChevronLeft, Link2, Sparkles,
  CheckCircle2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PagesManager() {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const { data: rawPages, loading: pagesLoading } = useCollection('pages');

  const getAuthHeaders = async () => {
    const token = await user?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  // Normalize list of custom pages
  const pages: CustomPage[] = useMemo(() => {
    return ((rawPages as any[]) || [])
      .map((p, idx) => ({
        id: p.id || `page-${idx}`,
        title: p.title || '',
        url: p.url || '',
        icon: p.icon || 'Globe',
        isActive: p.isActive !== false,
        order: typeof p.order === 'number' ? p.order : idx + 1,
        createdAt: p.createdAt || '',
        updatedAt: p.updatedAt || '',
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [rawPages]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'hidden'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomPage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formIcon, setFormIcon] = useState('Globe');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrder, setFormOrder] = useState(1);

  // Icon Picker State
  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('الكل');
  const [iconSearchQuery, setIconSearchQuery] = useState('');

  // Icon categories
  const iconCategories = useMemo(() => {
    const cats = Array.from(new Set(PAGE_ICON_OPTIONS.map((item) => item.category)));
    return ['الكل', ...cats];
  }, []);

  const filteredIcons = useMemo(() => {
    return PAGE_ICON_OPTIONS.filter((item) => {
      const matchCategory = iconCategoryFilter === 'الكل' || item.category === iconCategoryFilter;
      const matchSearch =
        !iconSearchQuery.trim() ||
        item.name.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(iconSearchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [iconCategoryFilter, iconSearchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingPage(null);
    setFormTitle('');
    setFormUrl('');
    setFormIcon('Globe');
    setFormIsActive(true);
    setFormOrder(pages.length + 1);
    setIconCategoryFilter('الكل');
    setIconSearchQuery('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (page: CustomPage) => {
    setEditingPage(page);
    setFormTitle(page.title);
    setFormUrl(page.url);
    setFormIcon(page.icon || 'Globe');
    setFormIsActive(page.isActive !== false);
    setFormOrder(page.order ?? 1);
    setIconCategoryFilter('الكل');
    setIconSearchQuery('');
    setIsModalOpen(true);
  };

  // Ensure URL protocol
  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Save changes to Firestore and API
  const persistPagesList = async (updatedList: CustomPage[]) => {
    const now = new Date().toISOString();
    try {
      // 1. Write to appConfig/customPages in Firestore
      const configRef = doc(db, 'appConfig', 'customPages');
      await setDoc(configRef, {
        pages: updatedList,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Direct firestore write fallback, using api:', err);
    }
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      toast({
        title: 'اسم الصفحة مطلوب',
        description: 'يرجى كتابة اسم مناسب للصفحة يظهر في القائمة الجانبية.',
        variant: 'destructive',
      });
      return;
    }

    if (!formUrl.trim()) {
      toast({
        title: 'الرابط الخارجي مطلوب',
        description: 'يرجى إدخال الرابط الخارجي الذي سيتم التوجه إليه عند النقر.',
        variant: 'destructive',
      });
      return;
    }

    const finalUrl = normalizeUrl(formUrl);
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      let updatedPages: CustomPage[] = [];

      if (editingPage) {
        // Update existing page
        const updatedPage: CustomPage = {
          ...editingPage,
          title: formTitle.trim(),
          url: finalUrl,
          icon: formIcon,
          isActive: formIsActive,
          order: Number(formOrder) || editingPage.order || 1,
          updatedAt: now,
        };

        updatedPages = pages.map((p) => (p.id === editingPage.id ? updatedPage : p));

        // Call API
        await fetch('/api/pages', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify(updatedPage),
        }).catch(() => {});

        toast({
          title: 'تم حفظ التعديلات بنجاح',
          description: `تم تحديث بيانات الصفحة "${updatedPage.title}".`,
        });
      } else {
        // Create new page
        const newId = `page-${Date.now()}`;
        const newPage: CustomPage = {
          id: newId,
          title: formTitle.trim(),
          url: finalUrl,
          icon: formIcon,
          isActive: formIsActive,
          order: Number(formOrder) || pages.length + 1,
          createdAt: now,
          updatedAt: now,
        };

        updatedPages = [...pages, newPage];

        // Call API
        await fetch('/api/pages', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify(newPage),
        }).catch(() => {});

        toast({
          title: 'تمت إضافة الصفحة بنجاح',
          description: `الصفحة "${newPage.title}" أصبحت جاهزة وستظهر بالقائمة الجانبية.`,
        });
      }

      // Persist list to firestore
      await persistPagesList(updatedPages);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast({
        title: 'خطأ في الحفظ',
        description: error?.message || 'تعذر حفظ بيانات الصفحة، يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Page Visibility (إخفاء أو إظهار)
  const handleToggleVisibility = async (page: CustomPage) => {
    const nextState = !page.isActive;
    const updated = pages.map((p) =>
      p.id === page.id ? { ...p, isActive: nextState, updatedAt: new Date().toISOString() } : p
    );

    try {
      await persistPagesList(updated);
      await fetch('/api/pages', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ...page, isActive: nextState }),
      }).catch(() => {});

      toast({
        title: nextState ? 'تم إظهار الصفحة' : 'تم إخفاء الصفحة',
        description: nextState
          ? `ستظهر صفحة "${page.title}" الآن للمستخدمين في القائمة الجانبية.`
          : `تم إخفاء صفحة "${page.title}" من القائمة الجانبية بنجاح.`,
      });
    } catch (err) {
      toast({
        title: 'تعذر تغيير الحالة',
        description: 'حدث خطأ أثناء تحديث حالة الصفحة.',
        variant: 'destructive',
      });
    }
  };

  // Delete Page (حذف الصفحة)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);

    try {
      const updated = pages.filter((p) => p.id !== deleteTarget.id);
      await persistPagesList(updated);

      // Call API delete
      await fetch(`/api/pages/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      }).catch(() => {});

      toast({
        title: 'تم حذف الصفحة',
        description: `تم إزالة صفحة "${deleteTarget.title}" نهائياً من القائمة الجانبية.`,
      });
      setDeleteTarget(null);
    } catch (err: any) {
      toast({
        title: 'خطأ في الحذف',
        description: err?.message || 'تعذر حذف الصفحة، حاول مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy Link Helper
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: 'تم نسخ الرابط',
      description: 'تم نسخ الرابط الخارجي إلى الحافظة بنجاح.',
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered pages list for display
  const displayedPages = useMemo(() => {
    return pages.filter((p) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.url.toLowerCase().includes(searchQuery.toLowerCase());

      // Status
      if (!matchesSearch) return false;
      if (filterStatus === 'active') return p.isActive !== false;
      if (filterStatus === 'hidden') return p.isActive === false;
      return true;
    });
  }, [pages, searchQuery, filterStatus]);

  const activeCount = pages.filter((p) => p.isActive !== false).length;
  const hiddenCount = pages.length - activeCount;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner & Action Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Globe size={14} />
              <span>نظام الروابط والصفحات الخارجية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              إدارة صفحات وروابط القائمة الجانبية
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              قم بإضافة وتعديل روابطك الخارجية (موقعك، قنواتك، الشروط، الدعم) لتظهر مباشرة في القائمة الجانبية للمستخدمين مع إمكانية إخفائها أو حذفها في أي وقت.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              id="btn-add-new-page"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-md hover:shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              <Plus size={18} />
              <span>إضافة صفحة جديدة</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 mb-1">إجمالي الصفحات</div>
              <div className="text-2xl font-black text-gray-800">{pages.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-600 shadow-xs">
              <Link2 size={20} />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 flex items-center justify-between border border-emerald-100/50">
            <div>
              <div className="text-xs font-bold text-emerald-600 mb-1">معروضة بالقائمة</div>
              <div className="text-2xl font-black text-emerald-700">{activeCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Eye size={20} />
            </div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-4 flex items-center justify-between border border-amber-100/50">
            <div>
              <div className="text-xs font-bold text-amber-600 mb-1">مخفية مؤقتاً</div>
              <div className="text-2xl font-black text-amber-700">{hiddenCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <EyeOff size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث باسم الصفحة أو الرابط..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all text-right"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              مسح
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/70 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filterStatus === 'all'
                ? "bg-white text-gray-800 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            الكل ({pages.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filterStatus === 'active'
                ? "bg-white text-emerald-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            معروضة ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('hidden')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              filterStatus === 'hidden'
                ? "bg-white text-amber-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            مخفية ({hiddenCount})
          </button>
        </div>
      </div>

      {/* Pages List */}
      {pagesLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">جاري تحميل الصفحات والروابط...</p>
        </div>
      ) : displayedPages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <Globe size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لم تقم بإضافة أي صفحات بعد'}
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
            {searchQuery
              ? 'جرّب البحث بكلمة أخرى أو قم بإلغاء الفلتر الحالي.'
              : 'أضف صفحتك الخارجية الأولى، وحدد اسمها ورابطها وأيقونتها لتظهر للمستخدمين مباشرة في القائمة الجانبية.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-md"
          >
            <Plus size={18} />
            <span>إضافة صفحة الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {displayedPages.map((page, index) => {
              const IconComponent = getPageIcon(page.icon);
              const isPageActive = page.isActive !== false;

              return (
                <motion.div
                  key={page.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={cn(
                    "bg-white rounded-2xl p-5 border transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between group",
                    isPageActive ? "border-gray-100" : "border-amber-200/80 bg-amber-50/20"
                  )}
                >
                  {/* Card Header: Icon, Title, Status */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-xs",
                            isPageActive
                              ? "bg-primary/10 text-primary"
                              : "bg-gray-100 text-gray-400"
                          )}
                        >
                          <IconComponent size={24} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-black text-gray-900 truncate">
                            {page.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                                isPageActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
                              )}
                            >
                              {isPageActive ? (
                                <>
                                  <Eye size={11} />
                                  <span>معروضة في القائمة</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff size={11} />
                                  <span>مخفية مؤقتاً</span>
                                </>
                              )}
                            </span>

                            {typeof page.order === 'number' && (
                              <span className="text-[11px] font-medium text-gray-400">
                                ترتيب: #{page.order}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Toggle Visibility Button */}
                      <button
                        onClick={() => handleToggleVisibility(page)}
                        title={isPageActive ? "إخفاء من القائمة الجانبية" : "إظهار في القائمة الجانبية"}
                        className={cn(
                          "p-2 rounded-xl transition-all",
                          isPageActive
                            ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                            : "text-gray-400 bg-gray-100 hover:text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {isPageActive ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>

                    {/* External Link display box */}
                    <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2" dir="ltr">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Link2 size={15} className="text-gray-400 shrink-0" />
                        <span className="text-xs font-medium text-gray-600 truncate select-all">
                          {page.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyLink(page.url, page.id)}
                          title="نسخ الرابط"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-all"
                        >
                          {copiedId === page.id ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="زيارة الرابط الخارجي"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-all"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400 font-medium">
                      أيقونة: <span className="font-bold text-gray-600">{page.icon || 'Globe'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(page)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-primary hover:text-white transition-all"
                      >
                        <Edit3 size={13} />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => setDeleteTarget(page)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-all"
                      >
                        <Trash2 size={13} />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Live Sidebar Preview Drawer / Box */}
      {pages.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-base font-black text-gray-900">
                معاينة مباشرة: كيف تظهر في القائمة الجانبية للمستخدمين
              </h3>
            </div>
            <span className="text-xs text-gray-400">
              الصفحات المفعلة تظهر فوراً ({activeCount})
            </span>
          </div>

          <div className="max-w-md mx-auto bg-gray-50/80 rounded-2xl p-4 border border-gray-200/60">
            <div className="space-y-1.5">
              {pages.filter((p) => p.isActive !== false).length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                  جميع الصفحات مخفية حالياً، قم بتفعيل إحداها لتظهر هنا.
                </div>
              ) : (
                pages
                  .filter((p) => p.isActive !== false)
                  .map((page) => {
                    const PreviewIcon = getPageIcon(page.icon);
                    return (
                      <div
                        key={page.id}
                        className="flex items-center justify-between py-2.5 px-3.5 bg-white rounded-xl border border-gray-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <PreviewIcon size={16} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 truncate">
                            {page.title}
                          </span>
                        </div>
                        <ChevronLeft size={16} className="text-gray-300" />
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 my-8 text-right"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    {editingPage ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">
                      {editingPage ? 'تعديل الصفحة الخارجية' : 'إضافة صفحة خارجية جديدة'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      حدد اسم الصفحة والرابط الخارجي والأيقونة التي ستظهر في القائمة الجانبية.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* 1. اسم الصفحة */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700">
                    اسم الصفحة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: موقعنا الرسمي، سياسة الخصوصية، قناة التيليجرام..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:bg-white transition-all text-right"
                  />
                  <p className="text-[11px] text-gray-400">
                    هذا الاسم هو الذي سيظهر للمستخدمين مباشرة في القائمة الجانبية.
                  </p>
                </div>

                {/* 2. الرابط الخارجي */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700">
                      الرابط الخارجي للصفحة <span className="text-rose-500">*</span>
                    </label>
                    {formUrl && (
                      <a
                        href={normalizeUrl(formUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                      >
                        <ExternalLink size={12} />
                        <span>تجربة وفتح الرابط</span>
                      </a>
                    )}
                  </div>
                  <div className="relative" dir="ltr">
                    <Link2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="https://example.com/page"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary focus:bg-white transition-all text-left"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    عند ضغط المستخدم على الصفحة في القائمة سيتم فتح هذا الرابط مباشرة في نافذة خارجية.
                  </p>
                </div>

                {/* 3. اختيار الأيقونة */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700">
                      أيقونة الصفحة
                    </label>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <span>الأيقونة المحددة:</span>
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        {React.createElement(getPageIcon(formIcon), { size: 16 })}
                      </div>
                    </div>
                  </div>

                  {/* Icon filter bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="ابحث عن أيقونة بالاسم..."
                        value={iconSearchQuery}
                        onChange={(e) => setIconSearchQuery(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                      {iconCategories.map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setIconCategoryFilter(cat)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all",
                            iconCategoryFilter === cat
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icons Grid */}
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50/50">
                    {filteredIcons.map((opt) => {
                      const IconComp = opt.icon;
                      const isSelected = formIcon === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormIcon(opt.id)}
                          title={opt.name}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group",
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs scale-105"
                              : "bg-white text-gray-600 border-gray-200/70 hover:border-primary/50 hover:text-primary"
                          )}
                        >
                          <IconComp size={20} />
                          <span
                            className={cn(
                              "text-[9px] mt-1 truncate max-w-full",
                              isSelected ? "text-white font-bold" : "text-gray-400 group-hover:text-primary"
                            )}
                          >
                            {opt.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. خيارات إضافية: الإظهار والترتيب */}
                <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Visibility Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <div className="text-xs font-bold text-gray-800">حالة الظهور</div>
                      <div className="text-[11px] text-gray-400">إظهار في القائمة الجانبية</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none",
                        formIsActive ? "bg-emerald-500" : "bg-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-xs",
                          formIsActive ? "left-1" : "right-1"
                        )}
                      />
                    </button>
                  </div>

                  {/* Order Input */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <div className="text-xs font-bold text-gray-800">ترتيب الظهور</div>
                      <div className="text-[11px] text-gray-400">الرقم الأصغر يظهر أولاً</div>
                    </div>

                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={formOrder}
                      onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                      className="w-16 px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-center text-xs font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>{editingPage ? 'حفظ التعديلات' : 'إضافة الصفحة'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 text-right shadow-2xl border border-gray-100 space-y-4"
              dir="rtl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle size={26} />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-base font-black text-gray-900">
                  هل أنت متأكد من حذف هذه الصفحة؟
                </h3>
                <p className="text-xs text-gray-500">
                  سيتم حذف صفحة <span className="font-bold text-gray-800">«{deleteTarget.title}»</span> ورابطها نهائياً ولن تظهر في القائمة الجانبية بعد الآن.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 text-center font-mono truncate" dir="ltr">
                {deleteTarget.url}
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف الصفحة'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
