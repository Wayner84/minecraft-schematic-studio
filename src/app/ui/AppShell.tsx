import { useMemo, useState } from 'react';
import { LayerEditor } from './LayerEditor';
import { Viewer3D } from './Viewer3D';
import { FloatingPalette } from './FloatingPalette';
import { HotbarPalette } from './HotbarPalette';
import { createEmptyEditorState } from '../model/editorState';
import { DEFAULT_BLOCK_ID } from '../data/blockPalette';
import { getAtlasStatus, loadResourcePackZip, resetAtlasToProcedural, type AtlasStatus } from '../view/atlas';

export function AppShell() {
  const [shadows, setShadows] = useState(true);

  // Shared state
  const [editorState, setEditorState] = useState(() => createEmptyEditorState(128, 128));
  const [y, setY] = useState(0);
  const [selected, setSelected] = useState(DEFAULT_BLOCK_ID);
  const [cellPx, setCellPx] = useState(6);

  // Texture pack UI state (kept in React so labels update immediately)
  const [atlasStatus, setAtlasStatus] = useState<AtlasStatus>(() => getAtlasStatus());
  const [toast, setToast] = useState<string | null>(null);

  const textureLabel = useMemo(() => {
    if (atlasStatus.source === 'resource-pack') return 'Textures: pack';
    return 'Textures: demo';
  }, [atlasStatus.source]);

  return (
    <div
      className="app"
      onDragOver={e => {
        e.preventDefault();
      }}
      onDrop={async e => {
        e.preventDefault();
        const f = e.dataTransfer?.files?.[0];
        if (!f) return;
        if (!f.name.toLowerCase().endsWith('.zip')) {
          setToast('Drop a resource pack .zip file');
          setTimeout(() => setToast(null), 2200);
          return;
        }
        try {
          const st = await loadResourcePackZip(f);
          setAtlasStatus(st);
          setToast(`Loaded pack: ${f.name}`);
          setTimeout(() => setToast(null), 2500);
        } catch {
          setToast('Failed to load pack (is it a valid resource pack zip?)');
          setTimeout(() => setToast(null), 2800);
        }
      }}
    >
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Minecraft Schematic Studio</div>
          <div className="brandSub">1.21.x • Litematica • Editor + Viewer (v0)</div>
        </div>

        <nav className="tabs">
          <button className={shadows ? 'tab active' : 'tab'} onClick={() => setShadows(v => !v)}>
            {shadows ? 'Shadows: on' : 'Shadows: off'}
          </button>

          <label className="tab" style={{ cursor: 'pointer' }}>
            {textureLabel}
            <input
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={async e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const st = await loadResourcePackZip(f);
                setAtlasStatus(st);
                setToast(`Loaded pack: ${f.name}`);
                setTimeout(() => setToast(null), 2500);
                // reset input so selecting the same file again re-triggers
                e.currentTarget.value = '';
              }}
            />
          </label>

          <button
            className="tab"
            onClick={() => {
              const st = resetAtlasToProcedural();
              setAtlasStatus(st);
              setToast('Reset to demo textures');
              setTimeout(() => setToast(null), 2000);
            }}
          >
            Reset textures
          </button>
        </nav>
        {toast && <div className="toast">{toast}</div>}
      </header>

      <main className="main">
        <div className="splitLayout">
          <div className="splitEditor">
            <LayerEditor
              state={editorState}
              onChange={setEditorState}
              y={y}
              setY={setY}
              selected={selected}
              setSelected={setSelected}
              cellPx={cellPx}
              setCellPx={setCellPx}
            />
          </div>

          <div className="splitViewer">
            <div className="panel viewerPanel">
              <Viewer3D state={editorState} shadows={shadows} />
            </div>
          </div>

          {/* Desktop: draggable palette button. Mobile: bottom hotbar. */}
          <FloatingPalette selected={selected} onSelect={setSelected} />
          <HotbarPalette selected={selected} onSelect={setSelected} />
        </div>
      </main>
    </div>
  );
}

