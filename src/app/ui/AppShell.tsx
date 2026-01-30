import { useMemo, useState } from 'react';
import { LayerEditor } from './LayerEditor';
import { Viewer3D } from './Viewer3D';
import { createEmptyEditorState } from '../model/editorState';

type Tab = 'editor' | 'viewer';

export function AppShell() {
  const [tab, setTab] = useState<Tab>('editor');
  const [shadows, setShadows] = useState(true);

  // Shared state between Editor and Viewer
  const [editorState, setEditorState] = useState(() => createEmptyEditorState(128, 128));

  const subtitle = useMemo(() => {
    return tab === 'editor'
      ? '1.21.x • Litematica • Layer editor (v0)'
      : '1.21.x • 3D orbit viewer (v0)';
  }, [tab]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Minecraft Schematic Studio</div>
          <div className="brandSub">{subtitle}</div>
        </div>

        <nav className="tabs">
          <button className={tab === 'editor' ? 'tab active' : 'tab'} onClick={() => setTab('editor')}>Editor</button>
          <button className={tab === 'viewer' ? 'tab active' : 'tab'} onClick={() => setTab('viewer')}>Viewer</button>
          <button className={shadows ? 'tab active' : 'tab'} onClick={() => setShadows(v => !v)}>
            {shadows ? 'Shadows: on' : 'Shadows: off'}
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === 'editor' ? (
          <LayerEditor state={editorState} onChange={setEditorState} />
        ) : (
          <div className="viewerPanel">
            <Viewer3D state={editorState} shadows={shadows} />
          </div>
        )}
      </main>
    </div>
  );
}
