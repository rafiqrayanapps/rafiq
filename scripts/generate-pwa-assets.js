const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 1. Generate high-resolution Master SVG for Rafiq Designer
const createSvg = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : size * 0.05;
  const innerSize = size - (padding * 2);
  const cx = size / 2;
  const cy = size / 2;

  // Modern SVG with blue/indigo gradient, geometric palette/sparkle icon, and refined accents
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
    <linearGradient id="softWhite" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#E0E7FF" stop-opacity="0.85" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.025}" flood-color="#000000" flood-opacity="0.25" />
    </filter>
  </defs>

  <!-- Full bleed background (ideal for both standard and maskable) -->
  <rect width="${size}" height="${size}" rx="${isMaskable ? 0 : size * 0.22}" fill="url(#bgGrad)" />

  <!-- Subtle glow ring -->
  <circle cx="${cx}" cy="${cy}" r="${innerSize * 0.48}" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="${size * 0.015}" />

  <!-- Central Graphic Group -->
  <g filter="url(#shadow)">
    <!-- Main Designer Palette Shape -->
    <path d="
      M ${cx - innerSize * 0.35} ${cy}
      C ${cx - innerSize * 0.35} ${cy - innerSize * 0.32}, ${cx - innerSize * 0.15} ${cy - innerSize * 0.38}, ${cx} ${cy - innerSize * 0.38}
      C ${cx + innerSize * 0.35} ${cy - innerSize * 0.38}, ${cx + innerSize * 0.38} ${cy - innerSize * 0.15}, ${cx + innerSize * 0.38} ${cy}
      C ${cx + innerSize * 0.38} ${cy + innerSize * 0.25}, ${cx + innerSize * 0.2} ${cy + innerSize * 0.38}, ${cx - innerSize * 0.05} ${cy + innerSize * 0.38}
      C ${cx - innerSize * 0.25} ${cy + innerSize * 0.38}, ${cx - innerSize * 0.35} ${cy + innerSize * 0.25}, ${cx - innerSize * 0.35} ${cy}
      Z
    " fill="url(#softWhite)" />

    <!-- Palette Swatches (Colors) -->
    <circle cx="${cx - innerSize * 0.18}" cy="${cy - innerSize * 0.15}" r="${innerSize * 0.055}" fill="#EF4444" />
    <circle cx="${cx - innerSize * 0.05}" cy="${cy - innerSize * 0.22}" r="${innerSize * 0.055}" fill="#F59E0B" />
    <circle cx="${cx + innerSize * 0.12}" cy="${cy - innerSize * 0.2}" r="${innerSize * 0.055}" fill="#10B981" />
    <circle cx="${cx + innerSize * 0.22}" cy="${cy - innerSize * 0.08}" r="${innerSize * 0.055}" fill="#06B6D4" />

    <!-- Central Thumb Hole -->
    <circle cx="${cx + innerSize * 0.15}" cy="${cy + innerSize * 0.15}" r="${innerSize * 0.06}" fill="#2563EB" opacity="0.9" />

    <!-- Stylized Pen / Brush Tip in Amber -->
    <path d="
      M ${cx - innerSize * 0.18} ${cy + innerSize * 0.08}
      L ${cx - innerSize * 0.02} ${cy + innerSize * 0.24}
      L ${cx - innerSize * 0.08} ${cy + innerSize * 0.3}
      L ${cx - innerSize * 0.24} ${cy + innerSize * 0.14}
      Z
    " fill="url(#accentGrad)" />

    <!-- Sparkle Stars -->
    <path d="
      M ${cx + innerSize * 0.28} ${cy - innerSize * 0.3}
      Q ${cx + innerSize * 0.28} ${cy - innerSize * 0.23} ${cx + innerSize * 0.35} ${cy - innerSize * 0.23}
      Q ${cx + innerSize * 0.28} ${cy - innerSize * 0.23} ${cx + innerSize * 0.28} ${cy - innerSize * 0.16}
      Q ${cx + innerSize * 0.28} ${cy - innerSize * 0.23} ${cx + innerSize * 0.21} ${cy - innerSize * 0.23}
      Q ${cx + innerSize * 0.28} ${cy - innerSize * 0.23} ${cx + innerSize * 0.28} ${cy - innerSize * 0.3}
      Z
    " fill="#FBBF24" />
  </g>
</svg>
`;
};

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Master SVG
  const svgContent = createSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');
  console.log('Saved icon.svg');

  // 2. Standard 192x192
  const svg192 = Buffer.from(createSvg(192, false));
  await sharp(svg192).png().toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Saved icon-192.png');

  // 3. Maskable 192x192 (safe margin)
  const svg192Mask = Buffer.from(createSvg(192, true));
  await sharp(svg192Mask).png().toFile(path.join(publicDir, 'icon-192-maskable.png'));
  console.log('Saved icon-192-maskable.png');

  // 4. Standard 512x512
  const svg512 = Buffer.from(createSvg(512, false));
  await sharp(svg512).png().toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Saved icon-512.png');

  // 5. Maskable 512x512
  const svg512Mask = Buffer.from(createSvg(512, true));
  await sharp(svg512Mask).png().toFile(path.join(publicDir, 'icon-512-maskable.png'));
  console.log('Saved icon-512-maskable.png');

  // 6. Apple touch icon 180x180
  const svg180 = Buffer.from(createSvg(180, false));
  await sharp(svg180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved apple-touch-icon.png');

  // 7. Favicon (PNG/ICO) 64x64
  const svg64 = Buffer.from(createSvg(64, false));
  await sharp(svg64).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Saved favicon.ico');

  console.log('All PWA assets generated successfully!');
}

generate().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
