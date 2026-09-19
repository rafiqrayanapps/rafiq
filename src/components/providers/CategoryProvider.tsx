'use client';

import React, { createContext, useContext, useMemo, ReactNode, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, onSnapshot, limit, orderBy } from 'firebase/firestore';
import type { Category as CategoryType } from '@/lib/definitions';

interface CategoryContextType {
 allCategories: WithId<CategoryType>[] | null;
 mainCategories: WithId<CategoryType>[];
 subCategories: Map<string, WithId<CategoryType>[]>;
 categoryMap: Map<string, WithId<CategoryType>>;
 isLoadingCategories: boolean;
 isBackgroundLoading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
 const firestore = useFirestore();
 const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

 // 1. Fetch All Categories
 const categoriesQuery = useMemoFirebase(
   () => {
     if (!firestore) return null;
     return query(collection(firestore, 'categories'), orderBy('order', 'asc'));
   },
   [firestore]
 );
 const { data: rawCategories, isLoading: isLoadingCategories } = useCollection<CategoryType>(categoriesQuery);

 // 2. Process Categories into Maps and Lists
 const processedCategories = useMemo(() => {
   if (!rawCategories || !Array.isArray(rawCategories)) {
     return { 
       allCategories: null, 
       mainCategories: [], 
       subCategories: new Map<string, WithId<CategoryType>[]>(), 
       categoryMap: new Map<string, WithId<CategoryType>>() 
     };
   }
   
   const main: WithId<CategoryType>[] = [];
   const sub = new Map<string, WithId<CategoryType>[]>();
   const catMap = new Map<string, WithId<CategoryType>>();

   rawCategories.forEach(cat => {
       catMap.set(cat.id, cat);
       
       // Detect main vs sub based on common fields or conventions
       // Assuming top-level categories have no parentId property in this app's architecture
       // @ts-ignore
       const parentId = cat.parentId || cat.categoryId || null;
       
       if (parentId && parentId !== "undefined" && parentId !== "null" && parentId !== "") {
           if (!sub.has(parentId)) sub.set(parentId, []);
           if (!cat.isHidden) {
             sub.get(parentId)!.push(cat);
           }
       } else {
           if (!cat.isHidden) {
             main.push(cat);
           }
       }
   });

   return { allCategories: rawCategories, mainCategories: main, subCategories: sub, categoryMap: catMap };
 }, [rawCategories]);

 const { allCategories, mainCategories, subCategories, categoryMap } = processedCategories;

 // 3. Background Pre-fetching Logic (Simple & Safe)
 useEffect(() => {
   if (!firestore || !mainCategories.length) return;

   const firstCatId = mainCategories[0]?.id;
   if (!firstCatId) return;

   // Pre-fetch some items of the primary category to warm the cache
   const q = query(collection(firestore, 'categories', firstCatId, 'items'), limit(20));
   const unsub = onSnapshot(q, () => {}, () => {});

   return () => unsub();
 }, [firestore, mainCategories]);

 const value = {
   allCategories,
   mainCategories,
   subCategories,
   categoryMap,
   isLoadingCategories,
   isBackgroundLoading,
 };

 return (
   <CategoryContext.Provider value={value}>
     {children}
   </CategoryContext.Provider>
 );
}

export function useCategories() {
 const context = useContext(CategoryContext);
 if (context === undefined) {
   throw new Error('useCategories must be used within a CategoryProvider');
 }
 return context;
}
