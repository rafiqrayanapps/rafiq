import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyAuth';

export async function POST(req: Request) {
  const authResult = await validateApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.statusCode || 401 }
    );
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'يرجى تقديم النص الوصفي للصورة (prompt).' },
        { status: 400 }
      );
    }

    // Call internal generate-image API logic
    const origin = new URL(req.url).origin;
    const genRes = await fetch(`${origin}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const result = await genRes.json();

    if (!genRes.ok) {
      return NextResponse.json(
        { success: false, error: result.error || 'فشل توليد الصورة.' },
        { status: genRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('API /v1/generate-image error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع أثناء معالجة طلب الصورة.' },
      { status: 500 }
    );
  }
}
