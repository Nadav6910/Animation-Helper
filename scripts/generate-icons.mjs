// Renders the PWA icon set from a single SVG source via sharp.
// Run with: `node scripts/generate-icons.mjs`
//
// Outputs:
//   public/icon-192.png         — Android home-screen tile
//   public/icon-512.png         — Splash screen
//   public/icon-maskable.png    — 512px with extra safe-zone padding so
//                                 platforms that round / clip the icon
//                                 still see the whole sparkle glyph
//   public/favicon.svg          — copy of the source for the browser tab

import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = join(root, 'public');

const ACCENT = '#7c5cff';
const ACCENT_DEEP = '#3c2882';

// Round-tile icon — gradient background with a stylised sparkle in the
// centre. Mirrors the brand mark already used in TopBar.
const sparkleSvg = (size, padRatio) => {
  const cx = size / 2;
  const sparkleScale = (1 - padRatio * 2) * 0.55;
  const armOuter = size * sparkleScale * 0.5;
  const armInner = armOuter * 0.18;
  // 4-pointed sparkle: long vertical + horizontal arm with a small
  // inner lobe between each.
  const points = [
    [cx, cx - armOuter],
    [cx + armInner, cx - armInner],
    [cx + armOuter, cx],
    [cx + armInner, cx + armInner],
    [cx, cx + armOuter],
    [cx - armInner, cx + armInner],
    [cx - armOuter, cx],
    [cx - armInner, cx - armInner],
  ]
    .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');
  // Two smaller side sparkles for visual rhythm.
  const sideArm = size * sparkleScale * 0.18;
  const sideOff = armOuter * 0.7;
  const sideSparkle = (sx, sy) => {
    const sideInner = sideArm * 0.18;
    return `polygon(${sx.toFixed(2)},${(sy - sideArm).toFixed(2)} ${(sx + sideInner).toFixed(2)},${(sy - sideInner).toFixed(2)} ${(sx + sideArm).toFixed(2)},${sy.toFixed(2)} ${(sx + sideInner).toFixed(2)},${(sy + sideInner).toFixed(2)} ${sx.toFixed(2)},${(sy + sideArm).toFixed(2)} ${(sx - sideInner).toFixed(2)},${(sy + sideInner).toFixed(2)} ${(sx - sideArm).toFixed(2)},${sy.toFixed(2)} ${(sx - sideInner).toFixed(2)},${(sy - sideInner).toFixed(2)})`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" />
      <stop offset="100%" stop-color="${ACCENT_DEEP}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="white" stop-opacity="0.25" />
      <stop offset="100%" stop-color="white" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)" />
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#glow)" />
  <polygon points="${points}" fill="white" />
  <polygon points="${cx + sideOff},${cx - sideArm} ${(cx + sideOff + sideArm * 0.18).toFixed(2)},${(cx - sideArm * 0.18).toFixed(2)} ${(cx + sideOff + sideArm).toFixed(2)},${cx} ${(cx + sideOff + sideArm * 0.18).toFixed(2)},${(cx + sideArm * 0.18).toFixed(2)} ${cx + sideOff},${cx + sideArm} ${(cx + sideOff - sideArm * 0.18).toFixed(2)},${(cx + sideArm * 0.18).toFixed(2)} ${(cx + sideOff - sideArm).toFixed(2)},${cx} ${(cx + sideOff - sideArm * 0.18).toFixed(2)},${(cx - sideArm * 0.18).toFixed(2)}" fill="white" opacity="0.7" />
  <polygon points="${cx - sideOff},${cx + sideArm * 0.6} ${(cx - sideOff + sideArm * 0.13).toFixed(2)},${(cx + sideArm * 0.6 - sideArm * 0.13).toFixed(2)} ${(cx - sideOff + sideArm * 0.7).toFixed(2)},${cx + sideArm * 0.6} ${(cx - sideOff + sideArm * 0.13).toFixed(2)},${(cx + sideArm * 0.6 + sideArm * 0.13).toFixed(2)} ${cx - sideOff},${cx + sideArm * 1.3} ${(cx - sideOff - sideArm * 0.13).toFixed(2)},${(cx + sideArm * 0.6 + sideArm * 0.13).toFixed(2)} ${(cx - sideOff - sideArm * 0.7).toFixed(2)},${cx + sideArm * 0.6} ${(cx - sideOff - sideArm * 0.13).toFixed(2)},${(cx + sideArm * 0.6 - sideArm * 0.13).toFixed(2)}" fill="white" opacity="0.55" />
  <!-- silence unused helper warning -->
  <!-- ${sideSparkle(0, 0).slice(0, 0)} -->
</svg>`;
};

await mkdir(publicDir, { recursive: true });

async function render(name, size, padRatio) {
  const svg = sparkleSvg(size, padRatio);
  const buf = Buffer.from(svg, 'utf-8');
  const outPath = join(publicDir, name);
  await sharp(buf).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`✓ ${name}`);
}

await render('icon-192.png', 192, 0.08);
await render('icon-512.png', 512, 0.08);
// Maskable icons need a larger safe-zone — the spec calls for 80%
// minimum visible area. Pad by 20% so the entire glyph stays inside the
// circular crop platforms apply.
await render('icon-maskable.png', 512, 0.2);

// Browser tab favicon — same artwork rendered at 32×32 in SVG so it stays
// crisp on retina without shipping a separate .ico bundle.
const favicon = sparkleSvg(32, 0.08);
await writeFile(join(publicDir, 'favicon.svg'), favicon, 'utf-8');
console.log('✓ favicon.svg');

console.log('\nAll PWA icons generated.');
