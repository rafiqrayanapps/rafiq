'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Category as CategoryType } from '@/lib/definitions';

const STORAGE_KEY = 'viewed_category_ids';

export function getViewedCategoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function markCategoryAsViewed(id: string) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const current = getViewedCategoryIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('viewed_categories_updated', { detail: id }));
    }
  } catch (error) {
    console.error('Error marking category as viewed:', error);
  }
}

export function useViewedCategories(): string[] {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    setViewedIds(getViewedCategoryIds());

    const handleUpdate = () => {
      setViewedIds(getViewedCategoryIds());
    };

    window.addEventListener('viewed_categories_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('viewed_categories_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return viewedIds;
}

/**
 * Helper to determine if a category, subcategory, or item is considered "new" and unviewed
 */
export function checkCategoryIsNew(
  cat?: Partial<CategoryType> | null,
  subCats?: (Partial<CategoryType> | null)[],
  providedViewedIds?: string[]
): boolean {
  if (!cat || !cat.id) return false;

  const viewedIds = providedViewedIds ?? getViewedCategoryIds();

  // If this category itself has been viewed, check if any subcategory has unviewed new content
  const isSelfViewed = viewedIds.includes(cat.id);

  // Check if any subcategory has new content and is not yet viewed
  let hasNewSubCats = false;
  if (subCats && subCats.length > 0) {
    hasNewSubCats = subCats.some(sub => {
      if (!sub || !sub.id) return false;
      return checkCategoryIsNew(sub, undefined, viewedIds);
    });
  }

  // If this category is already viewed by the user and there are no unviewed new subcategories, it is NOT new
  if (isSelfViewed && !hasNewSubCats) {
    return false;
  }

  // If not viewed yet, evaluate flags & creation timestamp
  if (!isSelfViewed) {
    if (cat.isNew === true || cat.hasNewContent === true) return true;

    if (cat.createdAt) {
      const createdTime = new Date(cat.createdAt).getTime();
      const now = Date.now();
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      if (!isNaN(createdTime) && (now - createdTime) < THREE_DAYS_MS && (now - createdTime) >= 0) {
        return true;
      }
    }
  }

  return hasNewSubCats;
}

interface RedDotBadgeProps {
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function RedDotBadge({
  showLabel = true,
  className = '',
  size = 'md',
  label = 'جديد'
}: RedDotBadgeProps) {
  const dotSizes = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 z-30 pointer-events-none select-none animate-in fade-in zoom-in-75 duration-300", className)}>
      <span className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80",
          dotSizes[size]
        )} />
        {/* Core vibrant red dot */}
        <span className={cn(
          "relative inline-flex rounded-full bg-gradient-to-tr from-red-600 via-red-500 to-rose-400 shadow-[0_0_10px_rgba(239,68,68,0.9)] border border-white/90 dark:border-gray-900/90",
          dotSizes[size]
        )} />
      </span>

      {showLabel && (
        <span className="text-[9px] font-black tracking-tight text-white bg-gradient-to-r from-red-600 to-rose-500 px-1.5 py-0.5 rounded-full shadow-md backdrop-blur-md border border-white/20 uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
