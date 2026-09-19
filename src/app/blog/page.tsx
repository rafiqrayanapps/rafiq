'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import { useCollection } from '@/hooks/useFirebase';
import { BlogPost, Blog } from '@/lib/definitions';
import { 
  Search, Filter, Calendar, Clock, Tag, ExternalLink, 
  ChevronLeft, ArrowRight, Share2, Sparkles, BookOpen, Layers,
  RefreshCw, Check, Globe, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function BlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlogId, setSelectedBlogId] = useState<string>('all');
  const [selectedLabel, setSelectedLabel] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Fetch blogs & posts from Firestore
  const { data: rawBlogs, loading: blogsLoading } = useCollection('blogs');
  const { data: rawPosts, loading: postsLoading } = useCollection('posts');

  // Trigger silent auto-sync in the background once when visiting
  useEffect(() => {
    fetch('/api/blogger/auto-sync', { method: 'POST' }).catch(() => {});
  }, []);

  const blogs = (rawBlogs as Blog[] || []).filter((b) => b.enabled !== false);
  const disabledBlogIds = useMemo(() => {
    return new Set((rawBlogs as Blog[] || []).filter((b) => b.enabled === false).map((b) => b.id));
  }, [rawBlogs]);

  // Filter posts
  const allActivePosts = useMemo(() => {
    const list = (rawPosts as BlogPost[] || []).filter((p) => !disabledBlogIds.has(p.blogId));
    // Sort by publication date descending
    return list.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [rawPosts, disabledBlogIds]);

  // Extract all unique labels/categories from active posts
  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>();
    allActivePosts.forEach((p) => {
      if (Array.isArray(p.labels)) {
        p.labels.forEach((l) => {
          if (l && typeof l === 'string' && l.trim()) {
            labelSet.add(l.trim());
          }
        });
      }
    });
    return Array.from(labelSet);
  }, [allActivePosts]);

  // Apply search and filter
  const filteredPosts = useMemo(() => {
    return allActivePosts.filter((post) => {
      // Blog filter
      if (selectedBlogId !== 'all' && post.blogId !== selectedBlogId) {
        return false;
      }
      // Label filter
      if (selectedLabel !== 'all' && (!post.labels || !post.labels.includes(selectedLabel))) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = post.title?.toLowerCase().includes(q);
        const inExcerpt = post.excerpt?.toLowerCase().includes(q);
        const inBlog = post.blogName?.toLowerCase().includes(q);
        const inLabels = post.labels?.some((l) => l.toLowerCase().includes(q));
        if (!inTitle && !inExcerpt && !inBlog && !inLabels) {
          return false;
        }
      }
      return true;
    });
  }, [allActivePosts, selectedBlogId, selectedLabel, searchQuery]);

  const displayedPosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  const hasMore = displayedPosts.length < filteredPosts.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  // Helper to determine direct destination URL for in-app reading
  const getPostTargetUrl = (post: BlogPost): string => {
    return `/blog/${post.id}`;
  };

  const formatArabicDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
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

  const handleSharePost = async (e: React.MouseEvent, post: BlogPost) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/blog/${post.id}` 
      : `/blog/${post.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPostId(post.id);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط المقال إلى الحافظة بنجاح.',
      });
      setTimeout(() => setCopiedPostId(null), 2500);
    } catch (err) {
      toast({
        title: 'خطأ',
        description: 'تعذر نسخ الرابط.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 transition-colors duration-500">
      <Header
        title="المدونة"
        showBackButton
        onBackClick={() => router.push('/home')}
        extraContent={
          <div className="relative z-[55] -mt-5 sm:-mt-6">
            <div className="px-4 sm:px-6 max-w-2xl mx-auto">
              <div className="relative group bg-card/95 backdrop-blur-md rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.12),0_4px_10px_-2px_rgba(0,0,0,0.06)] border border-border/80 hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15 transition-all">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث في المقالات، العناوين، والتصنيفات..."
                  className="h-13 sm:h-14 w-full bg-transparent pr-12 pl-12 text-xs sm:text-sm font-bold text-foreground placeholder:text-muted-foreground placeholder:font-normal outline-none text-right rounded-2xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground bg-muted/70 hover:bg-muted rounded-xl transition-colors"
                    title="مسح البحث"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16 space-y-5">
        {/* Top Info & Action Bar */}
        <div className="flex items-center justify-between gap-2.5 px-1">
          <div className="text-xs font-black text-muted-foreground bg-card border border-border/70 px-3.5 py-2 rounded-xl shadow-sm whitespace-nowrap">
            {filteredPosts.length} مقال متوفر
          </div>

          {blogs.length > 0 && blogs[0]?.url && (
            <a
              href={blogs[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-black transition-all border border-orange-200/50 dark:border-orange-800/50 whitespace-nowrap active:scale-95 shadow-sm"
              title="فتح المدونة الرئيسية في نافذة جديدة"
            >
              <Globe size={14} />
              <span>زيارة المدونة</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Blog Sources Filter Tabs */}
        {blogs.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 ml-1 whitespace-nowrap flex items-center gap-1">
              <Layers size={13} /> المصدر:
            </span>
            <button
              onClick={() => setSelectedBlogId('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 shadow-sm",
                selectedBlogId === 'all'
                  ? "bg-primary text-white shadow-primary/20"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              )}
            >
              جميع المدونات
            </button>
            {blogs.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBlogId(b.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 shadow-sm",
                  selectedBlogId === b.id
                    ? "bg-primary text-white shadow-primary/20"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* Category / Labels Filter Pills */}
        {availableLabels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
            <span className="text-xs font-black text-gray-400 dark:text-gray-500 ml-1 whitespace-nowrap flex items-center gap-1">
              <Tag size={13} /> التصنيف:
            </span>
            <button
              onClick={() => setSelectedLabel('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 shadow-sm",
                selectedLabel === 'all'
                  ? "bg-orange-500 text-white shadow-orange-500/20"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
              )}
            >
              الكل ({allActivePosts.length})
            </button>
            {availableLabels.map((label) => (
              <button
                key={label}
                onClick={() => setSelectedLabel(label)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap active:scale-95 shadow-sm",
                  selectedLabel === label
                    ? "bg-orange-500 text-white shadow-orange-500/20"
                    : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Articles Feed */}
        {postsLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-5 space-y-4 animate-pulse"
              >
                <div className="w-full aspect-[16/10] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm p-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <BookOpen size={30} />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-black text-lg text-gray-900 dark:text-white">لم يتم العثور على مقالات</h3>
              <p className="text-xs text-gray-400 font-medium">
                {searchQuery || selectedLabel !== 'all' || selectedBlogId !== 'all'
                  ? 'لا توجد نتائج تطابق خيارات البحث والتصفية المحددة.'
                  : 'لم يتم نشر مقالات في المدونة بعد.'}
              </p>
            </div>
            {(searchQuery || selectedLabel !== 'all' || selectedBlogId !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLabel('all');
                  setSelectedBlogId('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 transition-all active:scale-95"
              >
                إعادة ضبط التصفية
              </button>
            )}
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPosts.map((post, idx) => {
              const hasImage = Boolean(post.featuredImage);
              const readTime = estimateReadingTime(post.content, post.excerpt);

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  className="bg-white dark:bg-gray-900 rounded-[2.2rem] border border-gray-100 dark:border-gray-800/80 hover:border-primary/30 dark:hover:border-primary/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Thumbnail / Image Banner */}
                  <Link
                    href={`/blog/${post.id}`}
                    className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 block cursor-pointer"
                  >
                    {hasImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-400/20 via-primary/10 to-amber-500/20 text-orange-600 p-6 text-center">
                        <BookOpen size={40} className="opacity-60 mb-2" />
                        <span className="text-xs font-black opacity-80">{post.blogName || 'مقالة إبداعية'}</span>
                      </div>
                    )}

                    {/* Blog Source Chip */}
                    {post.blogName && (
                      <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-black tracking-wide shadow-sm flex items-center gap-1.5">
                        <span>{post.blogName}</span>
                      </div>
                    )}

                    {/* First Category Label Chip */}
                    {post.labels && post.labels.length > 0 && (
                      <div className="absolute bottom-3.5 right-3.5 px-2.5 py-1 rounded-lg bg-orange-500/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm">
                        {post.labels[0]}
                      </div>
                    )}
                  </Link>

                  {/* Post Details Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      {/* Meta information row */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatArabicDate(post.publishedAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {readTime}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/blog/${post.id}`}>
                        <h2 className="font-black text-base sm:text-lg text-gray-900 dark:text-white leading-snug line-clamp-2 hover:text-primary transition-colors">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                      <Link
                        href={`/blog/${post.id}`}
                        className="text-xs font-black text-primary flex items-center gap-1 hover:gap-1.5 transition-all group/btn"
                      >
                        <span>قراءة المقال</span>
                        <ChevronLeft size={16} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                      </Link>

                      <div className="flex items-center gap-1">
                        {post.originalUrl && (
                          <a
                            href={post.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                            title="فتح في المصدر الأصلي"
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}

                        <button
                          onClick={(e) => handleSharePost(e, post)}
                          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
                          title="مشاركة المقال"
                        >
                          {copiedPostId === post.id ? (
                            <Check size={16} className="text-emerald-500" />
                          ) : (
                            <Share2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-8">
            <button
              onClick={handleLoadMore}
              className="px-8 py-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-primary/50 text-gray-900 dark:text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
            >
              <span>تحميل المزيد من المقالات</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
