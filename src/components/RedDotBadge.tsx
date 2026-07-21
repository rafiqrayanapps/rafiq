'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Category as CategoryType } from '@/lib/definitions';

/**
 * Helper to determine if a category, subcategory, or item is considered "new"
 */
export function checkCategoryIsNew(
  cat?: Partial<CategoryType> | null,
  subCats?: (Partial<CategoryType> | null)[]
): boolean {
  if (!cat) return false;

  // 1. Explicit boolean flags
  if (cat.isNew === true || cat.hasNewContent === true) return true;

  // 2. Check recent creation timestamp (e.g. within last 3 days)
  if (cat.createdAt) {
    const createdTime = new Date(cat.createdAt).getTime();
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (!isNaN(createdTime) && (now - createdTime) < THREE_DAYS_MS && (now - createdTime) >= 0) {
      return true;
    }
  }

  // 3. Check if any subcategory is new
  if (subCats && subCats.length > 0) {
    return subCats.some(sub => sub ? checkCategoryIsNew(sub) : false);
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
