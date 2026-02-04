#!/usr/bin/env node
/**
 * Generate favicon and icon files from public/logo.png
 * Run: pnpm add -D sharp to-ico && node scripts/generate-icons.mjs
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const logoPath = join(publicDir, "logo.png");

if (!existsSync(logoPath)) {
  console.error("public/logo.png not found");
  process.exit(1);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Run: pnpm add -D sharp");
  process.exit(1);
}

const sizes = [
  { name: "favicon-16x16.png", width: 16, height: 16 },
  { name: "favicon-32x32.png", width: 32, height: 32 },
  { name: "icon-32x32.png", width: 32, height: 32 },
  { name: "icon-192x192.png", width: 192, height: 192 },
  { name: "apple-touch-icon.png", width: 180, height: 180 },
];

const buffer = readFileSync(logoPath);

for (const { name, width, height } of sizes) {
  const out = join(publicDir, name);
  await sharp(buffer)
    .resize(width, height)
    .png()
    .toFile(out);
  console.log("Generated:", name);
}

// favicon.ico (real ICO with 16, 32, 48)
try {
  const toIco = (await import("to-ico")).default;
  const icoSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(
    icoSizes.map((size) =>
      sharp(buffer).resize(size, size).png().toBuffer()
    )
  );
  const ico = await toIco(icoBuffers);
  writeFileSync(join(publicDir, "favicon.ico"), ico);
  console.log("Generated: favicon.ico");
} catch {
  console.log("Skipping favicon.ico (optional: pnpm add -D to-ico)");
}

// icon.svg: scalable reference to logo (browsers use /logo.png when resolving href)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <image href="/logo.png" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
</svg>`;
writeFileSync(join(publicDir, "icon.svg"), svgContent);
console.log("Generated: icon.svg");

console.log("Done.");
