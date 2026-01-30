import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import type { LayerEditorState } from './LayerEditor';
import './Viewer3D.css';
import { InstancedBlocks } from './InstancedBlocks';

type Props = {
  state: LayerEditorState;
  shadows: boolean;
};

function useBounds(state: LayerEditorState) {
  return useMemo(() => {
    let has = false;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const [y, layer] of state.layers.entries()) {
      for (const [k, id] of layer.entries()) {
        if (id === 'minecraft:air') continue;
        const [xs, zs] = k.split(',');
        const x = Number(xs);
        const z = Number(zs);
        has = true;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      }
    }

    if (!has) {
      return { center: { x: 64, y: 16, z: 64 }, radius: 40 };
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const dx = (maxX - minX) + 1;
    const dy = (maxY - minY) + 1;
    const dz = (maxZ - minZ) + 1;
    const radius = Math.max(dx, dy, dz) * 1.2;

    return { center: { x: cx, y: cy, z: cz }, radius };
  }, [state]);
}

export function Viewer3D({ state, shadows }: Props) {
  const { center, radius } = useBounds(state);

  return (
    <div className="viewerWrap">
      <Canvas shadows={shadows} camera={{ position: [center.x + radius, center.y + radius, center.z + radius], fov: 50 }}>
        <color attach="background" args={['#0b0f14']} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[center.x + 60, center.y + 80, center.z + 40]}
          intensity={0.9}
          castShadow={shadows}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* ground (shifted down so it doesn't cut blocks at y=0) */}
        <mesh rotation-x={-Math.PI / 2} position={[center.x + 0.5, -0.5, center.z + 0.5]} receiveShadow={shadows}>
          <planeGeometry args={[512, 512]} />
          <meshStandardMaterial color="#0f1822" />
        </mesh>

        <InstancedBlocks state={state} shadows={shadows} />

        <OrbitControls makeDefault target={[center.x, center.y, center.z]} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
