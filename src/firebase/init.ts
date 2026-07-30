'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';

// Set Firestore log level to error to suppress benign idle gRPC stream cancellation warnings
try {
  setLogLevel('error');
} catch {
  // Ignore if already set or unsupported environment
}

async function testConnection(db: Firestore) {
  try {
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
  } catch (_error: any) {
    // Ignore background ping check silently
  }
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
    
    // Using initializeFirestore instead of getFirestore to allow passing settings
    // experimentalForceLongPolling is often necessary in proxied or restrictive environments
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    const firestore = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
      ignoreUndefinedProperties: true,
    }, dbId && dbId !== '(default)' ? dbId : undefined);
    
    // Delay the connection test slightly to allow network to stabilize
    setTimeout(() => testConnection(firestore), 2000);

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
