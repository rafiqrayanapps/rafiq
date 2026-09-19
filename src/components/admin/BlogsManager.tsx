'use client';

import { useState } from 'react';
import { useCollection, useAuth } from '@/hooks/useFirebase';
import { db } from '@/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Blog } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, Plus, RefreshCw, Globe, CheckCircle2, AlertCircle, 
  Trash2, Edit3, Power, ExternalLink, Loader2, Layers,
  Clock, Sparkles, Check, X, ShieldAlert, ArrowUpDown, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { normalizeBloggerUrl } from '@/lib/blogger';

export default function BlogsManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: blogs, loading: blogsLoading } = useCollection('blogs');

  const getAuthHeaders = async () => {
    const token = await user?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };
  
  // State for Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogName, setBlogName] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [blogEnabled, setBlogEnabled] = useState(true);
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    title?: string;
    description?: string;
    postCount?: number;
    error?: string;
    message?: string;
  } | null>(null);

  // Syncing state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingBlogId, setSyncingBlogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal state
  const [deleteBlogTarget, setDeleteBlogTarget] = useState<Blog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAssociatedPosts, setDeleteAssociatedPosts] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlogs = (blogs as Blog[] || []).filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return b.name?.toLowerCase().includes(q) || b.url?.toLowerCase().includes(q);
  });

  const totalPostsCount = (blogs as Blog[] || []).reduce((sum, b) => sum + (b.postCount || 0), 0);
  const activeBlogsCount = (blogs as Blog[] || []).filter((b) => b.enabled !== false).length;

  const openAddModal = () => {
    setEditingBlog(null);
    setBlogName('');
    setBlogUrl('');
    setBlogEnabled(true);
    setValidationResult(null);
    setIsModalOpen(true);
  };

  const openEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setBlogName(blog.name || '');
    setBlogUrl(blog.url || '');
    setBlogEnabled(blog.enabled !== false);
    setValidationResult(null);
    setIsModalOpen(true);
  };

  const handleValidateUrl = async () => {
    if (!blogUrl.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال رابط المدونة أولاً.', variant: 'destructive' });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/blogger/validate', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ url: blogUrl.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setValidationResult({
          success: true,
          title: data.title,
          description: data.description,
          postCount: data.postCount,
          message: data.message,
        });

        // Auto-fill blog name if empty
        if (!blogName.trim() && data.title) {
          setBlogName(data.title);
        }

        toast({
          title: '✅ تم التحقق بنجاح',
          description: `المدونة جاهزة للربط (${data.postCount || 0} مقال متاح).`,
        });
      } else {
        setValidationResult({
          success: false,
          error: data.error || 'رابط المدونة غير صالح.',
        });
        toast({
          title: 'خطأ في التحقق',
          description: data.error || 'تعذر الوصول إلى محتوى Blogger.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        error: 'تعذر الاتصال بالمدونة حاليًا. تأكد من اتصال الإنترنت.',
      });
      toast({
        title: 'خطأ',
        description: 'تعذر الاتصال بالمدونة حاليًا.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blogName.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال اسم المدونة.', variant: 'destructive' });
      return;
    }

    if (!blogUrl.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى إدخال رابط المدونة.', variant: 'destructive' });
      return;
    }

    const { baseUrl, feedUrl } = normalizeBloggerUrl(blogUrl.trim());

    // Duplicate check
    const existingBlogs = (blogs as Blog[]) || [];
    const isDuplicate = existingBlogs.some(
      (b) => b.id !== editingBlog?.id && normalizeBloggerUrl(b.url).baseUrl.toLowerCase() === baseUrl.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: 'مدونة مكررة',
        description: 'هذه المدونة مضافة بالفعل في النظام.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let savedBlogId = editingBlog?.id;

      if (editingBlog) {
        // Update existing blog
        await updateDoc(doc(db, 'blogs', editingBlog.id), {
          name: blogName.trim(),
          url: baseUrl,
          feedUrl,
          enabled: blogEnabled,
          updatedAt: new Date().toISOString(),
        });
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات المدونة بنجاح.' });
      } else {
        // Create new blog doc
        const newDocRef = await addDoc(collection(db, 'blogs'), {
          name: blogName.trim(),
          url: baseUrl,
          feedUrl,
          enabled: blogEnabled,
          postCount: validationResult?.postCount || 0,
          lastSync: null,
          lastStatus: 'success',
          lastError: '',
          description: validationResult?.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        savedBlogId = newDocRef.id;
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة المدونة بنجاح، جاري جلب المقالات...' });
      }

      setIsModalOpen(false);

      // Trigger instant background sync for the saved blog
      if (savedBlogId && blogEnabled) {
        handleSyncSingleBlog(savedBlogId, blogName.trim());
      }
    } catch (err: any) {
      console.error('Error saving blog:', err);
      toast({
        title: 'خطأ في الحفظ',
        description: err.message || 'حدث خطأ أثناء حفظ المدونة.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnabled = async (blog: Blog) => {
    try {
      const nextState = !blog.enabled;
      await updateDoc(doc(db, 'blogs', blog.id), {
        enabled: nextState,
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: nextState ? 'تم تفعيل المدونة' : 'تم تعطيل المدونة',
        description: nextState ? 'سيتم تضمين مقالات هذه المدونة في الموقع.' : 'تم إخفاء مقالات هذه المدونة مؤقتاً.',
      });
    } catch (err: any) {
      toast({ title: 'خطأ', description: 'فشل تغيير حالة المدونة.', variant: 'destructive' });
    }
  };

  const savePostsToFirestore = async (blogId: string, posts: any[]) => {
    if (!posts || posts.length === 0) {
      await updateDoc(doc(db, 'blogs', blogId), {
        postCount: 0,
        lastSync: new Date().toISOString(),
        lastStatus: 'success',
        lastError: '',
      });
      return;
    }

    const chunkSize = 400;
    for (let i = 0; i < posts.length; i += chunkSize) {
      const chunk = posts.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      for (const post of chunk) {
        const postRef = doc(db, 'posts', post.id);
        batch.set(postRef, {
          ...post,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
      await batch.commit();
    }

    await updateDoc(doc(db, 'blogs', blogId), {
      postCount: posts.length,
      lastSync: new Date().toISOString(),
      lastStatus: 'success',
      lastError: '',
    });
  };

  const handleSyncSingleBlog = async (blogId: string, blogName: string) => {
    setSyncingBlogId(blogId);
    try {
      const currentBlog = (blogs as Blog[] || []).find((b) => b.id === blogId);
      const res = await fetch('/api/blogger/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ 
          blogId,
          feedUrl: currentBlog?.feedUrl || currentBlog?.url,
          url: currentBlog?.url,
          blogName: currentBlog?.name || blogName,
        }),
      });

      const data = await res.json();
      if (data.success && data.results?.[0]?.status === 'success') {
        const result = data.results[0];
        const posts = result.posts || data.posts || [];
        
        await savePostsToFirestore(blogId, posts);

        toast({
          title: '✅ اكتملت المزامنة',
          description: `تم تحديث وجلب ${posts.length} مقال من ${blogName} بنجاح!`,
        });
      } else {
        const errMsg = data.results?.[0]?.error || data.error || 'تعذر الاتصال بالمدونة حاليًا.';
        try {
          await updateDoc(doc(db, 'blogs', blogId), {
            lastSync: new Date().toISOString(),
            lastStatus: 'error',
            lastError: errMsg,
          });
        } catch {
          // ignore
        }
        toast({
          title: 'خطأ في التحديث',
          description: errMsg,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم لمزامنة المدونة.',
        variant: 'destructive',
      });
    } finally {
      setSyncingBlogId(null);
    }
  };

  const handleSyncAllBlogs = async () => {
    setIsSyncingAll(true);
    try {
      const res = await fetch('/api/blogger/sync', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ forceAll: false }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        let totalSaved = 0;
        let successfulBlogs = 0;

        for (const blogResult of data.results) {
          if (blogResult.status === 'success' && blogResult.posts) {
            await savePostsToFirestore(blogResult.blogId, blogResult.posts);
            totalSaved += blogResult.posts.length;
            successfulBlogs += 1;
          } else if (blogResult.status === 'error') {
            try {
              await updateDoc(doc(db, 'blogs', blogResult.blogId), {
                lastSync: new Date().toISOString(),
                lastStatus: 'error',
                lastError: blogResult.error || 'فشل جلب المقالات',
              });
            } catch {
              // ignore
            }
          }
        }

        toast({
          title: '🎉 اكتمل تحديث جميع المدونات',
          description: `تم جلب وتحديث ${totalSaved} مقال من ${successfulBlogs} مدونة بنجاح!`,
        });
      } else {
        toast({
          title: 'تنبيه أثناء التحديث',
          description: data.error || 'حدث خطأ أثناء مزامنة بعض المدونات.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: 'فشل الاتصال بالخادم لتحديث المدونات.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteBlogTarget) return;
    setIsDeleting(true);

    try {
      const blogId = deleteBlogTarget.id;

      // If requested, delete all posts associated with this blog
      if (deleteAssociatedPosts) {
        const postsQuery = query(collection(db, 'posts'), where('blogId', '==', blogId));
        const postsSnap = await getDocs(postsQuery);
        
        // Batch delete
        const batch = writeBatch(db);
        postsSnap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      // Delete the blog document itself
      await deleteDoc(doc(db, 'blogs', blogId));

      toast({
        title: 'تم حذف المدونة',
        description: `تم حذف "${deleteBlogTarget.name}" بنجاح${deleteAssociatedPosts ? ' مع جميع مقالاتها' : ''}.`,
      });
      setDeleteBlogTarget(null);
    } catch (err: any) {
      console.error('Error deleting blog:', err);
      toast({
        title: 'خطأ في الحذف',
        description: err.message || 'فشل حذف المدونة من قاعدة البيانات.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'لم تتم المزامنة بعد';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 2) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return 'أمس';
      return `منذ ${diffDays} يوم`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner shrink-0">
              <BookOpen size={28} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">إدارة مدونات Blogger والمحتوى</h2>
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-700 uppercase tracking-wider">
                  Blogger RSS/Feed
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                إضافة مصادر مدونات Blogger وجلب المقالات تلقائياً وتحديثها وتخزينها في الموقع
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncAllBlogs}
              disabled={isSyncingAll || (blogs as Blog[] || []).length === 0}
              className="px-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={16} className={cn(isSyncingAll ? "animate-spin text-primary" : "")} />
              <span>{isSyncingAll ? 'جاري تحديث الكل...' : 'تحديث جميع المدونات'}</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-6 py-3 rounded-2xl text-white font-black text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <Plus size={18} />
              <span>إضافة مدونة جديدة</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">إجمالي المدونات</span>
            <span className="text-2xl font-black text-gray-900">{(blogs as Blog[] || []).length}</span>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">المدونات المفعلة</span>
            <span className="text-2xl font-black text-emerald-600">{activeBlogsCount}</span>
          </div>

          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">إجمالي المقالات المخزنة</span>
            <span className="text-2xl font-black text-blue-600">{totalPostsCount}</span>
          </div>

          <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">نظام التخزين</span>
            <span className="text-xs font-black text-orange-600 mt-1 flex items-center gap-1">
              <CheckCircle2 size={14} /> سحابي وCache فوري
            </span>
          </div>
        </div>
      </section>

      {/* Blogs List Section */}
      <section className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900">قائمة المدونات المضافة</h3>
            <p className="text-xs text-gray-400 font-medium">يمكنك تحديث أو تعديل أو تعطيل أي مدونة في أي وقت</p>
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المدونات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {blogsLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-bold">جاري تحميل المدونات...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-16 text-center bg-gray-50/60 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <BookOpen size={30} />
            </div>
            <div className="space-y-1 max-w-md">
              <h4 className="font-black text-base text-gray-800">لا توجد مدونات مضافة حالياً</h4>
              <p className="text-xs text-gray-500">
                أضف مدونة Blogger الأولى الخاصة بك وسيتم جلب مقالاتها وتصنيفاتها تلقائياً وعرضها في صفحة المدونة.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <Plus size={16} />
              <span>إضافة مدونة الآن</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBlogs.map((blog) => {
              const isSyncingThis = syncingBlogId === blog.id;
              const hasError = blog.lastStatus === 'error';
              const isEnabled = blog.enabled !== false;

              return (
                <div
                  key={blog.id}
                  className={cn(
                    "p-5 sm:p-6 rounded-3xl border transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-5",
                    !isEnabled 
                      ? "bg-gray-50/60 border-gray-200 opacity-75"
                      : hasError
                      ? "bg-red-50/20 border-red-200 shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md"
                  )}
                >
                  {/* Blog Info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black shadow-inner",
                      !isEnabled 
                        ? "bg-gray-200 text-gray-500" 
                        : hasError
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-50 text-orange-600"
                    )}>
                      <Globe size={22} />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-base text-gray-900 truncate">{blog.name}</h4>
                        
                        {/* Status Badge */}
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1",
                          !isEnabled 
                            ? "bg-gray-200 text-gray-600" 
                            : hasError
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            !isEnabled ? "bg-gray-400" : hasError ? "bg-red-500" : "bg-emerald-500 animate-pulse"
                          )} />
                          {!isEnabled ? 'معطلة' : hasError ? 'خطأ في الاتصال' : 'متصلة'}
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700">
                          {blog.postCount || 0} مقال
                        </span>
                      </div>

                      <a
                        href={blog.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium truncate direction-ltr text-left"
                      >
                        <ExternalLink size={12} />
                        <span>{blog.url}</span>
                      </a>

                      {/* Error or Last Sync text */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          آخر تحديث: {formatRelativeTime(blog.lastSync)}
                        </span>

                        {hasError && blog.lastError && (
                          <span className="text-red-500 font-bold flex items-center gap-1 truncate">
                            <AlertCircle size={12} />
                            {blog.lastError}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                    <button
                      onClick={() => handleSyncSingleBlog(blog.id, blog.name)}
                      disabled={isSyncingThis || !isEnabled}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
                      title="مزامنة وتحديث مقالات هذه المدونة الآن"
                    >
                      <RefreshCw size={14} className={isSyncingThis ? "animate-spin text-primary" : ""} />
                      <span>{isSyncingThis ? 'جاري التحديث...' : 'تحديث'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleEnabled(blog)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
                        isEnabled 
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100" 
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      <Power size={14} />
                      <span>{isEnabled ? 'تعطيل' : 'تفعيل'}</span>
                    </button>

                    <button
                      onClick={() => openEditModal(blog)}
                      className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Edit3 size={14} />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => setDeleteBlogTarget(blog)}
                      className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add / Edit Blog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-900">
                      {editingBlog ? 'تعديل بيانات المدونة' : 'إضافة مدونة Blogger جديدة'}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      أدخل رابط المدونة لجلب المقالات والتصنيفات تلقائياً
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBlog} className="space-y-5">
                {/* Blog Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">اسم المدونة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مدونة التصميم الاحترافي"
                    value={blogName}
                    onChange={(e) => setBlogName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                {/* Blog URL + Validation button */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 block">رابط المدونة (Blogger URL)</label>
                    <span className="text-[10px] text-gray-400 font-bold">يدعم .blogspot.com والنطاقات المخصصة</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://example.blogspot.com"
                      value={blogUrl}
                      onChange={(e) => {
                        setBlogUrl(e.target.value);
                        setValidationResult(null);
                      }}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-medium direction-ltr text-left focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleValidateUrl}
                      disabled={isValidating || !blogUrl.trim()}
                      className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                    >
                      {isValidating ? <Loader2 size={16} className="animate-spin text-primary" /> : <Sparkles size={16} />}
                      <span>فحص الرابط</span>
                    </button>
                  </div>
                </div>

                {/* Validation Feedback Alert */}
                {validationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border text-xs font-bold space-y-1",
                      validationResult.success
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                        : "bg-red-50/80 border-red-200 text-red-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {validationResult.success ? (
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle size={16} className="text-red-600 shrink-0" />
                      )}
                      <span>{validationResult.success ? 'تم الاتصال بالمدونة بنجاح!' : validationResult.error}</span>
                    </div>
                    {validationResult.success && validationResult.postCount !== undefined && (
                      <p className="text-[11px] text-emerald-700 font-medium mr-6">
                        تم العثور على {validationResult.postCount} مقال قابل للجلب والمزامنة.
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Enabled Toggle */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-gray-900">حالة المدونة</p>
                    <p className="text-[10px] text-gray-400 font-medium">عرض مقالات هذه المدونة في صفحة المدونة</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlogEnabled(!blogEnabled)}
                    className={cn(
                      "w-12 h-7 rounded-full transition-all relative shrink-0",
                      blogEnabled ? "bg-primary" : "bg-gray-300"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                        blogEnabled ? "right-1" : "right-6"
                      )}
                    />
                  </button>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3.5 text-white rounded-2xl text-xs font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: 'var(--primary-gradient)' }}
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>{isSaving ? 'جاري الحفظ...' : 'حفظ المدونة'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteBlogTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteBlogTarget(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 space-y-6 relative text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="font-black text-lg text-gray-900">تأكيد حذف المدونة</h3>
                <p className="text-xs text-gray-500">
                  هل أنت متأكد من رغبتك في حذف مدونة <span className="font-bold text-gray-800">&quot;{deleteBlogTarget.name}&quot;</span>؟
                </p>
              </div>

              {/* Checkbox to delete associated posts */}
              <label className="flex items-center gap-2.5 p-3 bg-red-50/50 rounded-2xl border border-red-100 text-xs font-bold text-red-900 cursor-pointer text-right">
                <input
                  type="checkbox"
                  checked={deleteAssociatedPosts}
                  onChange={(e) => setDeleteAssociatedPosts(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 h-4 w-4"
                />
                <span>حذف جميع المقالات المرتبطة بهذه المدونة من الموقع</span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteBlogTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  <span>{isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
