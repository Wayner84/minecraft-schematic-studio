import { useState } from 'react';
import { LayerEditor } from './LayerEditor';
import { Viewer3D } from './Viewer3D';
import { FloatingPalette } from './FloatingPalette';
import { HotbarPalette } from './HotbarPalette';
import { createEmptyEditorState } from '../model/editorState';
import { DEFAULT_BLOCK_ID } from '../data/blockPalette';
import { getAtlasSource, loadResourcePackZip, resetAtlasToProcedural } from '../view/atlas';

export function AppShell() {
  const [shadows, setShadows] = useState(true);

  // Shared state
  const [editorState, setEditorState] = useState(() => createEmptyEditorState(128, 128));
  const [y, setY] = useState(0);
  const [selected, setSelected] = useState(DEFAULT_BLOCK_ID);
  const [cellPx, setCellPx] = useState(6);

  return (
    <div className="app">
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
            Textures: {getAtlasSource() === 'resource-pack' ? 'pack' : 'demo'}
            <input
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={async e => {
                const f = e.target.files?.[0];
                if (!f) return;
                await loadResourcePackZip(f);
                // reset input so selecting the same file again re-triggers
                e.currentTarget.value = '';
              }}
            />
          </label>

          <button className="tab" onClick={() => resetAtlasToProcedural()}>
            Reset textures
          </button>
        </nav>
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

