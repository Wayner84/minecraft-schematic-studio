import type { LayerEditorState } from '../ui/LayerEditor';

export type AppState = {
  editor: LayerEditorState;
};

export function createEmptyEditorState(sizeX = 128, sizeZ = 128): LayerEditorState {
  return { sizeX, sizeZ, layers: new Map() };
}
