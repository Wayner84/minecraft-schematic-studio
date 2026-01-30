import * as THREE from 'three';
import { getAtlasTexture } from './atlas';

export type MaterialKey = string;

const cache = new Map<MaterialKey, THREE.MeshStandardMaterial>();

export function getBlockMaterial(blockId: string, _fallbackColor: string) {
  const key = blockId;
  const cached = cache.get(key);
  if (cached) return cached;

  const tex = getAtlasTexture();

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
