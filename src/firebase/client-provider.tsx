'use client';

import React, { ReactNode } from 'react';
import { initializeFirebase } from './init';
import { FirebaseProvider } from './provider';

let cachedServices: ReturnType<typeof initializeFirebase> | null = null;

function getServices() {
  if (!cachedServices) {
    cachedServices = initializeFirebase();
  }
  return cachedServices;
}

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const services = getServices();

  return (
    <FirebaseProvider
      firebaseApp={services.firebaseApp}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
