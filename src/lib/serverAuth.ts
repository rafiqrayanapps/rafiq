import { NextRequest } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import { getAdminAuth } from '@/firebase/admin';
import { getFirestoreDoc } from '@/lib/serverFirestore';

export interface VerifiedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const SUPER_ADMIN_EMAIL = 'artbag.rayanapp@gmail.com';

export async function verifyAdminRequest(req: NextRequest): Promise<{ user: VerifiedUser | null; error?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'مطلوب تسجيل الدخول بصلاحية مدير (Authorization header missing)' };
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return { user: null, error: 'رمز المصادقة غير صالح' };
  }

  try {
    let uid = '';
    let email = '';
    let emailVerified = false;

    // 1. Try Firebase Admin if available
    const adminAuthInstance = getAdminAuth();
    if (adminAuthInstance) {
      try {
        const decoded = await adminAuthInstance.verifyIdToken(idToken);
        uid = decoded.uid;
        email = (decoded.email || '').toLowerCase().trim();
        emailVerified = !!decoded.email_verified;
      } catch (adminErr) {
        console.warn('Firebase Admin verifyIdToken fallback to Identity Toolkit:', adminErr);
      }
    }

    // 2. If not verified by Admin SDK, verify using Google Identity Toolkit REST API
    if (!uid) {
      const apiKey = firebaseConfig.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
      if (!apiKey) {
        return { user: null, error: 'مفتاح API غير متوفر للتحقق' };
      }

      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        return { user: null, error: 'جلسة المصادقة غير صالحة أو منتهية الصلاحية' };
      }

      const data = await res.json();
      const userRecord = data.users?.[0];
      if (!userRecord) {
        return { user: null, error: 'المستخدم غير موجود' };
      }

      uid = userRecord.localId;
      email = (userRecord.email || '').toLowerCase().trim();
      emailVerified = !!userRecord.emailVerified;
    }

    if (!emailVerified) {
      return { user: null, error: 'البريد الإلكتروني غير مفعّل' };
    }

    const isSuperAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

    // Check whitelist if not superAdmin
    let isWhitelistedAdmin = false;
    if (!isSuperAdmin) {
      try {
        const whitelistDoc = await getFirestoreDoc(`whitelist/${uid}`);
        if (whitelistDoc && (whitelistDoc.role === 'admin' || whitelistDoc.role === 'editor')) {
          isWhitelistedAdmin = true;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!isSuperAdmin && !isWhitelistedAdmin) {
      return { user: null, error: 'غير مصرح لك بإجراء هذه العملية (صلاحيات غير كافية)' };
    }

    return {
      user: {
        uid,
        email,
        emailVerified,
        isAdmin: isSuperAdmin || isWhitelistedAdmin,
        isSuperAdmin,
      }
    };
  } catch (err: any) {
    console.error('Error in verifyAdminRequest:', err);
    return { user: null, error: 'فشل التحقق من صلاحيات المدير' };
  }
}
