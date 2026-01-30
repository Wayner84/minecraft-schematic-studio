import { downloadJson, readJsonFile, clampY } from '../io/saveLoad';
import type { BuildFileV0, PlacedBlock } from '../io/saveLoad';
import { EditorCanvas } from './EditorCanvas';

type CellKey = string; // "x,z"
const keyXZ = (x: number, z: number): CellKey => `${x},${z}`;

export type LayerEditorState = {
  sizeX: number;
  sizeZ: number;
  // sparse per layer: map of x,z -> blockId
  layers: Map<number, Map<CellKey, string>>;
};

// helpers moved into EditorCanvas

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

export function LayerEditor({
  state,
  onChange,
  y,
  setY,
  selected,
  setSelected,
  cellPx,
  setCellPx,
}: {
  state: LayerEditorState;
  onChange: React.Dispatch<React.SetStateAction<LayerEditorState>>;
  y: number;
  setY: (y: number) => void;
  selected: string;
  setSelected: (id: string) => void;
  cellPx: number;
  setCellPx: (n: number) => void;
}) {
  async function onImportFile(file: File) {
    const json = await readJsonFile(file);
    const next = importBuild(json);
    onChange(next);
    setY(0);
  }

  return (
    <div className="editorPane">
      <div className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="title">Layer</div>
            <div className="muted">Y = {y} (ghost Y-1)</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => setY(Math.max(0, y - 1))}>-1</button>
            <button className="btn" onClick={() => setY(Math.min(319, y + 1))}>+1</button>
          </div>
        </div>
        <input type="range" min={0} max={319} value={y} onChange={e => setY(Number(e.target.value))} />
      </div>

      <div className="panel row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" onClick={() => setSelected('minecraft:air')}>Eraser</button>
          <div className="muted">Zoom</div>
          <button className="btn" onClick={() => setCellPx(Math.max(2, cellPx - 1))}>-</button>
          <button className="btn" onClick={() => setCellPx(Math.min(18, cellPx + 1))}>+</button>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button
            className="btn primary"
            onClick={() => downloadJson(`build-${Date.now()}.json`, exportBuild(state, 'Untitled build', 319))}
          >
            Export
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
      </div>

      <EditorCanvas state={state} y={y} cellPx={cellPx} selected={selected} onChange={onChange} />

      <div className="muted" style={{ marginTop: 8 }}>
        Tip: touch/drag to paint. Export a JSON file to share.
      </div>
    </div>
  );
}
