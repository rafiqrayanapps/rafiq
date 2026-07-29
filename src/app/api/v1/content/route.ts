import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyAuth';
import {
  getFirestoreCollection,
  queryFirestoreCollection,
} from '@/lib/serverFirestore';

export async function GET(req: Request) {
  // Validate API key
  const authResult = await validateApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.statusCode || 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const categoryId = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const result: any = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {},
    };

    if (type === 'categories' || type === 'all') {
      result.data.categories = await getFirestoreCollection('categories', limit);
    }

    if (type === 'subcategories' || type === 'all') {
      if (categoryId) {
        result.data.subcategories = await queryFirestoreCollection('subcategories', 'categoryId', 'EQUAL', categoryId, limit);
      } else {
        result.data.subcategories = await getFirestoreCollection('subcategories', limit);
      }
    }

    if (type === 'items' || type === 'all') {
      let items: any[];
      if (categoryId) {
        items = await queryFirestoreCollection('items', 'categoryId', 'EQUAL', categoryId, limit);
      } else {
        items = await getFirestoreCollection('items', limit);
      }

      if (search) {
        items = items.filter((item: any) =>
          item.title?.toLowerCase().includes(search) ||
          item.content?.toLowerCase().includes(search)
        );
      }

      result.data.items = items;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /v1/content error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم أثناء جلب البيانات.' },
      { status: 500 }
    );
  }
}
