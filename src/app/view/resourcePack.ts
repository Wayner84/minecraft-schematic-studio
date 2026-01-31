import { unzipSync } from 'fflate';

// Minimal resource-pack loader (client-side) for *user-provided* packs.
// We do not ship Mojang textures in-repo; user selects their own pack zip.

export type PackPngMap = Map<string, Uint8Array>;

function normalizePath(p: string) {
  return p.replace(/\\/g, '/').replace(/^\//, '');
}

export async function readResourcePackZip(file: File): Promise<PackPngMap> {
  const ab = await file.arrayBuffer();
  const unzip = unzipSync(new Uint8Array(ab));
  const out: PackPngMap = new Map();

  for (const [rawPath, data] of Object.entries(unzip)) {
    const p = normalizePath(rawPath);
    if (!p.toLowerCase().endsWith('.png')) continue;
    out.set(p, data);
  }

  return out;
}

export function findPng(map: PackPngMap, path: string): Uint8Array | null {
  const p = normalizePath(path);
  return map.get(p) ?? map.get(p.toLowerCase()) ?? null;
}

export async function pngToBitmap(png: Uint8Array): Promise<ImageBitmap> {
  // Blob typing is picky about ArrayBuffer vs SharedArrayBuffer, so slice to a plain ArrayBuffer.
  // Force-copy into a plain ArrayBuffer to satisfy TS (avoids SharedArrayBuffer typing).
  const ab = png.slice().buffer as ArrayBuffer;
  const blob = new Blob([ab], { type: 'image/png' });
  return await createImageBitmap(blob);
}
