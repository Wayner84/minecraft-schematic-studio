import { useEffect, useRef } from 'react';
import { getBlockById } from '../data/blockPalette';
import type { LayerEditorState } from './LayerEditor';

type CellKey = string;
const keyXZ = (x: number, z: number): CellKey => `${x},${z}`;

function getLayerMap(state: LayerEditorState, y: number): Map<CellKey, string> {
  let m = state.layers.get(y);
  if (!m) {
    m = new Map();
    state.layers.set(y, m);
  }
  return m;
}

export function EditorCanvas({
  state,
  y,
  cellPx,
  selected,
  onChange,
}: {
  state: LayerEditorState;
  y: number;
  cellPx: number;
  selected: string;
  onChange: React.Dispatch<React.SetStateAction<LayerEditorState>>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPaintingRef = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const w = state.sizeX * cellPx;
    const h = state.sizeZ * cellPx;
    c.width = w;
    c.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, w, h);

    // Ghost layer below
    const ghost = state.layers.get(y - 1);
    if (ghost) {
      ctx.globalAlpha = 0.25;
      for (const [k, id] of ghost.entries()) {
        const [xs, zs] = k.split(',');
        const x = Number(xs), z = Number(zs);
        const b = getBlockById(id);
        ctx.fillStyle = b.color;
        ctx.fillRect(x * cellPx, z * cellPx, cellPx, cellPx);
      }
      ctx.globalAlpha = 1;
    }

    // Current layer
    const layer = state.layers.get(y);
    if (layer) {
      for (const [k, id] of layer.entries()) {
        const [xs, zs] = k.split(',');
        const x = Number(xs), z = Number(zs);
        const b = getBlockById(id);
        ctx.fillStyle = b.color;
        ctx.fillRect(x * cellPx, z * cellPx, cellPx, cellPx);
      }
    }

    // Grid
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#9fb3c8';
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.sizeX; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellPx + 0.5, 0);
      ctx.lineTo(x * cellPx + 0.5, h);
      ctx.stroke();
    }
    for (let z = 0; z <= state.sizeZ; z++) {
      ctx.beginPath();
      ctx.moveTo(0, z * cellPx + 0.5);
      ctx.lineTo(w, z * cellPx + 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, [state, y, cellPx]);

  function canvasToCell(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cz = e.clientY - rect.top;
    return { x: Math.floor(cx / cellPx), z: Math.floor(cz / cellPx) };
  }

  function paintAt(x: number, z: number) {
    if (x < 0 || z < 0 || x >= state.sizeX || z >= state.sizeZ) return;
    onChange(prev => {
      const next: LayerEditorState = {
        sizeX: prev.sizeX,
        sizeZ: prev.sizeZ,
        layers: new Map(prev.layers),
      };
      const m = new Map(getLayerMap(prev, y));
      next.layers.set(y, m);
      const k = keyXZ(x, z);
      if (selected === 'minecraft:air') m.delete(k);
      else m.set(k, selected);
      return next;
    });
  }

  return (
    <div className="canvasWrap">
      <canvas
        ref={canvasRef}
        className="canvas"
        onPointerDown={e => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          isPaintingRef.current = true;
          const { x, z } = canvasToCell(e);
          paintAt(x, z);
        }}
        onPointerMove={e => {
          if (!isPaintingRef.current) return;
          const { x, z } = canvasToCell(e);
          paintAt(x, z);
        }}
        onPointerUp={() => { isPaintingRef.current = false; }}
        onPointerCancel={() => { isPaintingRef.current = false; }}
      />
    </div>
  );
}
