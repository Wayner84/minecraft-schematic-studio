import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

const inPath = path.join('public', 'vite.svg');
if (!fs.existsSync(inPath)) {
  console.error('Missing', inPath);
  process.exit(1);
}

const outDir = path.join('public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Placeholder icons: use vite.svg for now. Replace later with your real app icon.
await sharp(inPath).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
await sharp(inPath).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));
await sharp(inPath).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'));

console.log('Generated placeholder PWA icons.');
