import { useState } from 'react';
import { LayerEditor } from './LayerEditor';

type Tab = 'editor' | 'viewer';

export function AppShell() {
  const [tab, setTab] = useState<Tab>('editor');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandTitle">Minecraft Schematic Studio</div>
          <div className="brandSub">1.21.x • Litematica • Layer editor (v0)</div>
        </div>
        <nav className="tabs">
          <button className={tab === 'editor' ? 'tab active' : 'tab'} onClick={() => setTab('editor')}>Editor</button>
          <button className={tab === 'viewer' ? 'tab active' : 'tab'} onClick={() => setTab('viewer')}>Viewer</button>
        </nav>
      </header>

      <main className="main">
        {tab === 'editor' ? (
          <LayerEditor />
        ) : (
          <div className="panel" style={{ padding: 18 }}>
            <div className="title">3D Viewer</div>
            <div className="muted" style={{ marginTop: 8 }}>
              Coming next: orbit camera + shadows toggle.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
