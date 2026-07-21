'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore, doc, getDocFromServer, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

async function testConnection(db: Firestore) {
  try {
    // Attempt to fetch a non-existent doc from server to verify connectivity
    await getDocFromServer(doc(db, 'test_connection', 'ping'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error?.message?.includes('offline') || error?.code === 'unavailable') {
      console.error("Firestore connection failed or unavailable. Check configuration/network.", error.message);
    } else {
      console.warn("Firestore connection test completed (may be empty or restricted, but reachable):", error.message);
    }
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
