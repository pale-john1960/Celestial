// Rasterize scripts/celestial-icon.svg -> PWA icons in public/icons/
// Usage: bun scripts/make-icons.ts
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const svg = readFileSync("scripts/celestial-icon.svg");

mkdirSync("public/icons", { recursive: true });

// standard square icons (safe-zone content, rounded corners baked in)
for (const size of [192, 512]) {
  await sharp(svg, { density: 400 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`✓ public/icons/icon-${size}.png`);
}

// maskable: full-bleed square (corners filled), content in inner ~78%
// achieved by scaling down onto a full-bleed bg of the same night color
const MASK_BG = "#15130F";
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.8);
  const off = Math.round((size - inner) / 2);
  const content = await sharp(svg, { density: 400 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: MASK_BG },
  })
    .composite([{ input: content, left: off, top: off }])
    .png()
    .toFile(`public/icons/maskable-${size}.png`);
  console.log(`✓ public/icons/maskable-${size}.png`);
}

// apple-touch-icon: 180, full-bleed bg (iOS rounds it itself, no alpha)
{
  const size = 180;
  const inner = Math.round(size * 0.84);
  const off = Math.round((size - inner) / 2);
  const content = await sharp(svg, { density: 400 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: MASK_BG },
  })
    .composite([{ input: content, left: off, top: off }])
    .png()
    .toFile(`public/icons/apple-touch-icon.png`);
  console.log(`✓ public/icons/apple-touch-icon.png`);
}

// favicon: 48px
await sharp(svg, { density: 400 })
  .resize(48, 48)
  .png()
  .toFile(`public/icons/favicon-48.png`);
console.log(`✓ public/icons/favicon-48.png`);
