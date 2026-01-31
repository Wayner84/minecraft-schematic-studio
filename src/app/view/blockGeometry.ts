import * as THREE from 'three';
import { getTileUV, tilesForBlock, type TileId } from './atlas';

// BoxGeometry with per-face UVs into our atlas.
// This works for both procedural textures and resource-pack textures (atlas rebuilt from pack).

const cache = new Map<string, THREE.BoxGeometry>();

function setFaceUV(g: THREE.BoxGeometry, faceIndex: number, tile: TileId, opts: { flipV?: boolean } = {}) {
  // BoxGeometry uv attribute has 24 verts (4 per face) => 48 floats.
  // Face order: +x, -x, +y, -y, +z, -z
  const uvAttr = g.getAttribute('uv') as THREE.BufferAttribute;
  const a = uvAttr.array as unknown as number[];
  const { u0, v0, u1, v1 } = getTileUV(tile);

  const vv0 = opts.flipV ? v1 : v0;
  const vv1 = opts.flipV ? v0 : v1;

  const i = faceIndex * 8;
  // Default BoxGeometry UV layout per face: (0,1),(1,1),(0,0),(1,0)
  a[i + 0] = u0;
  a[i + 1] = vv1;
  a[i + 2] = u1;
  a[i + 3] = vv1;
  a[i + 4] = u0;
  a[i + 5] = vv0;
  a[i + 6] = u1;
  a[i + 7] = vv0;

  uvAttr.needsUpdate = true;
}

export function getBlockGeometry(blockId: string) {
  const cached = cache.get(blockId);
  if (cached) return cached;

  const g = new THREE.BoxGeometry(1, 1, 1);
  const t = tilesForBlock(blockId);

  // +x, -x, +z, -z are sides
  // Note: three.js UV origin vs our atlas authoring means side faces need a V flip
  // to keep textures oriented "right way up" (e.g. grass side has grass at the top).
  for (const face of [0, 1, 4, 5]) setFaceUV(g, face, t.side, { flipV: true });
  // +y is top, -y is bottom
  setFaceUV(g, 2, t.top);
  setFaceUV(g, 3, t.bottom);

  cache.set(blockId, g);
  return g;
}
