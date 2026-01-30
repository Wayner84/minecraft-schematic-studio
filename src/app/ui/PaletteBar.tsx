import { useMemo, useState } from 'react';
import { BLOCKS, getBlockById } from '../data/blockPalette';

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

export function PaletteBar({ selected, onSelect }: Props) {
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return BLOCKS;
    return BLOCKS.filter(b => (b.name + ' ' + b.id).toLowerCase().includes(t));
  }, [q]);

  return (
    <div className="paletteBar panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="title">Palette</div>
          <div className="muted">Selected: {getBlockById(selected).name}</div>
        </div>
      </div>
      <input className="input" placeholder="Search blocks…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="paletteButtons" role="list">
        {list.map(b => (
          <button
            key={b.id}
            className={b.id === selected ? 'paletteBtn active' : 'paletteBtn'}
            onClick={() => onSelect(b.id)}
            title={b.id}
          >
            <span className="swatch" style={{ background: b.color }} />
            <span className="paletteBtnText">{b.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
