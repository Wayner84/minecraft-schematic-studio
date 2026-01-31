import { useEffect, useMemo, useState } from 'react';
import { BLOCKS, DEFAULT_BLOCK_ID, getBlockById } from '../data/blockPalette';

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

const STORAGE_KEY = 'mss.hotbar.v1';
const SLOT_COUNT = 9;

function defaultHotbar() {
  // Keep it starter-friendly.
  return [
    'minecraft:stone',
    'minecraft:grass_block',
    'minecraft:dirt',
    'minecraft:sand',
    'minecraft:oak_planks',
    'minecraft:oak_log',
    'minecraft:glass',
    'minecraft:red_wool',
    'minecraft:air',
  ];
}

function normalizeHotbar(ids: string[]): string[] {
  const valid = new Set(BLOCKS.map(b => b.id));
  const out: string[] = [];
  for (const id of ids) {
    if (valid.has(id)) out.push(id);
  }
  while (out.length < SLOT_COUNT) out.push(DEFAULT_BLOCK_ID);
  return out.slice(0, SLOT_COUNT);
}

export function HotbarPalette({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [editSlot, setEditSlot] = useState<number | null>(null);
  const [hotbar, setHotbar] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultHotbar();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return defaultHotbar();
      return normalizeHotbar(parsed);
    } catch {
      return defaultHotbar();
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hotbar));
    } catch {
      // ignore (private mode / quota)
    }
  }, [hotbar]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return BLOCKS;
    return BLOCKS.filter(b => (b.name + ' ' + b.id).toLowerCase().includes(t));
  }, [q]);

  return (
    <>
      <div className="hotbar" role="toolbar" aria-label="Block hotbar">
        <button
          className="hotbarBtn"
          onClick={() => {
            setEditSlot(null);
            setOpen(true);
          }}
          title="Open palette"
        >
          Palette
        </button>

        <div className="hotbarSlots" role="group" aria-label="Hotbar slots">
          {hotbar.map((id, i) => {
            const b = getBlockById(id);
            const active = id === selected;
            return (
              <button
                key={i}
                className={active ? 'hotbarSlot active' : 'hotbarSlot'}
                onClick={() => onSelect(id)}
                onContextMenu={e => {
                  e.preventDefault();
                  setEditSlot(i);
                  setOpen(true);
                }}
                title={`${b.name} (hold/right-click to edit)`}
              >
                <span className="hotbarSwatch" style={{ background: b.color }} />
                <span className="hotbarIndex">{i + 1}</span>
              </button>
            );
          })}
        </div>

        <button
          className="hotbarBtn"
          onClick={() => {
            setHotbar(defaultHotbar());
          }}
          title="Reset hotbar"
        >
          Reset
        </button>
      </div>

      {open && (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="title">Palette</div>
                <div className="muted">
                  {editSlot === null ? 'Tap a block to select it, or long-press a slot to edit.' : `Editing slot ${editSlot + 1}`}
                </div>
              </div>
              <button className="btn" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <input className="input" placeholder="Search blocks…" value={q} onChange={e => setQ(e.target.value)} />

            <div className="modalList">
              {list.map(b => (
                <button
                  key={b.id}
                  className={b.id === selected ? 'paletteBtn active' : 'paletteBtn'}
                  onClick={() => {
                    if (editSlot !== null) {
                      setHotbar(prev => {
                        const next = prev.slice();
                        next[editSlot] = b.id;
                        return next;
                      });
                      onSelect(b.id);
                      setOpen(false);
                      setEditSlot(null);
                      return;
                    }
                    onSelect(b.id);
                    setOpen(false);
                  }}
                >
                  <span className="swatch" style={{ background: b.color }} />
                  <span className="paletteBtnText">{b.name}</span>
                  <span className="muted" style={{ marginLeft: 'auto' }}>{b.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
