'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, setLogLevel } from 'firebase/firestore';

// Set Firestore log level to silent to suppress benign temporary offline/reconnection console warnings
try {
  setLogLevel('silent');
} catch {
  // Ignore if already set or unsupported environment
}

export const initializeFirebase = (() => {
  let firebaseServices: {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null = null;

  return () => {
    if (firebaseServices) {
      return firebaseServices;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    let firestore: Firestore;

    try {
      firestore = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      }, dbId && dbId !== '(default)' ? dbId : undefined);
    } catch {
      firestore = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
    }

    firebaseServices = {
      firebaseApp: app,
      auth,
      firestore,
    };

    return firebaseServices;
  };
})();

// Direct exports for convenience
const services = initializeFirebase();
export const db = services.firestore;
export const auth = services.auth;
export const app = services.firebaseApp;

