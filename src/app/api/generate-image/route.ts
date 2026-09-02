import { NextResponse } from 'next/server';
import { getFirestoreDoc } from '@/lib/serverFirestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;

    // 1. Fetch config from Firestore
    let modelId = '@google/imagen-4'; 

    try {
      const configData = await getFirestoreDoc('settings/ai_config');
      if (configData?.model_id) {
        modelId = configData.model_id;
      }
    } catch (err: any) {
      console.warn('Firestore fetch failed for ai_config:', err.message);
    }

    const rawAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const rawApiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!rawAccountId || !rawApiToken) {
      return NextResponse.json(
        { error: 'Cloudflare configuration (Account ID or API Token) is missing in environment variables.' },
        { status: 500 }
      );
    }

    // Helper to extract a valid-looking ID from a string (32 hex chars or last part of URL)
    const extractId = (str: string) => {
      const trimmed = str.trim();
      // Try to find a 32-char hex string
      const hexMatch = trimmed.match(/[a-f0-9]{32}/i);
      if (hexMatch) return hexMatch[0];
      
      // If it contains slashes, try to find the segment after 'accounts' or take the last one
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        const accIdx = parts.indexOf('accounts');
        if (accIdx !== -1 && parts[accIdx + 1]) return parts[accIdx + 1].split('?')[0].split('#')[0];
        return parts[parts.length - 1].split('?')[0].split('#')[0];
      }
      return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
    };

    const accountId = extractId(rawAccountId);
    const apiToken = rawApiToken.trim().split(' ')[rawApiToken.trim().split(' ').length - 1]; // Take last part if user pasted "Bearer ..."

    // Clean modelId (ensure no full URLs, path traversals or invalid characters)
    let finalModelId = (typeof modelId === 'string' ? modelId : '@google/imagen-4').trim();
    if (finalModelId.includes('${')) {
        finalModelId = '@google/imagen-4';
    }
    if (finalModelId.startsWith('http')) {
        const parts = finalModelId.split('/');
        const runIdx = parts.indexOf('run');
        if (runIdx !== -1 && parts[runIdx + 1]) {
            finalModelId = parts.slice(runIdx + 1).join('/');
        } else {
            finalModelId = parts[parts.length - 1];
        }
    }
    // Whitelist characters in modelId
    finalModelId = finalModelId.replace(/[^a-zA-Z0-9@/._-]/g, '');
    if (!finalModelId) {
      finalModelId = '@google/imagen-4';
    }

    // Sanitize and limit prompt length
    const cleanPrompt = typeof prompt === 'string' ? prompt.trim().slice(0, 1000) : "A high-quality 3D logo for Mohtawa brand";

    // Quality enhancements
    const finalPrompt = `${cleanPrompt || "A high-quality 3D logo for Mohtawa brand"}, high quality, 8k, cinematic lighting, masterpiece, highly detailed`;

    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${finalModelId}`;
    
    const response = await fetch(cfUrl,
      {
        headers: { 
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify({ prompt: finalPrompt }),
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to generate image via Cloudflare';
      try {
        const errorData = await response.json();
        errorMessage = errorData.errors?.[0]?.message || errorData.message || JSON.stringify(errorData) || errorMessage;
      } catch (e) {
        // fallback
      }
      return NextResponse.json({ 
        error: errorMessage,
        debug: { url: cfUrl }
      }, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      // Cloudflare sometimes returns { result: { image: "..." } } or similar
      if (data.result?.image) {
        return NextResponse.json({ image: `data:image/png;base64,${data.result.image}`, success: true });
      }
      return NextResponse.json(data);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = contentType || 'image/png';
      return NextResponse.json({ 
        image: `data:${mimeType};base64,${base64}`,
        success: true
      });
    }

  } catch (error: any) {
    console.error('Cloudflare Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
