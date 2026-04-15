'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import type { UserProfile, WhitelistEntry } from '@/lib/definitions';
import { useEffect, useState } from 'react';

export function useUserProfile() {
   const { user, isUserLoading: isAuthLoading } = useUser();
   const firestore = useFirestore();
   const auth = useAuth();
   const [isLoggingOut, setIsLoggingOut] = useState(false);
   const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>("dummy-fp");
   const [tempReferralCode, setTempReferralCode] = useState<string | null>("RF-DUMMY");

   // Auto sign-in anonymously if no user session exists
   useEffect(() => {
       if (!isAuthLoading && !user && !isLoggingOut && auth) {
           signInAnonymously(auth).catch(err => {
               console.warn("Anonymous auth restricted.", err);
           });
       }
   }, [user, isAuthLoading, auth, isLoggingOut]);

   const userProfileRef = useMemoFirebase(
       () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
       [firestore, user]
   );

   const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

   // Create user profile if it doesn't exist
   useEffect(() => {
       if (firestore && user && !isProfileLoading && deviceFingerprint && tempReferralCode && !userProfile) {
           const createProfile = async () => {
               try {
                   await setDoc(doc(firestore, 'users', user.uid), {
                       email: user.email || '',
                       displayName: user.displayName || (user.isAnonymous ? 'زائر' : 'مستخدم'),
                       status: 'approved',
                       createdAt: serverTimestamp(),
                       points: 0, 
                       referralCode: tempReferralCode,
                       referralCount: 0,
                       referredBy: null,
                       deviceFingerprint: deviceFingerprint
                   });
               } catch (err) {
                   console.error("Failed to auto-create user profile:", err);
               }
           };
           createProfile();
       }
   }, [firestore, user, isProfileLoading, userProfile, deviceFingerprint, tempReferralCode]);

   const whitelistRef = useMemoFirebase(
       () => (firestore && user?.email ? doc(firestore, 'whitelist', user.email.toLowerCase()) : null),
       [firestore, user?.email]
   );

   const { data: whitelistEntry, isLoading: isWhitelistLoading } = useDoc<WhitelistEntry>(whitelistRef);
   
   const isAdmin = whitelistEntry?.role === 'admin';
   const isEditor = whitelistEntry?.role === 'editor';

   const isPro = false;
   
   const isAccountActive = userProfile?.status === 'approved' || (user && user.isAnonymous);

   const isLoading = isAuthLoading || (user && !user.isAnonymous && (isProfileLoading || isWhitelistLoading));

   return { 
       user, 
       userProfile, 
       isPro, 
       isAdmin, 
       isEditor,
       isAccountActive,
       points: userProfile?.points ?? 0,
       isLoading
   };
}
