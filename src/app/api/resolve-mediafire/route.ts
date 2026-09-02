import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates whether a given URL is a legitimate MediaFire hostname
 * and protects against SSRF (Server-Side Request Forgery).
 */
export function isSafeMediaFireUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 2048) return false;
  
  try {
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    const parsed = new URL(target);
    
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prevent loopback, metadata services, and local IPs
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }

    // Must strictly be mediafire.com or a valid subdomain
    return hostname === 'mediafire.com' || hostname.endsWith('.mediafire.com');
  } catch {
    return false;
  }
}

/**
 * Checks if a string is a MediaFire URL
 */
export function isMediaFireUrl(url?: string): boolean {
  return isSafeMediaFireUrl(url);
}

/**
 * Checks if a URL is already a direct MediaFire download CDN link
 */
export function isMediaFireDirectUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!isSafeMediaFireUrl(url)) return false;
  return /https?:\/\/download\d*\.mediafire\.com\//i.test(url.trim());
}

/**
 * Converts any MediaFire URL (including expired CDN links) into the permanent web page link
 */
export function toPermanentMediaFireUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  
  // Match standard /file/KEY or /download/KEY or /view/KEY
  const fileMatch = trimmed.match(/mediafire\.com\/(?:file|download|view)\/([a-zA-Z0-9]+)/i);
  if (fileMatch && fileMatch[1]) {
    return `https://www.mediafire.com/file/${fileMatch[1]}/file`;
  }

  // Match /?KEY
  const queryMatch = trimmed.match(/mediafire\.com\/\?([a-zA-Z0-9]+)/i);
  if (queryMatch && queryMatch[1]) {
    return `https://www.mediafire.com/file/${queryMatch[1]}/file`;
  }

  // Match CDN links: downloadXXX.mediafire.com/token/KEY/filename or downloadXXX.mediafire.com/KEY/filename
  const cdnMatch = trimmed.match(/download\d*\.mediafire\.com\/(?:[^\/]+\/)?([a-zA-Z0-9]{8,32})/i);
  if (cdnMatch && cdnMatch[1]) {
    return `https://www.mediafire.com/file/${cdnMatch[1]}/file`;
  }

  let target = trimmed;
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://${target}`;
  }
  return target;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url?.trim();

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isSafeMediaFireUrl(rawUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'رابط غير صالح أو ليس من نطاق MediaFire المعتمد.',
          directUrl: rawUrl,
        },
        { status: 400 }
      );
    }

    // Always convert to permanent web page to resolve fresh download key
    const targetUrl = toPermanentMediaFireUrl(rawUrl);

    // Fetch the MediaFire page with realistic browser headers
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 8000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: fetchController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    clearTimeout(fetchTimeout);

    const finalUrl = response.url || targetUrl;
    const html = await response.text();

    let directDownloadUrl: string | null = null;
    let filename: string | null = null;

    // Strategy 1: Match download button with id="downloadButton" or aria-label="Download file"
    const downloadButtonMatch =
      html.match(/<a[^>]+id=["']downloadButton["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<a[^>]+href=["']([^"']+)["'][^>]+id=["']downloadButton["']/i) ||
      html.match(/<a[^>]+aria-label=["']Download file["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<a[^>]+href=["']([^"']+)["'][^>]+aria-label=["']Download file["']/i) ||
      html.match(/<a[^>]+class=["'][^"']*input popsok[^"']*["'][^>]+href=["']([^"']+)["']/i);

    if (downloadButtonMatch && downloadButtonMatch[1]) {
      const candidate = downloadButtonMatch[1].trim();
      if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
        directDownloadUrl = candidate;
      }
    }

    // Strategy 2: Match any download\d*.mediafire.com link in href
    if (!directDownloadUrl) {
      const cdnMatch = html.match(/href=["'](https?:\/\/download\d*\.mediafire\.com\/[^"']+)["']/i);
      if (cdnMatch && cdnMatch[1]) {
        directDownloadUrl = cdnMatch[1].trim();
      }
    }

    // Strategy 3: Match JavaScript variables (kNO, DLP_Url, window.location.href)
    if (!directDownloadUrl) {
      const jsMatch =
        html.match(/(?:kNO|DLP_Url|g_download_url)\s*=\s*["'](https?:\/\/[^"']+)["']/i) ||
        html.match(/window\.location\.href\s*=\s*["'](https?:\/\/download\d*\.mediafire\.com\/[^"']+)["']/i) ||
        html.match(/"download_url":\s*"([^"]+)"/i);
      if (jsMatch && jsMatch[1]) {
        directDownloadUrl = jsMatch[1].trim().replace(/\\\//g, '/');
      }
    }

    // Extract filename
    const filenameMatch =
      html.match(/<div[^>]+class=["']filename["'][^>]*>([\s\S]*?)<\/div>/i) ||
      html.match(/<div[^>]+class=["'][^"']*dl-btn-label[^"']*["'][^>]*title=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);

    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
      filename = extractFilenameFromUrl(targetUrl);
    }

    if (!directDownloadUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract direct download URL from MediaFire page',
          directUrl: targetUrl,
          filename,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      directUrl: directDownloadUrl,
      permanentUrl: targetUrl,
      originalUrl: rawUrl,
      filename,
      resolvedFrom: finalUrl,
    });
  } catch (err: any) {
    console.error('Error resolving MediaFire URL:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to resolve MediaFire link',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(dummyReq);
}

function extractFilenameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // Typical path: /file/KEY/FILENAME/file or /file/KEY/FILENAME
    if (parts.length >= 3 && parts[0] === 'file') {
      const candidate = parts[2] === 'file' ? parts[1] : parts[2];
      return decodeURIComponent(candidate);
    }
    const last = parts[parts.length - 1];
    if (last && last !== 'file') {
      return decodeURIComponent(last);
    }
  } catch {
    // ignore
  }
  return 'downloaded_file';
}
