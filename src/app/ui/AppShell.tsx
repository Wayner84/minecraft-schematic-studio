import { useMemo, useState } from 'react';
import { LayerEditor, exportBuildV1, importBuild } from './LayerEditor';
import { Viewer3D } from './Viewer3D';
import { HotbarPalette } from './HotbarPalette';
import { createEmptyEditorState } from '../model/editorState';
import { DEFAULT_BLOCK_ID } from '../data/blockPalette';
import { getAtlasStatus, loadResourcePackZip, resetAtlasToProcedural, type AtlasStatus } from '../view/atlas';
import { downloadBlob, downloadJson, readJsonFile } from '../io/saveLoad';
import { exportLitematic, importLitematic } from '../io/litematic';
import type { LayerEditorState } from './LayerEditor';

function cloneEditorState(s: LayerEditorState): LayerEditorState {
  const layers = new Map<number, Map<string, string>>();
  for (const [y, layer] of s.layers.entries()) {
    layers.set(y, new Map(layer));
  }
  return { sizeX: s.sizeX, sizeZ: s.sizeZ, layers };
}

export function AppShell() {
  const [shadows, setShadows] = useState(true);

  // Shared state
  const [editorState, setEditorState] = useState(() => createEmptyEditorState(128, 128));
  const [historyPast, setHistoryPast] = useState<LayerEditorState[]>([]);
  const [historyFuture, setHistoryFuture] = useState<LayerEditorState[]>([]);

  const [y, setY] = useState(0);
  const [selected, setSelected] = useState(DEFAULT_BLOCK_ID);
  const [cellPx, setCellPx] = useState(() => {
    // Start more zoomed-in by default (larger cells) so the grid isn't tiny on load.
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 980px)').matches) return 9;
    return 8;
  });

  // Texture pack UI state (kept in React so labels update immediately)
  const [atlasStatus, setAtlasStatus] = useState<AtlasStatus>(() => getAtlasStatus());
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const textureLabel = useMemo(() => {
    if (atlasStatus.source === 'resource-pack') return 'Textures: pack';
    return 'Textures: demo';
  }, [atlasStatus.source]);

  function pushHistory(next: LayerEditorState) {
    setHistoryPast(prev => {
      const copy = prev.slice();
      copy.push(cloneEditorState(editorState));
      // cap at 50 steps
      while (copy.length > 50) copy.shift();
      return copy;
    });
    setHistoryFuture([]);
    setEditorState(next);
  }

  function undo() {
    setHistoryPast(prevPast => {
      if (prevPast.length === 0) return prevPast;
      const copy = prevPast.slice();
      const prevState = copy.pop()!;
      setHistoryFuture(f => {
        const nf = f.slice();
        nf.unshift(cloneEditorState(editorState));
        return nf.slice(0, 50);
      });
      setEditorState(prevState);
      return copy;
    });
  }

  function redo() {
    setHistoryFuture(prevFuture => {
      if (prevFuture.length === 0) return prevFuture;
      const copy = prevFuture.slice();
      const nextState = copy.shift()!;
      setHistoryPast(p => {
        const np = p.slice();
        np.push(cloneEditorState(editorState));
        while (np.length > 50) np.shift();
        return np;
      });
      setEditorState(nextState);
      return copy;
    });
  }

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
          <div>
            <div className="brandTitle">Minecraft Schematic Studio</div>
            <div className="brandSub">1.21.x • Litematica • Editor + Viewer (v0)</div>
          </div>

          <button
            className="menuBtn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            title="Menu"
          >
            ☰
          </button>
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

        {menuOpen && (
          <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setMenuOpen(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="title">Menu</div>
                  <div className="muted">Quick settings</div>
                </div>
                <button className="btn" onClick={() => setMenuOpen(false)}>
                  Close
                </button>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button className={shadows ? 'btn primary' : 'btn'} onClick={() => setShadows(v => !v)}>
                  {shadows ? 'Shadows: on' : 'Shadows: off'}
                </button>

                <label className="btn" style={{ cursor: 'pointer' }}>
                  {textureLabel} (load)
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
                      e.currentTarget.value = '';
                      setMenuOpen(false);
                    }}
                  />
                </label>

                <button
                  className="btn"
                  onClick={() => {
                    const st = resetAtlasToProcedural();
                    setAtlasStatus(st);
                    setToast('Reset to demo textures');
                    setTimeout(() => setToast(null), 2000);
                    setMenuOpen(false);
                  }}
                >
                  Reset textures
                </button>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button
                  className={historyPast.length ? 'btn primary' : 'btn'}
                  onClick={() => {
                    undo();
                    setMenuOpen(false);
                  }}
                  disabled={!historyPast.length}
                >
                  Undo
                </button>

                <button
                  className={historyFuture.length ? 'btn primary' : 'btn'}
                  onClick={() => {
                    redo();
                    setMenuOpen(false);
                  }}
                  disabled={!historyFuture.length}
                >
                  Redo
                </button>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    downloadJson(`build-${Date.now()}.json`, exportBuildV1(editorState, 'Untitled build', 319));
                    setMenuOpen(false);
                  }}
                >
                  Export JSON
                </button>

                <button
                  className="btn"
                  onClick={async () => {
                    const blob = await exportLitematic(editorState, 'Untitled build');
                    downloadBlob(`build-${Date.now()}.litematic`, blob);
                    setMenuOpen(false);
                  }}
                >
                  Export .litematic
                </button>

                <label className="btn" style={{ cursor: 'pointer' }}>
                  Import JSON
                  <input
                    type="file"
                    accept="application/json"
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const json = await readJsonFile(f);
                      const next = importBuild(json);
                      pushHistory(next);
                      setY(0);
                      setMenuOpen(false);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>

                <label className="btn" style={{ cursor: 'pointer' }}>
                  Import .litematic
                  <input
                    type="file"
                    accept=".litematic,application/octet-stream"
                    style={{ display: 'none' }}
                    onChange={async e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const next = await importLitematic(f);
                      pushHistory(next);
                      setY(0);
                      setMenuOpen(false);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>

              <div className="muted">
                Tip: you can also drag & drop a resource-pack .zip onto the page (desktop).
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Floating quick actions (mobile) */}
      <div className="floatingStack right" aria-label="History controls">
        <button className="floatingFab" onClick={undo} disabled={!historyPast.length} title="Undo">↶</button>
        <button className="floatingFab" onClick={redo} disabled={!historyFuture.length} title="Redo">↷</button>
      </div>

      <main className="main">
        <div className="splitLayout">
          <div className="splitEditor">
            <LayerEditor
              state={editorState}
              onChange={next => {
                // LayerEditor uses React.SetStateAction; normalize into a value then push.
                if (typeof next === 'function') {
                  const fn = next as any;
                  const computed = fn(editorState);
                  pushHistory(computed);
                } else {
                  pushHistory(next as any);
                }
              }}
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

          {/* Bottom hotbar palette (desktop + mobile) */}
          <HotbarPalette selected={selected} onSelect={setSelected} />
          {/* Old draggable palette removed in favour of the bottom hotbar */}
          {/* <FloatingPalette selected={selected} onSelect={setSelected} /> */}
        </div>
      </main>
    </div>
  );
}

