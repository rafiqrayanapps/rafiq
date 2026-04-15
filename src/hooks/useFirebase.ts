'use client';

import { useMemo } from 'react';
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
  const q = useMemoFirebase(() => {
    if (!firestore || !path) return null;
    return query(collection(firestore, path));
  }, [firestore, path]);
  
  const result = useCollectionBase(q as any);
  return { ...result, loading: result.isLoading };
}

/**
 * Compatibility hook for useDoc(pathOrCollection, docId)
 */
export function useDoc(pathOrCollection: string, docId?: string) {
  const firestore = useFirestore();
  const ref = useMemoFirebase(() => {
    if (!firestore || !pathOrCollection) return null;
    return docId ? doc(firestore, pathOrCollection, docId) : doc(firestore, pathOrCollection);
  }, [firestore, pathOrCollection, docId]);
  
  const result = useDocBase(ref as any);
  return { ...result, loading: result.isLoading };
}
