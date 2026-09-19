import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreDoc, queryFirestoreCollection, deleteFirestoreDoc, updateFirestoreFields, setFirestoreDoc } from '@/lib/serverFirestore';
import { CustomPage } from '@/lib/definitions';
import { getCachedPages, deleteCachedPage } from '@/lib/pagesCache';
import { verifyAdminRequest } from '@/lib/serverAuth';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/pages/[slug] - Get page by slug or ID
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'الرابط غير موجود' }, { status: 400 });
    }

    // 1. Check appConfig/customPages first
    try {
      const configDoc = await getFirestoreDoc('appConfig/customPages');
      if (configDoc && Array.isArray(configDoc.pages)) {
        const found = configDoc.pages.find((p: any) => p.slug === slug || p.id === slug);
        if (found) {
          return NextResponse.json({
            success: true,
            page: found,
          });
        }
      }
    } catch (e) {
      // ignore
    }

    // 2. Check cached in-memory pages
    const cached = getCachedPages().find((p) => p.slug === slug || p.id === slug);
    if (cached) {
      return NextResponse.json({
        success: true,
        page: cached,
      });
    }

    // 3. Try direct document by ID first
    let pageDoc = null;
    try {
      pageDoc = await getFirestoreDoc(`pages/${slug}`);
      if (!pageDoc) {
        const results = await queryFirestoreCollection('pages', 'slug', 'EQUAL', slug, 1);
        if (results && results.length > 0) {
          pageDoc = results[0];
        }
      }
    } catch (e) {
      // ignore
    }

    if (!pageDoc) {
      return NextResponse.json(
        { success: false, error: 'لم يتم العثور على الصفحة المطلوبة.' },
        { status: 404 }
      );
    }

    const page: CustomPage = {
      id: pageDoc.id,
      title: pageDoc.title || '',
      slug: pageDoc.slug || pageDoc.id,
      icon: pageDoc.icon || 'FileText',
      content: pageDoc.content || '',
      isActive: pageDoc.isActive !== false,
      order: pageDoc.order || 0,
      description: pageDoc.description || '',
      views: (pageDoc.views || 0) + 1,
      createdAt: pageDoc.createdAt || '',
      updatedAt: pageDoc.updatedAt || '',
    };

    // Increment views silently in background
    updateFirestoreFields(`pages/${pageDoc.id}`, { views: page.views }).catch(() => {});

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error: any) {
    console.error('Error fetching page:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب بيانات الصفحة.' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[slug] - Delete a page
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const authResult = await verifyAdminRequest(req);
    if (!authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'غير مصرح لك بإجراء هذه العملية.' },
        { status: 401 }
      );
    }

    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'معرف الصفحة مطلوب' }, { status: 400 });
    }

    // 1. Delete from memory cache
    deleteCachedPage(slug);

    // 2. Delete from appConfig/customPages
    try {
      const configDoc = await getFirestoreDoc('appConfig/customPages');
      if (configDoc && Array.isArray(configDoc.pages)) {
        const filtered = configDoc.pages.filter((p: any) => p.slug !== slug && p.id !== slug);
        await setFirestoreDoc('appConfig/customPages', { pages: filtered, updatedAt: new Date().toISOString() });
      }
    } catch (e) {
      // ignore
    }

    // 3. Also attempt deleting from pages collection
    try {
      let docId = slug;
      const directDoc = await getFirestoreDoc(`pages/${slug}`);
      if (!directDoc) {
        const results = await queryFirestoreCollection('pages', 'slug', 'EQUAL', slug, 1);
        if (results && results.length > 0) {
          docId = results[0].id;
        }
      }
      deleteFirestoreDoc(`pages/${docId}`).catch(() => {});
    } catch (e) {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الصفحة بنجاح.',
    });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف الصفحة.' },
      { status: 500 }
    );
  }
}
