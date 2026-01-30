import { useEffect, useMemo, useRef, useState } from 'react';
import { BLOCKS, getBlockById } from '../data/blockPalette';

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

export function FloatingPalette({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pos, setPos] = useState({ x: 18, y: 140 });

  const dragging = useRef<null | { startX: number; startY: number; startPos: { x: number; y: number } }>(null);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return BLOCKS;
    return BLOCKS.filter(b => (b.name + ' ' + b.id).toLowerCase().includes(t));
  }, [q]);

  // keep within viewport
  useEffect(() => {
    function clamp() {
      setPos(p => ({
        x: Math.max(8, Math.min(window.innerWidth - 72, p.x)),
        y: Math.max(70, Math.min(window.innerHeight - 72, p.y)),
      }));
    }
    window.addEventListener('resize', clamp);
    return () => window.removeEventListener('resize', clamp);
  }, []);

  return (
    <>
      <button
        className="fab"
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={e => {
          // start drag
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          dragging.current = { startX: e.clientX, startY: e.clientY, startPos: pos };
        }}
        onPointerMove={e => {
          if (!dragging.current) return;
          const dx = e.clientX - dragging.current.startX;
          const dy = e.clientY - dragging.current.startY;
          setPos({ x: dragging.current.startPos.x + dx, y: dragging.current.startPos.y + dy });
        }}
        onPointerUp={() => {
          dragging.current = null;
        }}
        onPointerCancel={() => {
          dragging.current = null;
        }}
        onClick={() => {
          // If user was dragging, click still fires; ignore tiny drags by checking ref.
          setOpen(true);
        }}
        title="Open palette"
      >
        <span className="fabDot" style={{ background: getBlockById(selected).color }} />
        Palette
      </button>

      {open && (
        <div className="modalOverlay" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="title">Palette</div>
                <div className="muted">Selected: {getBlockById(selected).name}</div>
              </div>
              <button className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
            <input className="input" placeholder="Search blocks…" value={q} onChange={e => setQ(e.target.value)} />
            <div className="modalList">
              {list.map(b => (
                <button
                  key={b.id}
                  className={b.id === selected ? 'paletteBtn active' : 'paletteBtn'}
                  onClick={() => {
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
