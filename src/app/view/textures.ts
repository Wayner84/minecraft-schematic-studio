import * as THREE from 'three';
import { getAtlasTexture, getAtlasSource, getPackVersion } from './atlas';

export type MaterialKey = string;

type Mats = THREE.MeshStandardMaterial;

// Cache materials. We invalidate when the atlas changes (resource pack load/reset).
const matCache = new Map<MaterialKey, Mats>();
let seenPackVersion = -1;
let seenAtlasSource: string | null = null;

function baseMat(opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    // Slightly less rough so directional lights read a bit better (especially on mobile).
    roughness: 0.85,
    metalness: 0.02,
    color: new THREE.Color(0xffffff),
    ...opts,
  });
}

export function getBlockMaterial(blockId: string, _fallbackColor: string): Mats {
  // Invalidate on atlas changes
  const pv = getPackVersion();
  const src = getAtlasSource();
  if (pv !== seenPackVersion || src !== seenAtlasSource) {
    seenPackVersion = pv;
    seenAtlasSource = src;
    matCache.clear();
  }

  const key = `${src}:${blockId}`;
  const cached = matCache.get(key);
  if (cached) return cached;

  const atlasTex = getAtlasTexture();

  // Single material, UVs are baked into geometry per block.
  const mat = baseMat({
    map: atlasTex,
    transparent: blockId === 'minecraft:glass',
    opacity: blockId === 'minecraft:glass' ? 0.55 : 1,
  });

  matCache.set(key, mat);
  return mat;
}
