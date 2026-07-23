'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Category as CategoryType } from '@/lib/definitions';

const STORAGE_KEY_CATEGORIES = 'viewed_category_ids';
const STORAGE_KEY_TIMESTAMPS = 'viewed_category_timestamps';
const STORAGE_KEY_ITEMS = 'viewed_item_ids';

export function getViewedCategoryIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = window.localStorage.getItem(STORAGE_KEY_CATEGORIES);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function getViewedCategoryTimestamps(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const item = window.localStorage.getItem(STORAGE_KEY_TIMESTAMPS);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
}

export function getViewedItemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = window.localStorage.getItem(STORAGE_KEY_ITEMS);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function markCategoryAsViewed(id: string, items?: { id: string }[]) {
  if (typeof window === 'undefined' || !id) return;
  try {
    const current = getViewedCategoryIds();
    const updated = current.includes(id) ? current : [...current, id];
    window.localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(updated));

    const timestamps = getViewedCategoryTimestamps();
    timestamps[id] = Date.now();
    window.localStorage.setItem(STORAGE_KEY_TIMESTAMPS, JSON.stringify(timestamps));

    if (items && items.length > 0) {
      const currentItems = getViewedItemIds();
      const newItemIds = items.map(i => i.id).filter(Boolean);
      const updatedItems = Array.from(new Set([...currentItems, ...newItemIds]));
      window.localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updatedItems));
    }

    window.dispatchEvent(new CustomEvent('viewed_categories_updated', { detail: id }));
  } catch (error) {
    console.error('Error marking category as viewed:', error);
  }
}

export function markItemAsViewed(itemId: string) {
  if (typeof window === 'undefined' || !itemId) return;
  try {
    const current = getViewedItemIds();
    if (!current.includes(itemId)) {
      const updated = [...current, itemId];
      window.localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('viewed_categories_updated', { detail: itemId }));
    }
  } catch (error) {
    console.error('Error marking item as viewed:', error);
  }
}

export interface ViewedCategoriesData {
  viewedIds: string[];
  timestamps: Record<string, number>;
  viewedItemIds: string[];
}

export function useViewedCategories(): ViewedCategoriesData {
  const [data, setData] = useState<ViewedCategoriesData>({
    viewedIds: [],
    timestamps: {},
    viewedItemIds: []
  });

  useEffect(() => {
    const sync = () => {
      setData({
        viewedIds: getViewedCategoryIds(),
        timestamps: getViewedCategoryTimestamps(),
        viewedItemIds: getViewedItemIds()
      });
    };

    sync();

    window.addEventListener('viewed_categories_updated', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('viewed_categories_updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return data;
}

/**
 * Check if a specific item (post) is considered "new" and unviewed
 */
export function checkItemIsNew(
  item: any,
  providedViewedItemIds?: string[],
  categoryViewTimestamp?: number
): boolean {
  if (!item || !item.id) return false;

  const viewedItemIds = providedViewedItemIds ?? getViewedItemIds();
  if (viewedItemIds.includes(item.id)) return false;

  const itemCreatedAtTime = item.createdAt ? new Date(item.createdAt).getTime() : 0;
  if (categoryViewTimestamp && itemCreatedAtTime > 0 && categoryViewTimestamp >= itemCreatedAtTime) {
    return false;
  }

  if (item.isNew === true) return true;

  if (itemCreatedAtTime > 0) {
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if ((now - itemCreatedAtTime) < THREE_DAYS_MS && (now - itemCreatedAtTime) >= 0) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to determine if a category, subcategory, or item is considered "new" and unviewed
 */
export function checkCategoryIsNew(
  cat?: Partial<CategoryType> | null,
  subCats?: (Partial<CategoryType> | null)[],
  providedData?: ViewedCategoriesData | string[],
  items?: any[]
): boolean {
  if (!cat || !cat.id) return false;

  let viewedIds: string[] = [];
  let timestamps: Record<string, number> = {};
  let viewedItemIds: string[] = [];

  if (Array.isArray(providedData)) {
    viewedIds = providedData;
    timestamps = getViewedCategoryTimestamps();
    viewedItemIds = getViewedItemIds();
  } else if (providedData) {
    viewedIds = providedData.viewedIds ?? getViewedCategoryIds();
    timestamps = providedData.timestamps ?? getViewedCategoryTimestamps();
    viewedItemIds = providedData.viewedItemIds ?? getViewedItemIds();
  } else {
    viewedIds = getViewedCategoryIds();
    timestamps = getViewedCategoryTimestamps();
    viewedItemIds = getViewedItemIds();
  }

  const categoryViewTime = timestamps[cat.id] || 0;
  const isSelfViewed = viewedIds.includes(cat.id);

  // 1. Check items inside if passed
  if (items && items.length > 0) {
    const hasNewItem = items.some(item => checkItemIsNew(item, viewedItemIds, categoryViewTime));
    if (hasNewItem) return true;
  }

  // 2. Check if subcategories have unviewed new content
  if (subCats && subCats.length > 0) {
    const hasNewSub = subCats.some(sub => {
      if (!sub || !sub.id) return false;
      return checkCategoryIsNew(sub, undefined, { viewedIds, timestamps, viewedItemIds });
    });
    if (hasNewSub) return true;
  }

  // 3. Check content timestamps (lastContentAddedAt or createdAt or updatedAt)
  const lastAdded = (cat as any).lastContentAddedAt;
  if (lastAdded) {
    const t = new Date(lastAdded).getTime();
    if (!isNaN(t) && t > categoryViewTime) {
      return true;
    }
  }

  const catCreated = cat.createdAt;
  if (catCreated) {
    const t = new Date(catCreated).getTime();
    if (!isNaN(t) && t > categoryViewTime) {
      return true;
    }
  }

  const catUpdated = cat.updatedAt;
  if (catUpdated) {
    const t = new Date(catUpdated).getTime();
    if (!isNaN(t) && t > categoryViewTime) {
      return true;
    }
  }

  // 4. If never viewed before
  if (!isSelfViewed || categoryViewTime === 0) {
    if (cat.isNew === true || cat.hasNewContent === true) return true;

    if (catCreated) {
      const createdTime = new Date(catCreated).getTime();
      const now = Date.now();
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      if (!isNaN(createdTime) && (now - createdTime) < THREE_DAYS_MS && (now - createdTime) >= 0) {
        return true;
      }
    }
  }

  return false;
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
