const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

(async () => {
  const inPath = path.join('public', 'vite.svg');
  if (!fs.existsSync(inPath)) {
    console.error('Missing', inPath);
    process.exit(1);
  }

  const outDir = path.join('public', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  // Use vite logo as placeholder icon for now.
  await sharp(inPath).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
  await sharp(inPath).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));

  // Apple touch icon (180x180)
  await sharp(inPath).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'));

  console.log('Generated placeholder PWA icons.');
})();
