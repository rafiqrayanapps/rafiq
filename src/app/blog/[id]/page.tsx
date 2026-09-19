'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useDoc, useCollection } from '@/hooks/useFirebase';
import { BlogPost } from '@/lib/definitions';
import { 
  ArrowRight, Calendar, Clock, Tag, Share2, ExternalLink, 
  BookOpen, Check, Copy, MessageCircle, Send, Twitter, 
  ChevronLeft, Sparkles, User, Globe, AlertCircle, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sanitizePostHtml } from '@/lib/blogger';

export default function BlogPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  // Fetch current post
  const { data: rawPost, loading: postLoading } = useDoc('posts', id);
  const post = rawPost as BlogPost | null;

  // Fetch all posts to find related articles
  const { data: allPosts } = useCollection('posts');

  const formatArabicDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const estimateReadingTime = (content?: string, excerpt?: string) => {
    const text = content || excerpt || '';
    const words = text.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} دقائق للقراءة`;
  };

  // Find related articles (matching labels or same blog)
  const relatedPosts = useMemo(() => {
    if (!post || !allPosts) return [];
    const others = (allPosts as BlogPost[]).filter((p) => p.id !== post.id);

    // Score by common labels
    return others
      .map((item) => {
        let score = 0;
        if (item.blogId === post.blogId) score += 2;
        if (Array.isArray(item.labels) && Array.isArray(post.labels)) {
          const common = item.labels.filter((l) => post.labels.includes(l));
          score += common.length * 3;
        }
        return { post: item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.post)
      .slice(0, 3);
  }, [post, allPosts]);

  const sanitizedHtml = useMemo(() => {
    if (!post?.content) return '';
    return sanitizePostHtml(post.content);
  }, [post?.content]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      toast({ title: 'تم نسخ الرابط', description: 'تم نسخ رابط المقال بنجاح إلى الحافظة.' });
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      toast({ title: 'خطأ', description: 'تعذر نسخ الرابط.', variant: 'destructive' });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: currentUrl,
        });
      } catch (e) {
        // Fallback
      }
    } else {
      handleCopyLink();
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`${post?.title}\n${currentUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const shareViaTelegram = () => {
    const text = encodeURIComponent(post?.title || '');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${text}`, '_blank');
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(post?.title || '');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12 transition-colors duration-500">
      <Header
        title="تفاصيل المقال"
        showBackButton
        onBackClick={() => router.push('/blog')}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
        {postLoading ? (
          <div className="py-28 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold">جاري تحميل المقال...</p>
          </div>
        ) : !post ? (
          <div className="py-24 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950 text-red-500 flex items-center justify-center">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="font-black text-xl text-gray-900 dark:text-white">المقال غير متوفر</h2>
              <p className="text-xs text-gray-400">قد يكون المقال تم حذفه أو أن الرابط غير صحيح.</p>
            </div>
            <Link
              href="/blog"
              className="px-6 py-3 rounded-2xl bg-primary text-white font-bold text-xs shadow-lg shadow-primary/20 active:scale-95"
            >
              العودة إلى المدونة
            </Link>
          </div>
        ) : (
          <article className="space-y-8 animate-in fade-in duration-300">
            {/* Navigation back row & Share trigger */}
            <div className="flex items-center justify-between">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-primary transition-colors bg-white dark:bg-gray-900 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <ArrowRight size={16} />
                <span>العودة لجميع المقالات</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleNativeShare}
                  className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-primary text-gray-700 dark:text-gray-300 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Share2 size={16} />
                  <span>مشاركة</span>
                </button>

                {post.originalUrl && (
                  <a
                    href={post.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 hover:bg-orange-100 text-xs font-bold transition-all flex items-center gap-1.5"
                    title="قراءة في المصدر الأصلي"
                  >
                    <ExternalLink size={14} />
                    <span>المصدر الأصلي</span>
                  </a>
                )}
              </div>
            </div>

            {/* Main Article Container */}
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden p-6 sm:p-10 space-y-8">
              {/* Header Badges */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {post.blogName && (
                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 text-xs font-black tracking-wide">
                      {post.blogName}
                    </span>
                  )}
                  {post.labels && post.labels.map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold"
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Main Article Title */}
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                  {post.title}
                </h1>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 dark:text-gray-500 font-bold pt-2 border-t border-gray-100 dark:border-gray-800/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {formatArabicDate(post.publishedAt)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {estimateReadingTime(post.content, post.excerpt)}
                  </span>
                  {post.author && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <User size={14} />
                        الكاتب: {post.author}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Callout banner to visit original post on main blog */}
              {post.originalUrl && (
                <div className="p-4 sm:p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">قراءة هذا المقال في المدونة الرئيسية</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">انقر لفتح التدوينة بالكامل بتنسيقها الأصلي في موقع المدونة الرسمي</p>
                    </div>
                  </div>
                  <a
                    href={post.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shrink-0 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                  >
                    <span>الانتقال للمدونة الأصلية</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {/* Featured Image */}
              {post.featuredImage && (
                <div className="w-full aspect-[16/9] rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm relative">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Sanitized Full Article Content */}
              <div 
                className="article-content prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-normal"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />

              {/* Social Share Bar */}
              <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">مشاركة هذا المقال:</h3>
                  <button
                    onClick={handleCopyLink}
                    className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{isCopied ? 'تم نسخ الرابط!' : 'نسخ رابط المقال'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={shareViaWhatsApp}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle size={16} />
                    <span>واتساب</span>
                  </button>

                  <button
                    onClick={shareViaTelegram}
                    className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Send size={16} />
                    <span>تيليجرام</span>
                  </button>

                  <button
                    onClick={shareViaTwitter}
                    className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Twitter size={16} />
                    <span>تويتر / X</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Copy size={16} />
                    <span>نسخ الرابط</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Related Articles Section */}
            {relatedPosts.length > 0 && (
              <section className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-gray-900 dark:text-white">مقالات ذات صلة</h3>
                  <Link href="/blog" className="text-xs font-black text-primary hover:underline">
                    عرض الكل
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedPosts.map((related) => {
                    const relatedUrl = (related.originalUrl && related.originalUrl.trim().startsWith('http')) 
                      ? related.originalUrl.trim() 
                      : `/blog/${related.id}`;
                    const isRelExternal = relatedUrl.startsWith('http');

                    return (
                      <a
                        key={related.id}
                        href={relatedUrl}
                        target={isRelExternal ? "_blank" : undefined}
                        rel={isRelExternal ? "noopener noreferrer" : undefined}
                        className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-primary/40 transition-all group flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md"
                      >
                        {related.featuredImage && (
                          <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <img
                              src={related.featuredImage}
                              alt={related.title}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-orange-500">{related.blogName}</span>
                            {isRelExternal && <ExternalLink size={10} className="text-gray-400" />}
                          </div>
                          <h4 className="font-black text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {related.title}
                          </h4>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1 pt-1">
                          <Calendar size={10} />
                          <span>{formatArabicDate(related.publishedAt)}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
}
