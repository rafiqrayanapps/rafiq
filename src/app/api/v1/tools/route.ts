import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyAuth';
import { getFirestoreDoc } from '@/lib/serverFirestore';

export async function GET(req: Request) {
  const authResult = await validateApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.statusCode || 401 }
    );
  }

  try {
    const data = await getFirestoreDoc('toolConfig/global');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tools: {
        chat: { active: !!data?.chatId },
        imageGen: { active: !!data?.imageGenId },
        promptGen: { active: !!data?.promptGenId },
        storyGen: { active: !!data?.storyGenId },
        globalKeyConfigured: !!data?.globalApiKey,
      },
    });
  } catch (error: any) {
    console.error('API /v1/tools error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم أثناء قراءة حالة الأدوات.' },
      { status: 500 }
    );
  }
}
