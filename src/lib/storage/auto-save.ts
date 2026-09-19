'use client';

/**
 * RAFIQ SMART AUTO-SAVE & CLIENT STORAGE UTILITIES
 * Safe, debounced, quota-resilient storage for user drafts and input states.
 * Strictly adheres to security rules: never stores passwords, tokens, or credentials.
 */

const DRAFT_PREFIX = 'rafiq_draft_';
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'credentials',
  'privateKey'
]);

export interface DraftEnvelope<T> {
  data: T;
  savedAt: number;
  version: number;
}

export interface DraftSummary {
  key: string;
  originalKey: string;
  savedAt: number;
  sizeBytes: number;
}

export interface StorageEstimateInfo {
  localStorageBytes: number;
  localStorageKB: number;
  quotaBytes?: number;
  usageBytes?: number;
  cacheStorageSupported: boolean;
  indexedDBSupported: boolean;
}

/**
 * Filter out any accidentally passed sensitive credentials before persisting
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!SENSITIVE_KEYS.has(k.toLowerCase())) {
      clean[k] = typeof v === 'object' && v !== null ? sanitizeData(v) : v;
    }
  }
  return clean;
}

/**
 * Save draft with quota management and timestamp
 */
export function saveDraft<T>(key: string, data: T): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (data === null || data === undefined) {
      clearDraft(key);
      return true;
    }

    // Don't save empty string or empty object
    if (typeof data === 'string' && data.trim() === '') {
      clearDraft(key);
      return true;
    }
    if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data as object).length === 0) {
      clearDraft(key);
      return true;
    }

    const sanitized = sanitizeData(data);
    const envelope: DraftEnvelope<T> = {
      data: sanitized,
      savedAt: Date.now(),
      version: 1,
    };

    const storageKey = `${DRAFT_PREFIX}${key}`;
    const serialized = JSON.stringify(envelope);

    try {
      window.localStorage.setItem(storageKey, serialized);
      return true;
    } catch (e: any) {
      // Quota exceeded: prune stale drafts older than 3 days and retry once
      if (e?.name === 'QuotaExceededError' || e?.code === 22) {
        pruneExpiredDrafts(3 * 24 * 60 * 60 * 1000);
        window.localStorage.setItem(storageKey, serialized);
        return true;
      }
      return false;
    }
  } catch (err) {
    console.warn('[AutoSave] Failed to save draft for key:', key, err);
    return false;
  }
}

/**
 * Retrieve saved draft if not expired
 */
export function getDraft<T>(key: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): { data: T; savedAt: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const storageKey = `${DRAFT_PREFIX}${key}`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;

    const envelope = JSON.parse(raw) as DraftEnvelope<T>;
    if (!envelope || !envelope.savedAt) return null;

    // Check expiration
    if (Date.now() - envelope.savedAt > maxAgeMs) {
      window.localStorage.removeItem(storageKey);
      return null;
    }

    return {
      data: envelope.data,
      savedAt: envelope.savedAt,
    };
  } catch (err) {
    console.warn('[AutoSave] Failed to load draft for key:', key, err);
    return null;
  }
}

/**
 * Remove a specific draft
 */
export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
  } catch {}
}

/**
 * Prune drafts older than threshold
 */
export function pruneExpiredDrafts(maxAgeMs = 7 * 24 * 60 * 60 * 1000): number {
  if (typeof window === 'undefined') return 0;
  let removedCount = 0;
  try {
    const now = Date.now();
    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (storageKey && storageKey.startsWith(DRAFT_PREFIX)) {
        try {
          const raw = window.localStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.savedAt && now - parsed.savedAt > maxAgeMs) {
              window.localStorage.removeItem(storageKey);
              removedCount++;
            }
          }
        } catch {
          window.localStorage.removeItem(storageKey);
          removedCount++;
        }
      }
    }
  } catch {}
  return removedCount;
}

/**
 * Clear all auto-saved drafts
 */
export function clearAllDrafts(): number {
  if (typeof window === 'undefined') return 0;
  let count = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(DRAFT_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      window.localStorage.removeItem(k);
      count++;
    });
  } catch {}
  return count;
}

/**
 * Get summary list of all current drafts
 */
export function getAllDraftsSummary(): DraftSummary[] {
  if (typeof window === 'undefined') return [];
  const summaries: DraftSummary[] = [];

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const storageKey = window.localStorage.key(i);
      if (storageKey && storageKey.startsWith(DRAFT_PREFIX)) {
        const raw = window.localStorage.getItem(storageKey) || '';
        try {
          const parsed = JSON.parse(raw);
          summaries.push({
            key: storageKey,
            originalKey: storageKey.replace(DRAFT_PREFIX, ''),
            savedAt: parsed.savedAt || Date.now(),
            sizeBytes: raw.length * 2, // UTF-16 approx
          });
        } catch {}
      }
    }
  } catch {}

  return summaries.sort((a, b) => b.savedAt - a.savedAt);
}

/**
 * Get storage estimate for client
 */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  let localStorageBytes = 0;
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i) || '';
        const value = window.localStorage.getItem(key) || '';
        localStorageBytes += (key.length + value.length) * 2;
      }
    } catch {}
  }

  let quotaBytes: number | undefined;
  let usageBytes: number | undefined;

  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      quotaBytes = est.quota;
      usageBytes = est.usage;
    } catch {}
  }

  return {
    localStorageBytes,
    localStorageKB: Math.round(localStorageBytes / 1024),
    quotaBytes,
    usageBytes,
    cacheStorageSupported: typeof window !== 'undefined' && 'caches' in window,
    indexedDBSupported: typeof window !== 'undefined' && 'indexedDB' in window,
  };
}

/**
 * Clear service worker cache on demand
 */
export async function clearServiceWorkerCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    // Notify active Service Worker to clear its caches
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }

    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    return true;
  } catch (err) {
    console.warn('[Cache] Failed to clear SW caches:', err);
    return false;
  }
}
