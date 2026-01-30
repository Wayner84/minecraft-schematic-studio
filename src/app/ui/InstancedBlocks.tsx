import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { getBlockById } from '../data/blockPalette';
import { getBlockMaterial } from '../view/textures';
import { getBlockGeometry } from '../view/blockGeometry';
import type { LayerEditorState } from './LayerEditor';

type Group = { id: string; color: string; positions: Array<[number, number, number]> };

function buildGroups(state: LayerEditorState): Group[] {
  const groups = new Map<string, Group>();
  for (const [y, layer] of state.layers.entries()) {
    for (const [k, id] of layer.entries()) {
      if (id === 'minecraft:air') continue;
      const [xs, zs] = k.split(',');
      const x = Number(xs);
      const z = Number(zs);
      const b = getBlockById(id);
      let g = groups.get(id);
      if (!g) {
        g = { id, color: b.color, positions: [] };
        groups.set(id, g);
      }
      // shift to block-center
      g.positions.push([x + 0.5, y + 0.5, z + 0.5]);
    }
  }
  return Array.from(groups.values());
}

export function InstancedBlocks({ state, shadows }: { state: LayerEditorState; shadows: boolean }) {
  const groups = useMemo(() => buildGroups(state), [state]);
  // Geometry is per block-type now (per-face UVs into the atlas)
  return (
    <>
      {groups.map((g) => (
        <InstancedGroup key={g.id} group={g} shadows={shadows} />
      ))}
    </>
  );
}


function InstancedGroup({
  group,
  shadows,
}: {
  group: Group;
  shadows: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const geom = useMemo(() => getBlockGeometry(group.id), [group.id]);
  const mat = useMemo(() => getBlockMaterial(group.id, group.color), [group.id, group.color]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < group.positions.length; i++) {
      const [x, y, z] = group.positions[i];
      m.identity();
      m.setPosition(x, y, z);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [group.positions]);

  return (
    <instancedMesh
      ref={ref}
      args={[geom, mat, group.positions.length]}
      castShadow={shadows}
      receiveShadow={shadows}
    />
  );
}
