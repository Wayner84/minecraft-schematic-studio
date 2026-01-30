export type BlockDef = {
  id: string; // minecraft id
  name: string; // display
  category: 'terrain' | 'wood' | 'stone' | 'glass' | 'wool' | 'misc';
  color: string; // UI colour hint (hex)
};

// Starter palette (building blocks). Data-driven so we can swap/extend later.
export const BLOCKS: BlockDef[] = [
  { id: 'minecraft:air', name: 'Air', category: 'misc', color: '#0b0f14' },

  // Terrain
  { id: 'minecraft:grass_block', name: 'Grass Block', category: 'terrain', color: '#4a7c3a' },
  { id: 'minecraft:dirt', name: 'Dirt', category: 'terrain', color: '#6b4f2a' },
  { id: 'minecraft:sand', name: 'Sand', category: 'terrain', color: '#d7cf8a' },

  // Stone
  { id: 'minecraft:stone', name: 'Stone', category: 'stone', color: '#8b8b8b' },
  { id: 'minecraft:cobblestone', name: 'Cobblestone', category: 'stone', color: '#7a7a7a' },
  { id: 'minecraft:deepslate', name: 'Deepslate', category: 'stone', color: '#3e3e3e' },

  // Wood
  { id: 'minecraft:oak_planks', name: 'Oak Planks', category: 'wood', color: '#b38b52' },
  { id: 'minecraft:oak_log', name: 'Oak Log', category: 'wood', color: '#7f5a34' },

  // Glass
  { id: 'minecraft:glass', name: 'Glass', category: 'glass', color: '#bfe7ff' },

  // Wool (basic)
  { id: 'minecraft:white_wool', name: 'White Wool', category: 'wool', color: '#eeeeee' },
  { id: 'minecraft:red_wool', name: 'Red Wool', category: 'wool', color: '#c43a3a' },
  { id: 'minecraft:blue_wool', name: 'Blue Wool', category: 'wool', color: '#2f5fbf' },
  { id: 'minecraft:black_wool', name: 'Black Wool', category: 'wool', color: '#1f1f1f' },
];

export const DEFAULT_BLOCK_ID = 'minecraft:stone';

export function getBlockById(id: string): BlockDef {
  return BLOCKS.find(b => b.id === id) ?? BLOCKS[0];
}
