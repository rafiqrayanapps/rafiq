import { NextRequest, NextResponse } from 'next/server';
import { normalizeBloggerUrl, isSafeBloggerUrl } from '@/lib/blogger';
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

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json(
        { success: false, error: 'رابط المدونة غير صالح.' },
        { status: 400 }
      );
    }

    if (!isSafeBloggerUrl(url.trim())) {
      return NextResponse.json(
        { success: false, error: 'رابط المدونة غير مصرح به أو يتبع نطاق غير آمن.' },
        { status: 400 }
      );
    }

    const { baseUrl, feedUrl } = normalizeBloggerUrl(url.trim());

    // Test fetch to Blogger feed
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    let res: Response;
    try {
      res = await fetch(feedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*',
        },
        signal: controller.signal,
        cache: 'no-store',
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        { 
          success: false, 
          error: fetchErr.name === 'AbortError' 
            ? 'انتهت مهلة الاتصال بالمدونة. يرجى المحاولة لاحقاً.' 
            : 'تعذر الاتصال بالمدونة حاليًا. تأكد من صحة الرابط وأن المدونة عامة.' 
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: `تعذر الوصول إلى تغذية Blogger (رمز الاستجابة: ${res.status}). تأكد من أن المدونة عامة وليست خاصة.` 
        },
        { status: 400 }
      );
    }

    let data: any;
    try {
      data = await res.json();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: 'استجابة المدونة ليست بتنسيق تغذية Blogger JSON صالح.' },
        { status: 400 }
      );
    }

    if (!data?.feed) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على محتوى Blogger في هذا الرابط.' },
        { status: 400 }
      );
    }

    const title = data.feed.title?.$t || 'مدونة Blogger';
    const description = data.feed.subtitle?.$t || '';
    const totalResults = parseInt(data.feed.openSearch$totalResults?.$t || '0', 10);
    const postCount = Array.isArray(data.feed.entry) ? data.feed.entry.length : (totalResults || 0);

    return NextResponse.json({
      success: true,
      title,
      description,
      postCount,
      baseUrl,
      feedUrl,
      message: postCount > 0 ? `تم الاتصال بنجاح (${postCount} مقال متوفر)` : 'تم الاتصال ولكن لا توجد مقالات منشورة بعد.'
    });

  } catch (error: any) {
    console.error('Blogger validate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'حدث خطأ غير متوقع أثناء التحقق من المدونة.' },
      { status: 500 }
    );
  }
}
