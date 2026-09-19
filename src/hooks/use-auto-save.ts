'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveDraft, getDraft, clearDraft as removeDraft } from '@/lib/storage/auto-save';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'restored' | 'error';

interface UseAutoSaveOptions<T> {
  key: string;
  data: T;
  onRestore?: (data: T) => void;
  debounceMs?: number;
  enabled?: boolean;
  maxAgeMs?: number;
  autoRestore?: boolean;
  isValid?: (data: T) => boolean;
}

export function useAutoSaveDraft<T>({
  key,
  data,
  onRestore,
  debounceMs = 600,
  enabled = true,
  maxAgeMs,
  autoRestore = false,
  isValid,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [cachedDraft, setCachedDraft] = useState<T | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;

  // 1. On mount: check if there is an existing draft
  useEffect(() => {
    if (!key || !enabled) return;

    const existing = getDraft<T>(key, maxAgeMs);
    if (existing) {
      setHasDraft(true);
      setDraftSavedAt(existing.savedAt);
      setCachedDraft(existing.data);

      if (autoRestore && onRestoreRef.current) {
        onRestoreRef.current(existing.data);
        setStatus('restored');
      }
    }
  }, [key, enabled, maxAgeMs, autoRestore]);

  // 2. Debounced save when data changes
  useEffect(() => {
    // Skip saving on the very first mount so we don't overwrite existing drafts with empty initial states
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!enabled || !key) return;

    // Check validity condition
    if (isValid && !isValid(data)) {
      return;
    }

    setStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const ok = saveDraft(key, data);
      if (ok) {
        setStatus('saved');
        setHasDraft(true);
        setDraftSavedAt(Date.now());
        setCachedDraft(data);
      } else {
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [key, data, debounceMs, enabled, isValid]);

  // Explicit restore action
  const restore = useCallback(() => {
    if (cachedDraft && onRestoreRef.current) {
      onRestoreRef.current(cachedDraft);
      setStatus('restored');
    }
  }, [cachedDraft]);

  // Explicit clear draft action
  const clear = useCallback(() => {
    removeDraft(key);
    setHasDraft(false);
    setDraftSavedAt(null);
    setCachedDraft(null);
    setStatus('idle');
  }, [key]);

  // Force immediate save
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const ok = saveDraft(key, data);
    if (ok) {
      setStatus('saved');
      setHasDraft(true);
      setDraftSavedAt(Date.now());
      setCachedDraft(data);
    } else {
      setStatus('error');
    }
  }, [key, data]);

  return {
    status,
    hasDraft,
    draftSavedAt,
    cachedDraft,
    restoreDraft: restore,
    clearDraft: clear,
    saveNow,
  };
}
