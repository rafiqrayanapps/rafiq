import admin from 'firebase-admin';
import { firebaseConfig } from './config';

let sharedApp: admin.app.App | null = null;

const getSharedAdminApp = () => {
  if (sharedApp) return sharedApp;
  if (admin.apps.length > 0) {
    sharedApp = admin.apps[0]!;
    return sharedApp;
  }

  // Without service account credentials in Cloud Run, Admin SDK gRPC calls fail with PERMISSION_DENIED.
  // Only attempt initialization if explicit service account credentials or emulator is configured.
  const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG || process.env.FIRESTORE_EMULATOR_HOST;
  if (!hasCredentials) {
    return null;
  }

  try {
    sharedApp = admin.initializeApp({
      projectId: firebaseConfig.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'rafiq-87f88',
      storageBucket: firebaseConfig.storageBucket,
    });
    return sharedApp;
  } catch (e) {
    console.warn("Firebase Admin SDK initialization skipped (no credentials provided):", e);
    return null;
  }
};

export const getAdminDb = () => {
  const app = getSharedAdminApp();
  return app ? app.firestore() : null;
};

export const getAdminAuth = () => {
  const app = getSharedAdminApp();
  return app ? app.auth() : null;
};

// Backwards compatibility proxy/lazy getters
export const adminDb = {
  collection: (...args: any[]) => (getAdminDb() as any)?.collection(...args),
  doc: (...args: any[]) => (getAdminDb() as any)?.doc(...args),
};
export const adminAuth = {
  getUser: (...args: any[]) => (getAdminAuth() as any)?.getUser(...args),
  verifyIdToken: (...args: any[]) => (getAdminAuth() as any)?.verifyIdToken(...args),
};
