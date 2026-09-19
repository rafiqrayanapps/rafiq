'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useFirebase';
import { CustomPage } from '@/lib/definitions';
import { getPageIcon } from '@/lib/pageIcons';
import Markdown from 'react-markdown';
import {
  Share2, Copy, Check, ArrowRight, Calendar, Eye,
  BookOpen, Sparkles, Home, ChevronLeft, Printer,
  ZoomIn, ZoomOut, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function DynamicCustomPage() {
  const params = useParams();
  const rawSlug = params?.slug as string;
  const slug = decodeURIComponent(rawSlug || '');
  const router = useRouter();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSizeLevel, setFontSizeLevel] = useState<1 | 2 | 3>(2); // 1 = small, 2 = normal, 3 = large
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;

    async function fetchPage() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/pages/${encodeURIComponent(slug)}`, {
          cache: 'no-store',
        });
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('Invalid response format');
        }
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.page) {
          // If page is inactive and user is not admin, hide it
          if (!data.page.isActive && !isAdmin) {
            setError('هذه الصفحة غير متاحة حالياً أو تم إيقافها مؤقتاً.');
          } else {
            setPage(data.page);
            if (data.page.url) {
              const targetUrl = data.page.url.startsWith('http://') || data.page.url.startsWith('https://')
                ? data.page.url
                : `https://${data.page.url}`;
              if (typeof window !== 'undefined') {
                window.location.replace(targetUrl);
                return;
              }
            }
          }
        } else {
          setError(data.error || 'الصفحة المطلوبة غير موجودة.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError('حدث خطأ أثناء تحميل محتوى الصفحة.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPage();
    return () => {
      isMounted = false;
    };
  }, [slug, isAdmin]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({
      title: 'تم نسخ الرابط بنجاح',
      description: 'يمكنك الآن مشاركة الرابط مع الآخرين.',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    if (navigator.share && page) {
      try {
        await navigator.share({
          title: page.title,
          text: page.description || page.title,
          url: window.location.href,
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const IconComp = getPageIcon(page?.icon);

  return (
    <div className="min-h-screen bg-gray-50/50 text-foreground font-sans pb-24" dir="rtl">
      {/* Drawer Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main App Header */}
      <Header
        title={page?.title || "صفحة مخصصة"}
        showBackButton={true}
        onBackClick={() => router.back()}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* Main Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {loading ? (
          <div className="bg-white rounded-[2.5rem] p-12 sm:p-16 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-4 my-8">
            <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
            <p className="text-sm font-bold text-gray-500">جاري تحميل الصفحة والمحتوى...</p>
          </div>
        ) : error || !page ? (
          <div className="bg-white rounded-[2.5rem] p-10 sm:p-16 text-center border border-gray-100 shadow-sm space-y-5 my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">عذراً، تعذر العثور على الصفحة</h1>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed font-medium">
              {error || 'قد تكون هذه الصفحة قد حُذفت أو تم تعطيلها من قبل إدارة التطبيق.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition-all active:scale-95"
              >
                <Home size={16} />
                <span>العودة للرئيسية</span>
              </Link>
            </div>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Link href="/home" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                <Home size={13} />
                <span>الرئيسية</span>
              </Link>
              <span>/</span>
              <span className="text-gray-700">{page.title}</span>
            </nav>

            {/* Page Title & Hero Card */}
            <header className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm relative overflow-hidden">
              {/* Background Glow */}
              <div
                className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: 'var(--primary, #2563eb)' }}
              />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0"
                    style={{ background: 'var(--primary-gradient, linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%))' }}
                  >
                    <IconComp size={32} strokeWidth={2.2} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
                        {page.title}
                      </h1>
                      {!page.isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-black">
                          مسودة (غير معلنة)
                        </span>
                      )}
                    </div>
                    {page.description && (
                      <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        {page.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Action Bar: Font Zoom, Share, Copy */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {/* Font Size Adjuster */}
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                    <button
                      onClick={() => setFontSizeLevel((prev) => (prev > 1 ? (prev - 1 as any) : 1))}
                      title="تصغير حجم الخط"
                      className={cn(
                        "p-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        fontSizeLevel === 1 ? "bg-white text-blue-600 shadow-xs" : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <button
                      onClick={() => setFontSizeLevel(2)}
                      title="حجم الخط الطبيعي"
                      className={cn(
                        "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        fontSizeLevel === 2 ? "bg-white text-blue-600 shadow-xs" : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      A
                    </button>
                    <button
                      onClick={() => setFontSizeLevel((prev) => (prev < 3 ? (prev + 1 as any) : 3))}
                      title="تكبير حجم الخط"
                      className={cn(
                        "p-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        fontSizeLevel === 3 ? "bg-white text-blue-600 shadow-xs" : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>

                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    title="نسخ الرابط"
                    className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    title="مشاركة الصفحة"
                    className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                  >
                    <Share2 size={18} />
                  </button>

                  {/* Print */}
                  <button
                    onClick={handlePrint}
                    title="طباعة الصفحة"
                    className="p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 transition-colors cursor-pointer hidden sm:block"
                  >
                    <Printer size={18} />
                  </button>
                </div>
              </div>

              {/* Publication Meta details */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  {page.updatedAt && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-gray-400" />
                      <span>آخر تحديث: {new Date(page.updatedAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </span>
                  )}
                  {page.views !== undefined && page.views > 0 && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Eye size={14} className="text-gray-400" />
                      <span>{page.views} مشاهدة</span>
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100" dir="ltr">
                  /p/{page.slug}
                </div>
              </div>
            </header>

            {/* Rich Content Article Box */}
            <main className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-sm">
              <div
                className={cn(
                  "prose prose-slate max-w-none transition-all",
                  "prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight",
                  "prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4 prose-h1:pb-3 prose-h1:border-b prose-h1:border-gray-100",
                  "prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3",
                  "prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2 text-blue-900",
                  "prose-p:text-gray-700 prose-p:leading-relaxed",
                  "prose-a:text-blue-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline",
                  "prose-strong:font-black prose-strong:text-gray-900",
                  "prose-ul:list-disc prose-ul:pr-5 prose-ul:my-4 prose-li:my-1 text-gray-700",
                  "prose-ol:list-decimal prose-ol:pr-5 prose-ol:my-4 prose-li:my-1 text-gray-700",
                  "prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/40 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-2xl prose-blockquote:text-blue-950 prose-blockquote:font-medium prose-blockquote:not-italic",
                  "prose-hr:my-8 prose-hr:border-gray-100",
                  fontSizeLevel === 1 && "prose-base text-sm",
                  fontSizeLevel === 2 && "prose-lg text-base",
                  fontSizeLevel === 3 && "prose-xl text-lg"
                )}
              >
                <Markdown>{page.content}</Markdown>
              </div>
            </main>

            {/* Footer Navigation Bar */}
            <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <Link
                href="/home"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm shadow-xs hover:bg-gray-50 transition-colors"
              >
                <ArrowRight size={16} />
                <span>العودة للصفحة الرئيسية</span>
              </Link>

              <button
                onClick={handleShare}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95 cursor-pointer"
              >
                <Share2 size={16} />
                <span>مشاركة هذه الصفحة</span>
              </button>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
