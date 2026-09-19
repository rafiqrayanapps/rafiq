import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDoc, getFirestoreCollection } from '@/lib/serverFirestore';
import { normalizeBloggerUrl, parseBloggerFeed, isSafeBloggerUrl } from '@/lib/blogger';
import { verifyAdminRequest } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'غير مصرح لك بإجراء هذه العملية.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { blogId, forceAll, feedUrl: directFeedUrl, url: directUrl, blogName: directBlogName } = body;

    // Validate any direct URL provided
    if (directUrl && !isSafeBloggerUrl(directUrl)) {
      return NextResponse.json({ success: false, error: 'رابط المدونة غير صالح أو غير آمن.' }, { status: 400 });
    }
    if (directFeedUrl && !isSafeBloggerUrl(directFeedUrl)) {
      return NextResponse.json({ success: false, error: 'رابط التغذية غير صالح أو غير آمن.' }, { status: 400 });
    }

    // Retrieve target blogs from Firestore or request
    let blogsToSync: Array<{ id: string; name: string; url: string; feedUrl?: string; enabled?: boolean }> = [];

    if (blogId) {
      // Check if details were provided directly, otherwise fetch from Firestore
      let targetBlog: any = null;
      if (directFeedUrl || directUrl) {
        targetBlog = {
          id: blogId,
          name: directBlogName || 'مدونة Blogger',
          url: directUrl || directFeedUrl,
          feedUrl: directFeedUrl,
          enabled: true,
        };
      } else {
        targetBlog = await getFirestoreDoc(`blogs/${blogId}`);
      }

      if (!targetBlog) {
        return NextResponse.json(
          { success: false, error: 'المدونة المطلوبة غير موجودة في النظام.' },
          { status: 404 }
        );
      }
      blogsToSync = [{ id: blogId, ...targetBlog }];
    } else {
      const allBlogs = await getFirestoreCollection('blogs', 100);
      blogsToSync = (allBlogs || []).filter((b: any) => forceAll || b.enabled !== false);
    }

    if (blogsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'لا توجد مدونات مفعلة للمزامنة حالياً.',
        totalPostsSynced: 0,
        syncedBlogsCount: 0,
        results: [],
        syncedBlogs: [],
      });
    }

    const results: Array<{
      blogId: string;
      blogName: string;
      status: 'success' | 'error';
      syncedCount: number;
      posts?: any[];
      error?: string;
    }> = [];

    let grandTotalSynced = 0;

    for (const blog of blogsToSync) {
      try {
        const { feedUrl } = normalizeBloggerUrl(blog.feedUrl || blog.url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*',
          },
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`تعذر جلب التغذية (رمز الاستجابة: ${res.status})`);
        }

        const data = await res.json();
        const { title, posts } = parseBloggerFeed(data, blog.id, blog.name);

        grandTotalSynced += posts.length;

        results.push({
          blogId: blog.id,
          blogName: blog.name || title,
          status: 'success',
          syncedCount: posts.length,
          posts,
        });

      } catch (blogErr: any) {
        console.error(`Error fetching blog ${blog.name} (${blog.id}):`, blogErr);

        results.push({
          blogId: blog.id,
          blogName: blog.name,
          status: 'error',
          syncedCount: 0,
          posts: [],
          error: blogErr.message || 'فشل في جلب المقالات من المدونة',
        });
      }
    }

    const hasErrors = results.some((r) => r.status === 'error');
    const successCount = results.filter((r) => r.status === 'success').length;

    return NextResponse.json({
      success: true,
      totalPostsSynced: grandTotalSynced,
      syncedBlogsCount: successCount,
      failedBlogsCount: results.length - successCount,
      hasErrors,
      results,
      posts: results[0]?.posts || [],
      message: `تم جلب ${grandTotalSynced} مقال بنجاح من ${successCount} مدونة.`
    });

  } catch (error: any) {
    console.error('Blogger Sync Global Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء مزامنة المدونات.' },
      { status: 500 }
    );
  }
}
