import { useEffect, useMemo, useRef, useState } from 'react';
import { BLOCKS, DEFAULT_BLOCK_ID, getBlockById } from '../data/blockPalette';
import { clampY, downloadJson, readJsonFile } from '../io/saveLoad';
import type { BuildFileV0, PlacedBlock } from '../io/saveLoad';

type CellKey = string; // "x,z"
const keyXZ = (x: number, z: number): CellKey => `${x},${z}`;

export type LayerEditorState = {
  sizeX: number;
  sizeZ: number;
  // sparse per layer: map of x,z -> blockId
  layers: Map<number, Map<CellKey, string>>;
};

function getLayerMap(state: LayerEditorState, y: number): Map<CellKey, string> {
  let m = state.layers.get(y);
  if (!m) {
    m = new Map();
    state.layers.set(y, m);
  }
  return m;
}

// (helpers removed)

function exportBuild(state: LayerEditorState, name: string, heightMax: number): BuildFileV0 {
  const blocks: PlacedBlock[] = [];
  for (const [y, layer] of state.layers.entries()) {
    if (y < 0 || y > heightMax) continue;
    for (const [k, id] of layer.entries()) {
      const [xs, zs] = k.split(',');
      blocks.push({ x: Number(xs), y, z: Number(zs), id });
    }
  }
  return {
    version: 0,
    name,
    size: { x: state.sizeX, y: heightMax + 1, z: state.sizeZ },
    blocks,
  };
}

function importBuild(file: any): LayerEditorState {
  if (!file || typeof file !== 'object') throw new Error('Invalid file');
  if (file.version !== 0) throw new Error('Unsupported file version');
  const sizeX = Number(file.size?.x ?? 128);
  const sizeZ = Number(file.size?.z ?? 128);
  const layers = new Map<number, Map<CellKey, string>>();

  const blocks: PlacedBlock[] = Array.isArray(file.blocks) ? file.blocks : [];
  for (const b of blocks) {
    const x = Number(b.x), z = Number(b.z);
    const y = clampY(Number(b.y));
    const id = String(b.id || 'minecraft:air');
    if (x < 0 || z < 0 || x >= sizeX || z >= sizeZ) continue;
    let layer = layers.get(y);
    if (!layer) {
      layer = new Map();
      layers.set(y, layer);
    }
    if (id !== 'minecraft:air') layer.set(keyXZ(x, z), id);
  }

  return { sizeX, sizeZ, layers };
}

export function LayerEditor({ state, onChange }: { state: LayerEditorState; onChange: React.Dispatch<React.SetStateAction<LayerEditorState>> }) {
  const [y, setY] = useState(0);
  const [selected, setSelected] = useState(DEFAULT_BLOCK_ID);
  const [query, setQuery] = useState('');

  // state is lifted to AppShell so Viewer can render it

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cellPx, setCellPx] = useState(6); // zoom level

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? BLOCKS.filter(b => (b.name + ' ' + b.id).toLowerCase().includes(q)) : BLOCKS;
    return list;
  }, [query]);

  // Draw canvas
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

    // Background
    ctx.fillStyle = '#0b0f14';
    ctx.fillRect(0, 0, w, h);

    // Ghost layer below
    const ghostY = y - 1;
    const ghost = state.layers.get(ghostY);
    if (ghost) {
      ctx.globalAlpha = 0.28;
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

    // Grid lines (light)
    ctx.globalAlpha = 0.15;
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

  function canvasToCell(e: PointerEvent | React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = (e.clientX - rect.left);
    const cz = (e.clientY - rect.top);
    const x = Math.floor(cx / cellPx);
    const z = Math.floor(cz / cellPx);
    return { x, z };
  }

  const isPaintingRef = useRef(false);

  function paintAt(x: number, z: number) {
    if (x < 0 || z < 0 || x >= state.sizeX || z >= state.sizeZ) return;
    onChange((prev) => {
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

  async function onImportFile(file: File) {
    const json = await readJsonFile(file);
    const next = importBuild(json);
    onChange(next);
    setY(0);
  }

  return (
    <div className="editor">
      <div className="editorLeft">
        <div className="panel">
          <div className="row">
            <div className="title">Layer</div>
            <div className="muted">Y = {y}</div>
          </div>
          <input
            type="range"
            min={0}
            max={319}
            value={y}
            onChange={e => setY(Number(e.target.value))}
          />
          <div className="row">
            <button className="btn" onClick={() => setY(v => Math.max(0, v - 1))}>-1</button>
            <button className="btn" onClick={() => setY(v => Math.min(319, v + 1))}>+1</button>
            <div style={{ flex: 1 }} />
            <div className="muted">Ghost: Y-1</div>
          </div>
        </div>

        <div className="panel">
          <div className="row">
            <div className="title">Palette</div>
            <div className="muted">Selected: {getBlockById(selected).name}</div>
          </div>
          <input
            className="input"
            placeholder="Search blocks…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="palette">
            {filtered.map(b => (
              <button
                key={b.id}
                className={b.id === selected ? 'paletteItem active' : 'paletteItem'}
                onClick={() => setSelected(b.id)}
                title={b.id}
              >
                <span className="swatch" style={{ background: b.color }} />
                <span className="paletteText">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="row">
            <div className="title">File</div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn primary"
              onClick={() => {
                const build = exportBuild(state, 'Untitled build', 319);
                downloadJson(`build-${Date.now()}.json`, build);
              }}
            >
              Export (.json)
            </button>

            <label className="btn" style={{ cursor: 'pointer' }}>
              Import
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) void onImportFile(f);
                }}
              />
            </label>
          </div>
          <div className="muted" style={{ marginTop: 8 }}>
            v0 JSON for now (share by file). Litematica import/export next.
          </div>
        </div>
      </div>

      <div className="editorRight">
        <div className="panel row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="title">Paint</div>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" onClick={() => setSelected('minecraft:air')}>Eraser</button>
            <div className="muted">Zoom</div>
            <button className="btn" onClick={() => setCellPx(p => Math.max(2, p - 1))}>-</button>
            <button className="btn" onClick={() => setCellPx(p => Math.min(18, p + 1))}>+</button>
          </div>
        </div>

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
            onPointerUp={() => {
              isPaintingRef.current = false;
            }}
            onPointerCancel={() => {
              isPaintingRef.current = false;
            }}
          />
        </div>

        <div className="muted" style={{ marginTop: 10 }}>
          Tip: touch/drag to paint. Set block to Air to erase.
        </div>
      </div>
    </div>
  );
}
