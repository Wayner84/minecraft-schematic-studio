import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
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
  const isMobile = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 980px)').matches;
  const shadowMapSize = isMobile ? 1024 : 2048;

  return (
    <div className="viewerWrap">
      <Canvas
        shadows={shadows}
        camera={{ position: [center.x + radius * 0.85, center.y + radius * 0.85, center.z + radius * 0.85], fov: 50 }}
        onCreated={({ gl }) => {
          // Improve perceived brightness/contrast on mobile without heavy postprocessing.
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = isMobile ? 1.25 : 1.1;
        }}
      >
        <color attach="background" args={['#0b0f14']} />

        {/* A little sky/ground fill to avoid the “flat + dark” look */}
        <hemisphereLight args={['#cfe6ff', '#132032', 0.85]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[center.x + 60, center.y + 80, center.z + 40]}
          intensity={1.05}
          castShadow={shadows}
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
        />
        {/* Soft rim/fill (no shadows) */}
        <directionalLight position={[center.x - 80, center.y + 40, center.z - 60]} intensity={0.35} />

        {/* ground (shifted down so it doesn't cut blocks at y=0) */}
        <mesh rotation-x={-Math.PI / 2} position={[center.x + 0.5, -0.5, center.z + 0.5]} receiveShadow={shadows}>
          <planeGeometry args={[512, 512]} />
          <meshStandardMaterial color="#132032" roughness={1} metalness={0} />
        </mesh>

        <InstancedBlocks state={state} shadows={shadows} />

        <OrbitControls makeDefault target={[center.x, center.y, center.z]} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
