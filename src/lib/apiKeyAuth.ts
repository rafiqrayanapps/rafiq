import {
  getFirestoreDoc,
  queryFirestoreCollection,
  updateFirestoreFields,
} from '@/lib/serverFirestore';

export interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
}

export async function validateApiKey(req: Request): Promise<{
  valid: boolean;
  keyRecord?: ApiKeyRecord;
  error?: string;
  statusCode?: number;
}> {
  try {
    // 1. Check if global API status is enabled in appConfig/api
    try {
      const globalData = await getFirestoreDoc('appConfig/api');
      if (globalData && globalData.enabled === false) {
        return {
          valid: false,
          error: 'خدمة الـ API معطلة حالياً من قبل إدارة الموقع.',
          statusCode: 503,
        };
      }
    } catch (configErr) {
      console.warn('Could not check global API enable status:', configErr);
    }

    // 2. Extract key from headers
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const xApiKey = req.headers.get('x-api-key') || req.headers.get('X-API-KEY');

    let providedKey = xApiKey?.trim();

    if (!providedKey && authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.substring(7).trim();
      } else {
        providedKey = authHeader.trim();
      }
    }

    if (!providedKey) {
      return {
        valid: false,
        error: 'مفتاح الـ API مفقود. يرجى إرسال الهيدر X-API-Key أو Authorization: Bearer <YOUR_API_KEY>.',
        statusCode: 401,
      };
    }

    // 3. Check against global tool key in toolConfig/global if available
    try {
      const toolData = await getFirestoreDoc('toolConfig/global');
      if (toolData?.globalApiKey && toolData.globalApiKey.trim() === providedKey) {
        return {
          valid: true,
          keyRecord: {
            id: 'master-global-key',
            name: 'المفتاح الرئيسي (Global Master Key)',
            key: providedKey,
            active: true,
            createdAt: new Date().toISOString(),
          },
        };
      }
    } catch (e) {
      // Continue to check custom keys collection
    }

    // 4. Query Firestore `apiKeys` collection for matching key
    const matchingKeys = await queryFirestoreCollection('apiKeys', 'key', 'EQUAL', providedKey, 1);

    if (!matchingKeys || matchingKeys.length === 0) {
      return {
        valid: false,
        error: 'مفتاح الـ API غير صالح أو كود المفتاح خاطئ.',
        statusCode: 403,
      };
    }

    const keyData = matchingKeys[0] as ApiKeyRecord;

    if (!keyData.active) {
      return {
        valid: false,
        error: 'تم تعطيل مفتاح الـ API هذا من قبل الأدمن.',
        statusCode: 403,
      };
    }

    // Update usage asynchronously
    updateFirestoreFields(`apiKeys/${keyData.id}`, {
      lastUsedAt: new Date().toISOString(),
      usageCount: (keyData.usageCount || 0) + 1,
    }).catch((err) => console.error('Failed to update API key stats:', err));

    return {
      valid: true,
      keyRecord: keyData,
    };
  } catch (error: any) {
    console.error('API key validation error:', error);
    return {
      valid: false,
      error: 'حدث خطأ غير متوقع أثناء التحقق من صلاحية مفتاح الـ API.',
      statusCode: 500,
    };
  }
}
