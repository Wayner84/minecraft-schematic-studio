import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import { getBlockById } from '../data/blockPalette';
import type { LayerEditorState } from './LayerEditor';
import './Viewer3D.css';

type Props = {
  state: LayerEditorState;
  shadows: boolean;
};

type BlockInstance = { x: number; y: number; z: number; color: string };

function useInstances(state: LayerEditorState) {
  return useMemo(() => {
    const out: BlockInstance[] = [];
    for (const [y, layer] of state.layers.entries()) {
      for (const [k, id] of layer.entries()) {
        const [xs, zs] = k.split(',');
        const x = Number(xs);
        const z = Number(zs);
        const b = getBlockById(id);
        if (id !== 'minecraft:air') out.push({ x, y, z, color: b.color });
      }
    }
    return out;
  }, [state]);
}

export function Viewer3D({ state, shadows }: Props) {
  const instances = useInstances(state);

  // rough center
  const center = useMemo(() => {
    if (!instances.length) return { x: 64, y: 16, z: 64 };
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const p of instances) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
  }, [instances]);

  return (
    <div className="viewerWrap">
      <Canvas shadows={shadows} camera={{ position: [center.x + 40, center.y + 40, center.z + 40], fov: 50 }}>
        <color attach="background" args={['#0b0f14']} />

        <ambientLight intensity={0.6} />
        <directionalLight
          position={[center.x + 60, center.y + 80, center.z + 40]}
          intensity={0.9}
          castShadow={shadows}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* ground */}
        <mesh rotation-x={-Math.PI / 2} position={[center.x, 0, center.z]} receiveShadow={shadows}>
          <planeGeometry args={[256, 256]} />
          <meshStandardMaterial color="#0f1822" />
        </mesh>

        {instances.map((p, idx) => (
          <mesh key={idx} position={[p.x, p.y, p.z]} castShadow={shadows} receiveShadow={shadows}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={p.color} />
          </mesh>
        ))}

        <OrbitControls makeDefault target={[center.x, center.y, center.z]} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
