import * as THREE from 'three';

// Lightweight procedural textures so we can ship "textured blocks" now.
// Later we can swap this for a real Minecraft texture atlas.

function makeCanvasTexture(base: string, accent: string, pattern: 'noise' | 'stripes' | 'speckle' = 'noise') {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  if (pattern === 'stripes') {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = accent;
    for (let y = 0; y < size; y += 6) {
      ctx.fillRect(0, y, size, 2);
    }
    ctx.globalAlpha = 1;
  } else {
    const count = pattern === 'speckle' ? 400 : 800;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = pattern === 'speckle' ? 1.6 : 1.1;
      ctx.fillStyle = Math.random() > 0.5 ? accent : 'rgba(0,0,0,0.12)';
      ctx.globalAlpha = pattern === 'speckle' ? 0.45 : 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export type MaterialKey = string;

const cache = new Map<MaterialKey, THREE.MeshStandardMaterial>();

export function getBlockMaterial(blockId: string, fallbackColor: string) {
  const key = blockId;
  const cached = cache.get(key);
  if (cached) return cached;

  // Basic stylised textures per block id (approx). Expand later.
  let tex: THREE.Texture;
  switch (blockId) {
    case 'minecraft:grass_block':
      tex = makeCanvasTexture('#3f7f3b', '#2a5b29', 'noise');
      break;
    case 'minecraft:dirt':
      tex = makeCanvasTexture('#6b4f2a', '#4f3a1f', 'speckle');
      break;
    case 'minecraft:sand':
      tex = makeCanvasTexture('#d7cf8a', '#bdb46e', 'speckle');
      break;
    case 'minecraft:stone':
      tex = makeCanvasTexture('#8b8b8b', '#6f6f6f', 'noise');
      break;
    case 'minecraft:cobblestone':
      tex = makeCanvasTexture('#7a7a7a', '#5b5b5b', 'speckle');
      break;
    case 'minecraft:deepslate':
      tex = makeCanvasTexture('#3e3e3e', '#2a2a2a', 'noise');
      break;
    case 'minecraft:oak_planks':
      tex = makeCanvasTexture('#b38b52', '#8a693f', 'stripes');
      break;
    case 'minecraft:oak_log':
      tex = makeCanvasTexture('#7f5a34', '#5c4024', 'stripes');
      break;
    case 'minecraft:glass':
      tex = makeCanvasTexture('#8cc7e8', '#bfe7ff', 'noise');
      break;
    default:
      tex = makeCanvasTexture(fallbackColor, '#ffffff', 'noise');
      break;
  }

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.92,
    metalness: 0.02,
    color: new THREE.Color(0xffffff),
    transparent: blockId === 'minecraft:glass',
    opacity: blockId === 'minecraft:glass' ? 0.55 : 1,
  });

  cache.set(key, mat);
  return mat;
}
