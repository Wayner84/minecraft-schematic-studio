export type BlockId = string;

export type BlockState = {
  id: BlockId; // e.g. "minecraft:stone"
  // Minimal blockstate storage for now. We'll refine for 1.21.x.
  props?: Record<string, string | number | boolean>;
};

export const WORLD_MIN_Y = 0;
export const WORLD_MAX_Y = 319;

export const CHUNK_SIZE_XZ = 16;
export const SECTION_HEIGHT = 16;

export type ChunkKey = string; // "cx,cz"
export function chunkKey(cx: number, cz: number): ChunkKey {
  return `${cx},${cz}`;
}

// A chunk is split into vertical sections (0..19 for 0..319)
export class Chunk {
  cx: number;
  cz: number;
  // Map sectionY -> Uint32 palette indices, for now store as Map<index, BlockState>
  // We'll replace with palette + packed arrays.
  sections: Map<number, Map<number, BlockState>> = new Map();

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
  }

  private getSection(sy: number) {
    let sec = this.sections.get(sy);
    if (!sec) {
      sec = new Map();
      this.sections.set(sy, sec);
    }
    return sec;
  }

  set(x: number, y: number, z: number, block: BlockState) {
    const sy = Math.floor(y / SECTION_HEIGHT);
    const lx = x & 15;
    const lz = z & 15;
    const ly = y & 15;
    const idx = (ly * 16 + lz) * 16 + lx;
    this.getSection(sy).set(idx, block);
  }

  get(x: number, y: number, z: number): BlockState | null {
    const sy = Math.floor(y / SECTION_HEIGHT);
    const sec = this.sections.get(sy);
    if (!sec) return null;
    const lx = x & 15;
    const lz = z & 15;
    const ly = y & 15;
    const idx = (ly * 16 + lz) * 16 + lx;
    return sec.get(idx) ?? null;
  }
}

export class World {
  chunks: Map<ChunkKey, Chunk> = new Map();

  getChunk(cx: number, cz: number): Chunk {
    const key = chunkKey(cx, cz);
    let c = this.chunks.get(key);
    if (!c) {
      c = new Chunk(cx, cz);
      this.chunks.set(key, c);
    }
    return c;
  }

  setBlock(x: number, y: number, z: number, block: BlockState) {
    if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return;
    const cx = Math.floor(x / CHUNK_SIZE_XZ);
    const cz = Math.floor(z / CHUNK_SIZE_XZ);
    this.getChunk(cx, cz).set(x, y, z, block);
  }

  getBlock(x: number, y: number, z: number): BlockState | null {
    if (y < WORLD_MIN_Y || y > WORLD_MAX_Y) return null;
    const cx = Math.floor(x / CHUNK_SIZE_XZ);
    const cz = Math.floor(z / CHUNK_SIZE_XZ);
    const key = chunkKey(cx, cz);
    const c = this.chunks.get(key);
    if (!c) return null;
    return c.get(x, y, z);
  }
}
