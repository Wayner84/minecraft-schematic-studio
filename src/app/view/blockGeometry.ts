import * as THREE from 'three';
import { getTileUV, tilesForBlock, type TileId } from './atlas';

// Build a BoxGeometry with UVs mapped to our atlas per-face.
// BoxGeometry has 6 faces (2 triangles each) with 4 UVs per face.

const cache = new Map<string, THREE.BoxGeometry>();

function applyFaceUV(uv: THREE.BufferAttribute, faceIndex: number, tile: TileId) {
  const { u0, v0, u1, v1 } = getTileUV(tile);

  // Each face has 4 vertices => 8 floats in uv attribute.
  const i = faceIndex * 4;

  // Note: three.js V axis is bottom->top in UV space, but our atlas helper returns v0..v1
  // consistent for CanvasTexture; this mapping gives a stable orientation.
  uv.setXY(i + 0, u0, v1);
  uv.setXY(i + 1, u1, v1);
  uv.setXY(i + 2, u0, v0);
  uv.setXY(i + 3, u1, v0);
}

export function getBlockGeometry(blockId: string) {
  const key = blockId;
  const cached = cache.get(key);
  if (cached) return cached;

  const g = new THREE.BoxGeometry(1, 1, 1);
  const uv = g.attributes.uv as THREE.BufferAttribute;

  const tiles = tilesForBlock(blockId);

  // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  applyFaceUV(uv, 0, tiles.side);
  applyFaceUV(uv, 1, tiles.side);
  applyFaceUV(uv, 2, tiles.top);
  applyFaceUV(uv, 3, tiles.bottom);
  applyFaceUV(uv, 4, tiles.side);
  applyFaceUV(uv, 5, tiles.side);

  uv.needsUpdate = true;
  cache.set(key, g);
  return g;
}
