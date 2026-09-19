import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreCollection, getFirestoreDoc, queryFirestoreCollection, setFirestoreDoc } from '@/lib/serverFirestore';
import { slugifyArabic } from '@/lib/pageIcons';
import { CustomPage } from '@/lib/definitions';
import { getCachedPages, saveCachedPage } from '@/lib/pagesCache';
import { verifyAdminRequest } from '@/lib/serverAuth';

// GET /api/pages - Get list of pages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // 1. Try appConfig/customPages first (allowed by Firestore security rules)
    let firestorePages: CustomPage[] = [];
    try {
      const configDoc = await getFirestoreDoc('appConfig/customPages');
      if (configDoc && Array.isArray(configDoc.pages) && configDoc.pages.length > 0) {
        firestorePages = configDoc.pages.map((p: any) => ({
          id: p.id || p.slug,
          title: p.title || '',
          slug: p.slug || p.id,
          icon: p.icon || 'FileText',
          content: p.content || '',
          isActive: p.isActive !== false,
          order: typeof p.order === 'number' ? p.order : 0,
          description: p.description || '',
          views: p.views || 0,
          createdAt: p.createdAt || '',
          updatedAt: p.updatedAt || '',
        }));
      }
    } catch (e) {
      // ignore
    }

    let pages: CustomPage[] = firestorePages.length > 0 ? firestorePages : getCachedPages();

    if (activeOnly) {
      pages = pages.filter((p) => p.isActive);
    }

    // Sort by order ascending, then by title
    pages.sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title, 'ar');
    });

    return NextResponse.json({
      success: true,
      pages,
      count: pages.length,
    });
  } catch (error: any) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({
      success: true,
      pages: getCachedPages(),
      count: getCachedPages().length,
    });
  }
}

// POST /api/pages - Create or update a page
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'غير مصرح لك بإجراء هذه العملية.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'البيانات المرسلة غير صالحة.' },
        { status: 400 }
      );
    }

    const { id, title, url, icon, isActive, order, description, content } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم الصفحة.' },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    const rawUrl = (url || '').trim();
    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال الرابط الخارجي للصفحة.' },
        { status: 400 }
      );
    }

    // Ensure URL has protocol
    const cleanUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;

    const pageId = id || `page-${Date.now()}`;
    const now = new Date().toISOString();

    const pageData: Record<string, any> = {
      title: trimmedTitle,
      url: cleanUrl,
      icon: icon || 'Globe',
      isActive: isActive !== false,
      order: typeof order === 'number' ? order : 0,
      description: description ? description.trim() : '',
      content: content || '',
      updatedAt: now,
    };

    if (!id) {
      pageData.createdAt = now;
    }

    const fullPage: CustomPage = { id: pageId, ...pageData } as CustomPage;

    // 1. Update in-memory cache
    saveCachedPage(fullPage);

    // 2. Save into appConfig/customPages (always accessible in Firestore rules)
    try {
      const configDoc = await getFirestoreDoc('appConfig/customPages');
      const existingList: any[] = (configDoc && Array.isArray(configDoc.pages)) ? [...configDoc.pages] : [];
      const idx = existingList.findIndex((p: any) => p.id === pageId);
      if (idx >= 0) {
        existingList[idx] = fullPage;
      } else {
        existingList.push(fullPage);
      }
      await setFirestoreDoc('appConfig/customPages', { pages: existingList, updatedAt: now });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: id ? 'تم حفظ التعديلات بنجاح.' : 'تمت إضافة الصفحة بنجاح.',
      page: fullPage,
    });
  } catch (error: any) {
    console.error('Error saving page:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ الصفحة.' },
      { status: 500 }
    );
  }
}
