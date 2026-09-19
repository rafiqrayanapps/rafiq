import DOMPurify from 'isomorphic-dompurify';
import { BlogPost } from './definitions';

/**
 * Validates if a Blogger URL is safe and not an internal network or SSRF target
 */
export function isSafeBloggerUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (url.length > 2048) return false;
  try {
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    const parsed = new URL(target);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // Block internal, loopback, private ranges, metadata, and raw IPs
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.includes('::') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes Blogger URL to ensure proper format and returns base and feed URLs
 */
export function normalizeBloggerUrl(rawUrl: string): { baseUrl: string; feedUrl: string } {
  let cleaned = (rawUrl || '').trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // If user entered a feed URL directly
  if (cleaned.includes('/feeds/posts/default')) {
    const baseMatch = cleaned.match(/^(https?:\/\/[^\/]+)/i);
    const baseUrl = baseMatch ? baseMatch[1] : cleaned;
    let feedUrl = cleaned;
    if (!feedUrl.includes('alt=json')) {
      feedUrl += (feedUrl.includes('?') ? '&' : '?') + 'alt=json&max-results=150';
    }
    return { baseUrl, feedUrl };
  }

  const baseUrl = cleaned;
  const feedUrl = `${cleaned}/feeds/posts/default?alt=json&max-results=150`;
  return { baseUrl, feedUrl };
}

/**
 * Upgrades Blogger thumbnails from tiny s72-c / s320 to high resolution s1600
 */
export function upgradeBloggerImage(imageUrl?: string): string {
  if (!imageUrl || typeof imageUrl !== 'string') return '';
  let url = imageUrl.trim();

  // If protocol-relative URL
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }

  // Common Blogger thumbnail patterns: /s72-c/, /s320/, /w72-h72-p-k-no-nu/, /s1600-w400/
  url = url.replace(/\/s[0-9]+(-c)?\//g, '/s1600/');
  url = url.replace(/\/w[0-9]+-h[0-9]+(-p-k-no-nu)?\//g, '/s1600/');
  url = url.replace(/\/s[0-9]+-w[0-9]+\//g, '/s1600/');

  return url;
}

/**
 * Extracts plain text excerpt from HTML content
 */
export function extractExcerpt(htmlContent: string, maxLength = 160): string {
  if (!htmlContent) return '';
  
  // Strip HTML tags
  const plainText = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + '...';
}

/**
 * Extracts all image URLs found in an HTML string
 */
export function extractImagesFromHtml(htmlContent: string): string[] {
  if (!htmlContent) return [];
  const images: string[] = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      const upgraded = upgradeBloggerImage(match[1]);
      if (!images.includes(upgraded)) {
        images.push(upgraded);
      }
    }
  }
  return images;
}

/**
 * Generates a clean URL-friendly slug from Arabic/English text
 */
export function generatePostSlug(title: string, externalId: string): string {
  const cleanTitle = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);

  const cleanId = (externalId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-8) || Math.random().toString(36).substring(2, 8);
  return cleanTitle ? `${cleanTitle}-${cleanId}` : cleanId;
}

/**
 * Sanitizes HTML content from Blogger to guarantee zero XSS while maintaining styling
 */
export function sanitizePostHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  const clean = DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'mark',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'img', 'a', 'span', 'div', 'iframe'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style',
      'width', 'height', 'frameborder', 'allowfullscreen', 'loading', 'referrerpolicy'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target', 'rel', 'loading', 'referrerpolicy'],
  });

  // Filter iframes: only allow YouTube and Vimeo embeds, strip any arbitrary or malicious iframes
  const iframeFiltered = clean.replace(/<iframe\b[^>]*>(.*?)<\/iframe>/gi, (match) => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i);
    if (!srcMatch || !srcMatch[1]) return '';
    const src = srcMatch[1];
    const isSafeEmbed = /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i.test(src);
    return isSafeEmbed ? match : '';
  });

  // Ensure all external links have target="_blank" and rel="noopener noreferrer"
  // And all images have loading="lazy" and referrerpolicy="no-referrer"
  return iframeFiltered
    .replace(/<a\s+(?![^>]*\btarget=)/gi, '<a target="_blank" rel="noopener noreferrer" ')
    .replace(/<img\s+(?![^>]*\bloading=)/gi, '<img loading="lazy" referrerpolicy="no-referrer" ');
}

/**
 * Parses a Blogger JSON feed object into structured BlogPost objects
 */
export function parseBloggerFeed(feedData: any, blogId: string, blogName: string): {
  title: string;
  description: string;
  posts: BlogPost[];
} {
  const feed = feedData?.feed;
  if (!feed) {
    throw new Error('تنسيق بيانات Blogger غير صالح أو لا يحتوي على تغذية.');
  }

  const blogTitle = feed.title?.$t || blogName;
  const blogDescription = feed.subtitle?.$t || '';
  const entries = feed.entry || [];

  const posts: BlogPost[] = entries.map((entry: any) => {
    // 1. Extract External ID
    const rawId = entry.id?.$t || '';
    const idMatch = rawId.match(/post-(\d+)/);
    const externalId = idMatch ? idMatch[1] : (rawId || Math.random().toString(36).substring(2));

    // 2. Extract Title
    const title = entry.title?.$t || 'بدون عنوان';

    // 3. Extract Content / Summary
    const rawContent = entry.content?.$t || entry.summary?.$t || '';
    const content = sanitizePostHtml(rawContent);
    const excerpt = extractExcerpt(rawContent, 160);

    // 4. Extract Images
    const extractedImages = extractImagesFromHtml(rawContent);
    let featuredImage = '';

    // Check media$thumbnail first
    if (entry.media$thumbnail?.url) {
      featuredImage = upgradeBloggerImage(entry.media$thumbnail.url);
    } else if (extractedImages.length > 0) {
      featuredImage = extractedImages[0];
    }

    // 5. Extract Dates
    const publishedAt = entry.published?.$t || new Date().toISOString();
    const updatedAt = entry.updated?.$t || publishedAt;

    // 6. Extract Original Post URL
    let originalUrl = '';
    if (Array.isArray(entry.link)) {
      const altLink = entry.link.find((l: any) => l.rel === 'alternate' && l.type === 'text/html') || entry.link[0];
      if (altLink && altLink.href) {
        originalUrl = altLink.href;
      }
    }

    // 7. Extract Labels / Categories
    const labels: string[] = [];
    if (Array.isArray(entry.category)) {
      entry.category.forEach((cat: any) => {
        if (cat.term && typeof cat.term === 'string') {
          const trimmed = cat.term.trim();
          if (trimmed && !labels.includes(trimmed)) {
            labels.push(trimmed);
          }
        }
      });
    }

    // 8. Extract Author
    let author = blogTitle;
    if (Array.isArray(entry.author) && entry.author[0]?.name?.$t) {
      author = entry.author[0].name.$t;
    }

    // Generate safe unique deterministic ID for Firestore upsert
    // Format: blogId_externalId
    const safeDocId = `${blogId}_${externalId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
    const slug = generatePostSlug(title, externalId);

    return {
      id: safeDocId,
      blogId,
      blogName: blogTitle,
      externalId,
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      images: extractedImages,
      publishedAt,
      updatedAt,
      originalUrl,
      labels,
      author,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    title: blogTitle,
    description: blogDescription,
    posts,
  };
}
