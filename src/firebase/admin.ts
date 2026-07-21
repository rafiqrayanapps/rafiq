import admin from 'firebase-admin';
import { firebaseConfig } from './config';

const getSharedAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Use credentials from firebase-applet-config.json if available
  // In this environment, we usually don't have a service account key file, 
  // but we can use the default credential or just initialize with project ID
  return admin.initializeApp({
    projectId: firebaseConfig.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'rafiq-87f88',
    storageBucket: firebaseConfig.storageBucket,
  });
};

export const adminDb = getSharedAdminApp().firestore();
export const adminAuth = getSharedAdminApp().auth();
