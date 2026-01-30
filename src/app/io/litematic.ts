import { Int32, NBTData, read, write } from 'nbtify';
import type { LongArrayTag } from 'nbtify';
import type { LayerEditorState } from '../ui/LayerEditor';

// Minimal Litematica (.litematic) support (blocks only, single region).
// We ignore block entities, entities, scheduled ticks, etc.

// (internal Region type removed; keep file minimal)

function bitsNeeded(n: number) {
  // Litematica commonly uses at least 2 bits
  return Math.max(2, Math.ceil(Math.log2(Math.max(2, n))));
}

function unpackBlockStates(longs: BigInt64Array, bitsPerBlock: number, count: number): Uint32Array {
  const out = new Uint32Array(count);
  const mask = (1n << BigInt(bitsPerBlock)) - 1n;

  let bitIndex = 0n;
  for (let i = 0; i < count; i++) {
    const startLong = Number(bitIndex / 64n);
    const startOffset = Number(bitIndex % 64n);

    let value = BigInt(longs[startLong]) >> BigInt(startOffset);
    const endBits = startOffset + bitsPerBlock;

    if (endBits > 64) {
      const next = BigInt(longs[startLong + 1]) << BigInt(64 - startOffset);
      value |= next;
    }

    out[i] = Number(value & mask);
    bitIndex += BigInt(bitsPerBlock);
  }

  return out;
}

function packBlockStates(indices: Uint32Array, bitsPerBlock: number): BigInt64Array {
  const mask = (1n << BigInt(bitsPerBlock)) - 1n;
  const totalBits = BigInt(indices.length) * BigInt(bitsPerBlock);
  const longCount = Number((totalBits + 63n) / 64n);
  const longs = new BigInt64Array(longCount);

  let bitIndex = 0n;
  for (let i = 0; i < indices.length; i++) {
    const v = BigInt(indices[i]) & mask;

    const li = Number(bitIndex / 64n);
    const off = Number(bitIndex % 64n);

    longs[li] = BigInt(longs[li]) | (v << BigInt(off));

    const endBits = off + bitsPerBlock;
    if (endBits > 64) {
      longs[li + 1] = BigInt(longs[li + 1]) | (v >> BigInt(64 - off));
    }

    bitIndex += BigInt(bitsPerBlock);
  }

  return longs;
}

function linearIndex(x: number, y: number, z: number, sizeX: number, sizeZ: number) {
  // Common order: x fastest, then z, then y
  return (y * sizeZ + z) * sizeX + x;
}

export async function importLitematic(file: File): Promise<LayerEditorState> {
  const nbt = await read(file, { compression: 'gzip', endian: 'big' });
  const root: any = (nbt as any).data;

  const regionsObj = root?.Regions;
  if (!regionsObj || typeof regionsObj !== 'object') throw new Error('Invalid litematic: missing Regions');

  const regionName = Object.keys(regionsObj)[0];
  if (!regionName) throw new Error('Invalid litematic: no regions');

  const r: any = regionsObj[regionName];

  const size = {
    x: Number(r?.Size?.x ?? r?.Size?.X ?? 0),
    y: Number(r?.Size?.y ?? r?.Size?.Y ?? 0),
    z: Number(r?.Size?.z ?? r?.Size?.Z ?? 0),
  };
  const pos = {
    x: Number(r?.Position?.x ?? r?.Position?.X ?? 0),
    y: Number(r?.Position?.y ?? r?.Position?.Y ?? 0),
    z: Number(r?.Position?.z ?? r?.Position?.Z ?? 0),
  };

  const paletteNbt: any[] = Array.isArray(r?.BlockStatePalette) ? r.BlockStatePalette : [];
  const palette = paletteNbt.map(p => ({
    name: String(p?.Name ?? 'minecraft:air'),
    properties: p?.Properties && typeof p.Properties === 'object' ? Object.fromEntries(Object.entries(p.Properties).map(([k, v]) => [String(k), String(v)])) : undefined,
  }));

  const blockStates = r?.BlockStates as LongArrayTag;
  if (!(blockStates instanceof BigInt64Array) && !(blockStates instanceof BigUint64Array)) {
    throw new Error('Invalid litematic: BlockStates not a long[]');
  }

  const total = size.x * size.y * size.z;
  const bpb = bitsNeeded(palette.length);
  const indices = unpackBlockStates(blockStates as any, bpb, total);

  // Convert to our sparse state (we currently only support y 0..319)
  const sizeX = Math.max(1, size.x);
  const sizeZ = Math.max(1, size.z);
  const layers = new Map<number, Map<string, string>>();

  for (let y = 0; y < size.y; y++) {
    const yy = y + pos.y;
    if (yy < 0 || yy > 319) continue;
    for (let z = 0; z < size.z; z++) {
      for (let x = 0; x < size.x; x++) {
        const i = linearIndex(x, y, z, size.x, size.z);
        const pi = indices[i];
        const id = palette[pi]?.name ?? 'minecraft:air';
        if (id === 'minecraft:air') continue;
        // ignore pos.x/pos.z for now; clamp to the editor bounds
        const xx = x + pos.x;
        const zz = z + pos.z;
        if (xx < 0 || zz < 0 || xx >= sizeX || zz >= sizeZ) continue;
        let layer = layers.get(yy);
        if (!layer) {
          layer = new Map();
          layers.set(yy, layer);
        }
        layer.set(`${xx},${zz}`, id);
      }
    }
  }

  return { sizeX, sizeZ, layers };
}

export async function exportLitematic(state: LayerEditorState, name: string) {
  // Single region, origin at 0,0,0
  const sizeX = state.sizeX;
  const sizeZ = state.sizeZ;
  const sizeY = 320; // editor currently fixed 0..319

  // Palette: index 0 is air
  const palette: Array<{ Name: string; Properties?: Record<string, string> }> = [{ Name: 'minecraft:air' }];
  const palIndex = new Map<string, number>([['minecraft:air', 0]]);

  function idx(id: string) {
    let i = palIndex.get(id);
    if (i == null) {
      i = palette.length;
      palette.push({ Name: id });
      palIndex.set(id, i);
    }
    return i;
  }

  const total = sizeX * sizeY * sizeZ;
  const dense = new Uint32Array(total);

  for (const [y, layer] of state.layers.entries()) {
    if (y < 0 || y >= sizeY) continue;
    for (const [k, id] of layer.entries()) {
      const [xs, zs] = k.split(',');
      const x = Number(xs);
      const z = Number(zs);
      if (x < 0 || z < 0 || x >= sizeX || z >= sizeZ) continue;
      dense[linearIndex(x, y, z, sizeX, sizeZ)] = idx(id);
    }
  }

  const bpb = bitsNeeded(palette.length);
  const longs = packBlockStates(dense, bpb);

  const root: any = {
    Version: new Int32(6),
    MinecraftDataVersion: new Int32(3837),
    Metadata: {
      Name: String(name || 'Untitled build'),
      Author: 'Minecraft Schematic Studio',
      Description: 'Exported from Minecraft Schematic Studio',
      TimeCreated: BigInt(Date.now()),
      TimeModified: BigInt(Date.now()),
      EnclosingSize: { x: new Int32(sizeX), y: new Int32(sizeY), z: new Int32(sizeZ) },
    },
    Regions: {
      Region0: {
        Position: { x: new Int32(0), y: new Int32(0), z: new Int32(0) },
        Size: { x: new Int32(sizeX), y: new Int32(sizeY), z: new Int32(sizeZ) },
        BlockStatePalette: palette,
        BlockStates: longs,
      },
    },
  };

  const bytes = await write(new NBTData(root), { endian: 'big', compression: 'gzip', rootName: null });
  // Blob typing in TS can be picky about ArrayBufferLike; Uint8Array is valid at runtime.
  return new Blob([bytes as unknown as BlobPart], { type: 'application/octet-stream' });
}
