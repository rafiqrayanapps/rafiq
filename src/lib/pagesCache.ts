import { CustomPage } from '@/lib/definitions';

export const initialPages: CustomPage[] = [
  {
    id: 'official-channel',
    title: 'قناة التحديثات والملحقات',
    url: 'https://t.me/artbag_app',
    icon: 'Send',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'privacy-policy',
    title: 'سياسة الخصوصية والشروط',
    url: 'https://policies.google.com/privacy',
    icon: 'ShieldCheck',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Global in-memory cache
const globalForPages = globalThis as unknown as {
  _pagesCache: CustomPage[];
};

if (!globalForPages._pagesCache) {
  globalForPages._pagesCache = [...initialPages];
}

export function getCachedPages(): CustomPage[] {
  return globalForPages._pagesCache;
}

export function saveCachedPage(page: CustomPage): void {
  const existing = globalForPages._pagesCache;
  const idx = existing.findIndex((p) => p.id === page.id || p.slug === page.slug);
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...page };
  } else {
    existing.push(page);
  }
}

export function deleteCachedPage(slugOrId: string): boolean {
  const prevLen = globalForPages._pagesCache.length;
  globalForPages._pagesCache = globalForPages._pagesCache.filter(
    (p) => p.id !== slugOrId && p.slug !== slugOrId
  );
  return globalForPages._pagesCache.length < prevLen;
}
