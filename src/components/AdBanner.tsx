'use client';

import { useDoc } from '@/hooks/useFirebase';

interface AdBannerProps {
  height?: string;
  className?: string;
}

export default function AdBanner({ height = '60px', className = '' }: AdBannerProps) {
  const { data: adsConfig, loading } = useDoc('appConfig', 'ads');

  if (loading || !adsConfig || !adsConfig.showAds || !adsConfig.adScript) {
    return null;
  }

  const scriptContent = adsConfig.adScript;

  // We wrap the ad script inside an isolated iframe's srcDoc.
  // This is the absolute best way to run Adsterra and other ad networks
  // when multiple ads of the exact same script are displayed on a single page,
  // because it isolates the 'container-xxx' ID and the invoke.js execution
  // within each iframe's local document context!
  const srcDocHtml = `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * {
            box-sizing: border-box;
          }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          #ad-container {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 50px;
          }
          /* Ensure any injected iframes or images are responsive */
          #ad-container iframe, #ad-container img {
            max-width: 100% !important;
          }
        </style>
      </head>
      <body>
        <div id="ad-container">
          ${scriptContent}
        </div>
      </body>
    </html>
  `;

  return (
    <div className={`w-full flex justify-center items-center my-0.5 animate-in fade-in duration-500 ${className}`}>
      <iframe
        srcDoc={srcDocHtml}
        title="Advertisement"
        width="100%"
        height={height}
        style={{ border: 'none', overflow: 'hidden', background: 'transparent' }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        className="w-full max-w-full transition-all duration-300"
      />
    </div>
  );
}
