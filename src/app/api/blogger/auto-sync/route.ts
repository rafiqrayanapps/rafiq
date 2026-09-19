import { NextRequest, NextResponse } from 'next/server';
import { getFirestoreCollection } from '@/lib/serverFirestore';

export async function GET(req: NextRequest) {
  return handleAutoSync();
}

export async function POST(req: NextRequest) {
  return handleAutoSync();
}

async function handleAutoSync() {
  try {
    const blogs = await getFirestoreCollection('blogs', 50);
    const enabledBlogs = (blogs || []).filter((b: any) => b.enabled !== false);

    if (enabledBlogs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled blogs configured.',
        count: 0
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Blogs sync is managed through the admin panel.',
      enabledBlogsCount: enabledBlogs.length
    });
  } catch (err: any) {
    console.warn('Auto-sync check notice:', err?.message || err);
    return NextResponse.json({
      success: true,
      message: 'Auto-sync checked.'
    });
  }
}
