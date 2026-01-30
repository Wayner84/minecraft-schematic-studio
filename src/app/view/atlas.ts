import * as THREE from 'three';

// A lightweight, self-contained texture atlas.
// This is NOT Mojang/Minecraft artwork — it's procedural "Minecraft-style" tiles.
// Later: swap this for a user-supplied/resource-pack atlas.

export type TileId =
  | 'grass_top'
  | 'grass_side'
  | 'dirt'
  | 'stone'
  | 'cobble'
  | 'deepslate'
  | 'oak_planks'
  | 'oak_log_side'
  | 'oak_log_top'
  | 'sand'
  | 'glass';

type Atlas = {
  texture: THREE.Texture;
  tileSize: number;
  cols: number;
  map: Record<TileId, { col: number; row: number }>;
};

let atlas: Atlas | null = null;

function noiseTile(ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number, base: string, accent: string) {
  ctx.fillStyle = base;
  ctx.fillRect(x0, y0, size, size);
  for (let i = 0; i < 900; i++) {
    const x = x0 + Math.random() * size;
    const y = y0 + Math.random() * size;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = Math.random() > 0.55 ? accent : 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;
}

function stripesTile(ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number, base: string, accent: string) {
  ctx.fillStyle = base;
  ctx.fillRect(x0, y0, size, size);
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = accent;
  for (let y = 0; y < size; y += 3) ctx.fillRect(x0, y0 + y, size, 1);
  ctx.globalAlpha = 1;
}

function glassTile(ctx: CanvasRenderingContext2D, x0: number, y0: number, size: number) {
  ctx.fillStyle = '#9ed6ff';
  ctx.fillRect(x0, y0, size, size);
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#d9f2ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 1, y0 + 1, size - 2, size - 2);
  ctx.beginPath();
  ctx.moveTo(x0 + 2, y0 + 2);
  ctx.lineTo(x0 + size - 2, y0 + size - 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function createAtlas(): Atlas {
  const tileSize = 16;
  const cols = 8;
  const rows = 2;
  const canvas = document.createElement('canvas');
  canvas.width = cols * tileSize;
  canvas.height = rows * tileSize;
  const ctx = canvas.getContext('2d')!;

  const map: Atlas['map'] = {
    grass_top: { col: 0, row: 0 },
    grass_side: { col: 1, row: 0 },
    dirt: { col: 2, row: 0 },
    stone: { col: 3, row: 0 },
    cobble: { col: 4, row: 0 },
    deepslate: { col: 5, row: 0 },
    oak_planks: { col: 6, row: 0 },
    sand: { col: 7, row: 0 },

    oak_log_side: { col: 0, row: 1 },
    oak_log_top: { col: 1, row: 1 },
    glass: { col: 2, row: 1 },
  };

  // Row 0
  noiseTile(ctx, 0 * tileSize, 0, tileSize, '#3f7f3b', '#2a5b29'); // grass_top
  // grass_side: green top edge + dirt body
  noiseTile(ctx, 1 * tileSize, 0, tileSize, '#6b4f2a', '#4f3a1f');
  ctx.fillStyle = 'rgba(63,127,59,0.95)';
  ctx.fillRect(1 * tileSize, 0, tileSize, 4);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#2a5b29';
  for (let i = 0; i < 30; i++) ctx.fillRect(1 * tileSize + Math.random() * tileSize, Math.random() * 4, 1, 1);
  ctx.globalAlpha = 1;

  noiseTile(ctx, 2 * tileSize, 0, tileSize, '#6b4f2a', '#4f3a1f'); // dirt
  noiseTile(ctx, 3 * tileSize, 0, tileSize, '#8b8b8b', '#6f6f6f'); // stone
  noiseTile(ctx, 4 * tileSize, 0, tileSize, '#7a7a7a', '#5b5b5b'); // cobble
  noiseTile(ctx, 5 * tileSize, 0, tileSize, '#3e3e3e', '#2a2a2a'); // deepslate
  stripesTile(ctx, 6 * tileSize, 0, tileSize, '#b38b52', '#8a693f'); // planks
  noiseTile(ctx, 7 * tileSize, 0, tileSize, '#d7cf8a', '#bdb46e'); // sand

  // Row 1
  stripesTile(ctx, 0 * tileSize, 1 * tileSize, tileSize, '#7f5a34', '#5c4024'); // log side
  // log top: ring
  ctx.fillStyle = '#a67a45';
  ctx.fillRect(1 * tileSize, 1 * tileSize, tileSize, tileSize);
  ctx.strokeStyle = '#6b4f2a';
  ctx.globalAlpha = 0.35;
  for (let r = 3; r < 8; r += 2) {
    ctx.beginPath();
    ctx.arc(1 * tileSize + 8, 1 * tileSize + 8, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  glassTile(ctx, 2 * tileSize, 1 * tileSize, tileSize);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  return { texture: tex, tileSize, cols, map };
}

function getAtlas(): Atlas {
  if (!atlas) atlas = createAtlas();
  return atlas;
}

export function getAtlasTexture() {
  return getAtlas().texture;
}

export function getTileUV(tile: TileId) {
  const a = getAtlas();
  const { col, row } = a.map[tile];
  const u0 = (col * a.tileSize) / (a.cols * a.tileSize);
  const v0 = (row * a.tileSize) / (2 * a.tileSize);
  const u1 = ((col + 1) * a.tileSize) / (a.cols * a.tileSize);
  const v1 = ((row + 1) * a.tileSize) / (2 * a.tileSize);
  return { u0, v0, u1, v1 };
}

export function tilesForBlock(blockId: string): { top: TileId; bottom: TileId; side: TileId } {
  switch (blockId) {
    case 'minecraft:grass_block':
      return { top: 'grass_top', bottom: 'dirt', side: 'grass_side' };
    case 'minecraft:dirt':
      return { top: 'dirt', bottom: 'dirt', side: 'dirt' };
    case 'minecraft:sand':
      return { top: 'sand', bottom: 'sand', side: 'sand' };
    case 'minecraft:stone':
      return { top: 'stone', bottom: 'stone', side: 'stone' };
    case 'minecraft:cobblestone':
      return { top: 'cobble', bottom: 'cobble', side: 'cobble' };
    case 'minecraft:deepslate':
      return { top: 'deepslate', bottom: 'deepslate', side: 'deepslate' };
    case 'minecraft:oak_planks':
      return { top: 'oak_planks', bottom: 'oak_planks', side: 'oak_planks' };
    case 'minecraft:oak_log':
      return { top: 'oak_log_top', bottom: 'oak_log_top', side: 'oak_log_side' };
    case 'minecraft:glass':
      return { top: 'glass', bottom: 'glass', side: 'glass' };
    default:
      // fallback to "stone" look rather than random textures
      return { top: 'stone', bottom: 'stone', side: 'stone' };
  }
}
