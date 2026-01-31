import { useEffect, useMemo, useRef, useState } from 'react';
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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // View transform: two-finger pinch zoom + pan
  const [viewScale, setViewScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<
    | null
    | {
        startDist: number;
        startScale: number;
        startMid: { x: number; y: number };
        startOffset: { x: number; y: number };
      }
  >(null);

  const isPaintingRef = useRef(false);
  const lastPaint = useRef<{ x: number; z: number } | null>(null);

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

  function wrapToCell(clientX: number, clientY: number) {
    const wrap = wrapRef.current!;
    const rect = wrap.getBoundingClientRect();
    // Account for scroll position inside the wrapper. Without this, hit-testing is wrong
    // after zooming/panning when the wrapper scrolls.
    const localX = clientX - rect.left + wrap.scrollLeft;
    const localY = clientY - rect.top + wrap.scrollTop;

    // Invert transform applied to the canvas: translate(offset) then scale(viewScale)
    const cx = (localX - offset.x) / viewScale;
    const cz = (localY - offset.y) / viewScale;
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

  const canvasStyle = useMemo(
    () => ({
      transform: `translate(${offset.x}px, ${offset.y}px) scale(${viewScale})`,
      transformOrigin: '0 0',
    }),
    [offset, viewScale]
  );

  return (
    <div
      ref={wrapRef}
      className="canvasWrap canvasGestures"
      onPointerDown={e => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Two fingers => pinch/zoom/pan, do NOT paint
        if (pointers.current.size >= 2) {
          isPaintingRef.current = false;
          lastPaint.current = null;

          const pts = Array.from(pointers.current.values());
          const dx = pts[0].x - pts[1].x;
          const dy = pts[0].y - pts[1].y;
          const dist = Math.hypot(dx, dy);
          const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
          gesture.current = { startDist: dist, startScale: viewScale, startMid: mid, startOffset: offset };
          return;
        }

        // Single finger => paint
        isPaintingRef.current = true;
        const { x, z } = wrapToCell(e.clientX, e.clientY);
        paintAt(x, z);
        lastPaint.current = { x, z };
      }}
      onPointerMove={e => {
        if (!pointers.current.has(e.pointerId)) return;
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Pinch mode
        if (pointers.current.size >= 2 && gesture.current) {
          const pts = Array.from(pointers.current.values());
          const dx = pts[0].x - pts[1].x;
          const dy = pts[0].y - pts[1].y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };

          const scale = Math.min(6, Math.max(0.6, gesture.current.startScale * (dist / gesture.current.startDist)));

          // Pan: move offset by midpoint delta in screen space
          const dmx = mid.x - gesture.current.startMid.x;
          const dmy = mid.y - gesture.current.startMid.y;
          setViewScale(scale);
          setOffset({ x: gesture.current.startOffset.x + dmx, y: gesture.current.startOffset.y + dmy });
          return;
        }

        // Paint mode
        if (!isPaintingRef.current) return;
        const { x, z } = wrapToCell(e.clientX, e.clientY);
        const prev = lastPaint.current;
        if (!prev || prev.x !== x || prev.z !== z) {
          paintAt(x, z);
          lastPaint.current = { x, z };
        }
      }}
      onPointerUp={e => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size < 2) {
          gesture.current = null;
        }
        isPaintingRef.current = false;
        lastPaint.current = null;
      }}
      onPointerCancel={e => {
        pointers.current.delete(e.pointerId);
        gesture.current = null;
        isPaintingRef.current = false;
        lastPaint.current = null;
      }}
    >
      <canvas ref={canvasRef} className="canvas" style={canvasStyle as any} />
    </div>
  );
}
