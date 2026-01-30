import { WORLD_MAX_Y, WORLD_MIN_Y } from '../model/world';

export type PlacedBlock = { x: number; y: number; z: number; id: string; props?: Record<string, string | number | boolean> };

export type BuildFileV0 = {
  version: 0;
  name: string;
  size: { x: number; y: number; z: number };
  blocks: PlacedBlock[]; // sparse; air omitted
};

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readJsonFile(file: File): Promise<any> {
  const text = await file.text();
  return JSON.parse(text);
}

export function clampY(y: number) {
  if (y < WORLD_MIN_Y) return WORLD_MIN_Y;
  if (y > WORLD_MAX_Y) return WORLD_MAX_Y;
  return y;
}
