import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates whether a given URL is a legitimate Pinterest hostname
 * and protects against SSRF (Server-Side Request Forgery).
 */
export function isSafePinterestUrl(url?: string): boolean {
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

    // Must strictly be pin.it, pinterest.* or pinimg.com
    const isPinIt = hostname === 'pin.it' || hostname.endsWith('.pin.it');
    const isPinterest =
      hostname === 'pinterest.com' ||
      hostname.endsWith('.pinterest.com') ||
      hostname === 'pinimg.com' ||
      hostname.endsWith('.pinimg.com') ||
      /^pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname) ||
      /^www\.pinterest\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname);

    return isPinIt || isPinterest;
  } catch {
    return false;
  }
}

/**
 * Checks if a string is a Pinterest URL (pin.it or pinterest.com)
 */
function isPinterestUrl(url: string): boolean {
  return isSafePinterestUrl(url);
}

/**
 * Attempts to upgrade a pinimg URL to the highest resolution (originals or 736x)
 */
async function upgradePinimgUrl(imgUrl: string): Promise<string> {
  if (!imgUrl || !imgUrl.includes('i.pinimg.com')) return imgUrl;

  // If it's 236x, 474x, 564x, or 736x, try 'originals' first
  const originalsUrl = imgUrl.replace(
    /i\.pinimg\.com\/(?:236x|474x|564x|736x)\//i,
    'i.pinimg.com/originals/'
  );

  if (originalsUrl !== imgUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const testRes = await fetch(originalsUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeoutId);
      if (testRes.ok) {
        return originalsUrl;
      }
    } catch {
      // If originals check fails or times out, fallback to 736x
    }
  }

  // Fallback: Ensure at least 736x if it was lower (236x, 474x, 564x)
  return imgUrl.replace(/i\.pinimg\.com\/(?:236x|474x|564x)\//i, 'i.pinimg.com/736x/');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url?.trim();

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!isSafePinterestUrl(rawUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: 'رابط غير صالح أو ليس من نطاق Pinterest المعتمد.',
          directUrl: rawUrl,
        },
        { status: 400 }
      );
    }

    // 1. If it's already an i.pinimg.com direct image URL
    if (rawUrl.includes('i.pinimg.com')) {
      const upgraded = await upgradePinimgUrl(rawUrl);
      return NextResponse.json({
        success: true,
        directUrl: upgraded,
        originalUrl: rawUrl,
      });
    }

    // 2. Resolve shortlink or pin URL
    let targetUrl = rawUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }


    // Fetch the Pinterest page with standard browser headers
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: fetchController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'ar,en-US,en;q=0.9',
      },
    });
    clearTimeout(fetchTimeout);

    const finalUrl = response.url || targetUrl;
    const html = await response.text();

    let extractedUrl: string | null = null;

    // Strategy A: OpenGraph / Twitter meta tags
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    if (ogMatch && ogMatch[1]) {
      extractedUrl = ogMatch[1];
    }

    // Strategy B: JSON-LD Schema
    if (!extractedUrl) {
      const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of jsonLdMatches) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed && typeof parsed.image === 'string') {
            extractedUrl = parsed.image;
            break;
          } else if (parsed && Array.isArray(parsed.image) && parsed.image[0]) {
            extractedUrl = parsed.image[0];
            break;
          }
        } catch {
          // Ignore JSON-LD parse errors
        }
      }
    }

    // Strategy C: Pinterest Relay / Initial State / __PWS_DATA__
    if (!extractedUrl) {
      const pwsMatch = html.match(/<script[^>]+id=["']__PWS_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (pwsMatch && pwsMatch[1]) {
        try {
          const pwsData = JSON.parse(pwsMatch[1]);
          // Recursively find highest quality image
          const findImagesInObj = (obj: any): string[] => {
            if (!obj || typeof obj !== 'object') return [];
            const results: string[] = [];
            if (typeof obj.url === 'string' && obj.url.includes('i.pinimg.com')) {
              results.push(obj.url);
            }
            for (const key of Object.keys(obj)) {
              if (typeof obj[key] === 'object') {
                results.push(...findImagesInObj(obj[key]));
              }
            }
            return results;
          };
          const found = findImagesInObj(pwsData);
          if (found.length > 0) {
            // Find one with originals or 736x
            const preferred =
              found.find((u) => u.includes('/originals/')) ||
              found.find((u) => u.includes('/736x/')) ||
              found.find((u) => u.includes('/564x/')) ||
              found[0];
            extractedUrl = preferred;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    // Strategy D: Global regex on HTML for i.pinimg.com links
    if (!extractedUrl) {
      const matches = Array.from(
        html.matchAll(/https:\/\/i\.pinimg\.com\/(originals|736x|564x|474x|236x)\/[a-zA-Z0-9_\-\.\/]+?\.(jpg|jpeg|png|webp|gif)/gi)
      ).map((m) => m[0]);

      if (matches.length > 0) {
        // Prioritize originals, then 736x, then 564x
        const unique = Array.from(new Set(matches));
        extractedUrl =
          unique.find((u) => u.includes('/originals/')) ||
          unique.find((u) => u.includes('/736x/')) ||
          unique.find((u) => u.includes('/564x/')) ||
          unique[0];
      }
    }

    if (!extractedUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not extract direct image from Pinterest URL',
          directUrl: rawUrl,
        },
        { status: 422 }
      );
    }

    // Upgrade to HD / 4K originals if available
    const highResDirectUrl = await upgradePinimgUrl(extractedUrl);

    return NextResponse.json({
      success: true,
      directUrl: highResDirectUrl,
      originalUrl: rawUrl,
      resolvedFrom: finalUrl,
    });
  } catch (err: any) {
    console.error('Error resolving Pinterest URL:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to resolve Pinterest link',
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

  // Forward to POST handler
  const dummyReq = new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ url }),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(dummyReq);
}
