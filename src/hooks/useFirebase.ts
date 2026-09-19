'use client';

import { useMemo, useState, useEffect } from 'react';
import { collection, doc, query, orderBy, CollectionReference, Query, DocumentReference } from 'firebase/firestore';
import { useFirestore, useCollection as useCollectionBase, useDoc as useDocBase, useMemoFirebase, useUser, useAuth as useAuthBase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useUserProfile } from './use-user-profile';

export * from '@/firebase';
export { useUserProfile } from './use-user-profile';

/**
 * Compatibility hook for useAuth()
 */
export function useAuth() {
  const { user, isUserLoading, userError } = useUser();
  const { isAdmin, isEditor, isLoading: isProfileLoading } = useUserProfile();
  const auth = useAuthBase();

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const loginWithEmail = (email: string, pass: string) => 
    signInWithEmailAndPassword(auth, email, pass);

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (res.user) {
      await updateProfile(res.user, { displayName: name });
    }
    return res;
  };

  const logout = () => signOut(auth);

  return {
    user,
    isAdmin,
    isEditor,
    loading: isUserLoading || isProfileLoading,
    userError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  };
}

/**
 * Compatibility hook for useCollection(path)
 */
export function useCollection(path: string) {
  const firestore = useFirestore();
  const isPages = typeof path === 'string' && path.trim() === 'pages';

  const [fallbackPages, setFallbackPages] = useState<any[]>([]);

  useEffect(() => {
    if (isPages) {
      fetch('/api/pages')
        .then(async (res) => {
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return null;
          return res.json().catch(() => null);
        })
        .then((json) => {
          if (json && json.success && Array.isArray(json.pages)) {
            setFallbackPages(json.pages);
          }
        })
        .catch(() => {});
    }
  }, [isPages]);

  // If path is 'pages', route to appConfig/customPages to avoid 403 on remote database
  const pagesDocRef = useMemoFirebase(() => {
    if (!firestore || !isPages) return null;
    return doc(firestore, 'appConfig', 'customPages');
  }, [firestore, isPages]);

  const { data: pagesDocData, isLoading: pagesLoading } = useDocBase(pagesDocRef as any);

  const q = useMemoFirebase(() => {
    if (isPages) return null;
    if (!firestore || !path || typeof path !== 'string' || !path.trim()) return null;
    const cleanPath = path.trim().replace(/^\/+|\/+$/g, '');
    const segments = cleanPath.split('/').filter(Boolean);
    // Collections MUST have an odd number of segments (1, 3, 5...)
    if (segments.length % 2 === 0 || segments.some(s => s === 'undefined' || s === 'null')) {
      return null;
    }
    return query(collection(firestore, cleanPath));
  }, [firestore, path, isPages]);
  
  const { data, isLoading, error } = useCollectionBase(q as any);

  return useMemo(() => {
    if (isPages) {
      const list = (Array.isArray(pagesDocData?.pages) && pagesDocData.pages.length > 0)
        ? pagesDocData.pages
        : fallbackPages;
      return { data: list, loading: pagesLoading && fallbackPages.length === 0, error: null };
    }
    return { data, loading: isLoading, error };
  }, [isPages, pagesDocData, pagesLoading, fallbackPages, data, isLoading, error]);
}

/**
 * Compatibility hook for useDoc(pathOrCollection, docId)
 */
export function useDoc(pathOrCollection: string, docId?: string) {
  const firestore = useFirestore();
  const ref = useMemoFirebase(() => {
    if (!firestore || !pathOrCollection || typeof pathOrCollection !== 'string' || !pathOrCollection.trim()) return null;
    const cleanPath = pathOrCollection.trim().replace(/^\/+|\/+$/g, '');
    const cleanDocId = docId?.trim();
    
    if (cleanDocId) {
      if (cleanDocId === 'undefined' || cleanDocId === 'null') return null;
      return doc(firestore, cleanPath, cleanDocId);
    }
    
    // If only pathOrCollection is provided, it must have an even number of segments (doc reference)
    const segments = cleanPath.split('/').filter(Boolean);
    if (segments.length % 2 !== 0 || segments.some(s => s === 'undefined' || s === 'null')) {
      return null;
    }
    return doc(firestore, cleanPath);
  }, [firestore, pathOrCollection, docId]);
  
  const { data, isLoading, error } = useDocBase(ref as any);
  return useMemo(() => ({ data, loading: isLoading, error }), [data, isLoading, error]);
}
