// Script de un solo uso: genera iconos placeholder "Liquid Glass" hasta que el usuario
// suba su propio logo. Ejecutar con: node scripts/generate-placeholder-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const roundedSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#c7d2fe"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.23}" fill="white" fill-opacity="0.6"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.23}" fill="none" stroke="white" stroke-opacity="0.85" stroke-width="${size * 0.012}"/>
</svg>`;

const maskableSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eef2ff"/>
      <stop offset="1" stop-color="#c7d2fe"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="white" fill-opacity="0.6"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.18}" fill="none" stroke="white" stroke-opacity="0.85" stroke-width="${size * 0.01}"/>
</svg>`;

async function render(svg, outPath, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log("Generado", outPath);
}

await mkdir("public/icons", { recursive: true });

await render(roundedSvg(192), "public/icons/icon-192.png", 192);
await render(roundedSvg(512), "public/icons/icon-512.png", 512);
await render(maskableSvg(512), "public/icons/icon-maskable-512.png", 512);
await render(roundedSvg(512), "app/icon.png", 512);
await render(roundedSvg(180), "app/apple-icon.png", 180);
