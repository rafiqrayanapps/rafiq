'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';

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
   
   const firestore = initializeFirestore(app, {
     experimentalForceLongPolling: true,
   }, (firebaseConfig as any).firestoreDatabaseId || '(default)');

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
