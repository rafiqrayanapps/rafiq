import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isFirebaseUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.startsWith('gs://') ||
    lower.includes('firebasestorage.googleapis.com') ||
    lower.includes('storage.googleapis.com') ||
    lower.includes('storage.cloud.google.com') ||
    lower.includes('console.firebase.google.com')
  );
}

export function convertFirebaseToDirectUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Handle gs:// protocol (e.g. gs://bucket-name/path/to/file.ext)
  if (trimmed.startsWith('gs://')) {
    const withoutGs = trimmed.substring(5);
    const slashIdx = withoutGs.indexOf('/');
    if (slashIdx !== -1) {
      const bucket = withoutGs.substring(0, slashIdx);
      const filePath = withoutGs.substring(slashIdx + 1);
      const encodedPath = encodeURIComponent(filePath);
      return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
    }
    return trimmed;
  }

  // 2. Handle Firebase Console Storage URLs (e.g. https://console.firebase.google.com/project/PROJECT/storage/BUCKET/files/~2Fpath~2Fto~2Ffile)
  if (trimmed.includes('console.firebase.google.com') && trimmed.includes('/storage/')) {
    try {
      const storageMatch = trimmed.match(/\/storage\/([^\/]+)\/files(?:\/~2F|\/)(.+?)(?:\?|$)/i);
      if (storageMatch) {
        const bucket = storageMatch[1];
        let rawPath = storageMatch[2];
        // Replace ~2F with /
        rawPath = rawPath.replace(/~2F/gi, '/');
        const decoded = decodeURIComponent(rawPath);
        const encodedPath = encodeURIComponent(decoded);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    } catch (e) {
      console.warn('Failed parsing Firebase console storage URL:', e);
    }
  }

  // 3. Handle storage.googleapis.com or storage.cloud.google.com
  if (trimmed.includes('storage.googleapis.com/') || trimmed.includes('storage.cloud.google.com/')) {
    try {
      const match = trimmed.match(/storage\.(?:cloud\.)?googleapis\.com\/([^\/]+)\/(.+)$/i);
      if (match) {
        const bucket = match[1];
        const rawPath = match[2].split('?')[0];
        const decoded = decodeURIComponent(rawPath);
        const encodedPath = encodeURIComponent(decoded);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
      }
    } catch (e) {
      console.warn('Failed parsing Google Cloud Storage URL:', e);
    }
  }

  // 4. Handle standard Firebase Storage URL (firebasestorage.googleapis.com)
  if (trimmed.includes('firebasestorage.googleapis.com')) {
    if (!trimmed.includes('alt=media')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}alt=media`;
    }
    return trimmed;
  }

  return trimmed;
}

export function isMediaFireUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('mediafire.com/file/') ||
    lower.includes('mediafire.com/download/') ||
    lower.includes('mediafire.com/view/') ||
    lower.includes('mediafire.com/?') ||
    lower.includes('mediafire.com/folder/') ||
    (lower.includes('download') && lower.includes('.mediafire.com/'))
  );
}

export function isMediaFireDirectUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /https?:\/\/download\d*\.mediafire\.com\//i.test(url.trim());
}

export async function resolveMediaFireUrl(url?: string): Promise<{ directUrl: string; permanentUrl?: string; filename?: string }> {
  if (!url || typeof url !== 'string') return { directUrl: '' };
  const trimmed = url.trim();
  if (!isMediaFireUrl(trimmed)) {
    return { directUrl: getDirectLink(trimmed) };
  }

  try {
    const res = await fetch('/api/resolve-mediafire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.directUrl) {
        return { directUrl: data.directUrl, permanentUrl: data.permanentUrl, filename: data.filename };
      }
    }
  } catch (err) {
    console.warn('Failed to resolve MediaFire direct link:', err);
  }

  return { directUrl: trimmed };
}

export function isPinterestUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.includes('pin.it/') ||
    lower.includes('pinterest.com') ||
    lower.includes('pinterest.co') ||
    lower.includes('pinterest.ca') ||
    lower.includes('pinterest.fr') ||
    lower.includes('pinterest.de') ||
    lower.includes('pinterest.es') ||
    lower.includes('pinterest.it') ||
    lower.includes('pinterest.jp') ||
    lower.includes('i.pinimg.com')
  );
}

export async function resolvePinterestUrl(url?: string): Promise<string> {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!isPinterestUrl(trimmed)) {
    return getDirectLink(trimmed);
  }

  // If already a direct i.pinimg.com image URL
  if (trimmed.includes('i.pinimg.com')) {
    return getDirectLink(trimmed);
  }

  try {
    const res = await fetch('/api/resolve-pinterest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.directUrl) {
        return data.directUrl;
      }
    }
  } catch (err) {
    console.warn('Failed to resolve Pinterest direct link:', err);
  }

  return trimmed;
}

export function getDirectLink(url?: string) {
  if (!url) return "";

  // Handle Firebase Storage URLs (gs://, console urls, alt=media, storage.googleapis.com)
  if (isFirebaseUrl(url)) {
    return convertFirebaseToDirectUrl(url);
  }

  // Handle Google Drive
  if (url.includes("drive.google.com") || url.includes("lh3.googleusercontent.com")) {
    const id = url.split("/d/")[1]?.split("/")[0] || url.split("id=")[1]?.split("&")[0];
    if (id) {
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
  }

  // Handle GitHub
  if (url.includes("github.com") && url.includes("/blob/")) {
    // Convert https://github.com/user/repo/blob/branch/path to https://raw.githubusercontent.com/user/repo/branch/path
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  // Handle Pinterest direct image link optimization (upgrade thumbnails to HD/Originals)
  if (url.includes("i.pinimg.com")) {
    // Upgrade 236x / 474x / 564x thumbnails to 736x or originals
    return url.replace(/i\.pinimg\.com\/(?:236x|474x|564x)\//i, 'i.pinimg.com/736x/');
  }

  // Handle Dropbox
  if (url.includes("dropbox.com") && (url.includes("dl=0") || url.includes("dl=1"))) {
    return url.replace("dl=0", "raw=1").replace("dl=1", "raw=1");
  }

  return url;
}

/**
 * Triggers direct browser file download for any URL (MediaFire, Firebase Storage, Google Drive, direct files, etc.)
 */
export async function triggerFileDownload(url?: string, filename?: string): Promise<void> {
  if (!url || typeof window === 'undefined') return;
  
  let targetUrl = url.trim();

  // If it's a MediaFire URL, ALWAYS resolve a brand new download key on demand
  if (isMediaFireUrl(targetUrl)) {
    try {
      const resolved = await resolveMediaFireUrl(targetUrl);
      if (resolved.directUrl) {
        targetUrl = resolved.directUrl;
        if (!filename && resolved.filename) {
          filename = resolved.filename;
        }

        // For MediaFire CDN direct links, trigger direct navigation/anchor
        // to ensure the single-use/session token is consumed natively by the browser
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = targetUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (filename) {
          a.download = filename;
        }
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 800);
        return;
      }
    } catch (e) {
      console.warn('Could not pre-resolve MediaFire URL before download:', e);
    }
  }

  const directUrl = getDirectLink(targetUrl);
  if (!directUrl) return;

  // Extract a sensible filename if not provided
  let finalFilename = filename;
  if (!finalFilename) {
    try {
      const u = new URL(directUrl);
      const parts = u.pathname.split('/');
      let lastPart = parts[parts.length - 1];
      if (lastPart) {
        lastPart = decodeURIComponent(lastPart).split('?')[0];
        if (lastPart.includes('/')) {
          lastPart = lastPart.substring(lastPart.lastIndexOf('/') + 1);
        }
        if (lastPart.trim()) {
          finalFilename = lastPart.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    // Attempt blob download to force browser save dialog / direct file downloading
    const response = await fetch(directUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      if (finalFilename) {
        a.download = finalFilename;
      }
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 500);
      return;
    }
  } catch (err) {
    // Fetch failed (CORS or network error), fallback to direct link click / window open
    console.warn('Direct blob download failed, falling back to direct anchor:', err);
  }

  // Fallback: Invisible anchor with download attribute or target _blank
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = directUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  if (finalFilename) {
    a.download = finalFilename;
  }
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 500);
}

// Keep the old name as alias for compatibility if needed, but we'll update usages
export const getDirectDriveLink = getDirectLink;

/**
 * Sanitizes URLs to prevent XSS (blocks javascript:, data:, vbscript: protocols)
 */
export function sanitizeUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:text/html') ||
    lower.startsWith('data:application') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '#';
  }

  return trimmed;
}

