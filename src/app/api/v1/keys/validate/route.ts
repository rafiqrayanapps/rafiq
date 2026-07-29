import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/apiKeyAuth';

export async function POST(req: Request) {
  const authResult = await validateApiKey(req);
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, valid: false, error: authResult.error },
      { status: authResult.statusCode || 401 }
    );
  }

  return NextResponse.json({
    success: true,
    valid: true,
    keyInfo: {
      name: authResult.keyRecord?.name,
      id: authResult.keyRecord?.id,
      active: authResult.keyRecord?.active,
      createdAt: authResult.keyRecord?.createdAt,
      lastUsedAt: authResult.keyRecord?.lastUsedAt,
      usageCount: authResult.keyRecord?.usageCount || 0,
    },
  });
}
