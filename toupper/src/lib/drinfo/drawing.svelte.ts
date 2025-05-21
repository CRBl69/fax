import { SvelteMap } from "svelte/reactivity";
import { Layer } from "./layer.svelte";
import type { InstructionBox } from "./instruction";

export const LAYER_NOT_FOUND_ERROR = "Layer not found.";
export const LAYER_UNDO_ERROR = "Layer cannot be undone anymore.";
export const LAYER_REDO_ERROR = "Layer cannot be redone anymore.";
export const LAYER_DOWN_ERROR = "Layer cannot be moved down anymore.";
export const LAYER_UP_ERROR = "Layer cannot be moved up anymore.";
export const LAYER_HISTORY_ERROR = "Layer history element visibility cannot be set.";
export const LAYER_SET_HISTORY_INDEX_ERROR = "New layer history index is invalid.";

export interface DrawingData {
  layers: SvelteMap<string, Layer>;
  layerOrder: string[];
  width: number;
  height: number;
}

export class Drawing {
  layers: SvelteMap<string, Layer> = $state(new SvelteMap());
  layerOrder: string[] = $state([]);
  width: number = $state(1920);
  height: number = $state(1080);

  constructor(drawingData?: Partial<DrawingData>) {
    if (drawingData?.layers) {
      for (const [name, value] of drawingData.layers.entries()) {
        this.layers.set(name, value);
      }
    }
    this.layerOrder = drawingData?.layerOrder ?? [];
    this.height = drawingData?.height ?? 1080;
    this.width = drawingData?.width ?? 1920;
  }

  addLayer(name: string) {
    this.layerOrder.push(name);
    this.layers.set(name, new Layer());
  }

  layerUp(name: string) {
    const layerIndex = this.layerOrder.indexOf(name);
    if (layerIndex === -1) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layerIndex === this.layerOrder.length - 1) {
      throw LAYER_UP_ERROR;
    }
    [this.layerOrder[layerIndex], this.layerOrder[layerIndex + 1]] = [
      this.layerOrder[layerIndex + 1],
      this.layerOrder[layerIndex],
    ];
  }

  layerDown(name: string) {
    const layerIndex = this.layerOrder.indexOf(name);
    if (layerIndex === -1) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layerIndex === 0) {
      throw LAYER_DOWN_ERROR;
    }
    [this.layerOrder[layerIndex], this.layerOrder[layerIndex - 1]] = [
      this.layerOrder[layerIndex - 1],
      this.layerOrder[layerIndex],
    ];
  }

  setLayerVisibility(name: string, visible: boolean) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.visible = visible;
  }

  setHistoryElementVisibility(name: string, index: number, visible: boolean) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (index > layer.history.length) {
      throw LAYER_HISTORY_ERROR;
    }
    layer.history[index - 1]!.applied = visible;
    for (const snapshotIndex of layer.snapshots.keys()) {
      if (snapshotIndex >= index) {
        layer.snapshots.delete(snapshotIndex);
      }
    }
  }

  instruct(name: string, instructionBox: InstructionBox) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.history = layer.history.slice(0, layer.historyIndex);
    layer.historyIndex += 1;
    layer.history.push(instructionBox);
    for (const snapshotIndex of layer.snapshots.keys()) {
      if (snapshotIndex >= layer.historyIndex) {
        layer.snapshots.delete(snapshotIndex);
      }
    }
  }

  snapshot(name: string, data: string, index: number) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.snapshots.set(index, data);
    this.layers.set(name, layer);
  }

  getSnapshot(name: string, index: number) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    return layer.snapshots.get(index);
  }

  getSnapshotBefore(name: string, index: number): [number, string] | null {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    let greatestSnapshotIndex: number | null = null;
    let greatestSnapshot: string | null = null;
    for (const [snapshotIndex, snapshot] of layer.snapshots.entries()) {
      if (greatestSnapshotIndex == null && snapshotIndex <= index) {
        greatestSnapshotIndex = snapshotIndex;
        greatestSnapshot = snapshot;
      } else if (snapshotIndex <= index && snapshotIndex > (greatestSnapshotIndex ?? 0)) {
        greatestSnapshotIndex = snapshotIndex;
        greatestSnapshot = snapshot;
      }
    }
    return greatestSnapshotIndex !== null ? [greatestSnapshotIndex, greatestSnapshot!] : null;
  }

  undo(layerName: string) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layer.historyIndex > 0) {
      layer.historyIndex -= 1;
    } else {
      throw LAYER_UNDO_ERROR;
    }
  }

  redo(layerName: string) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layer.historyIndex < layer.history.length) {
      layer.historyIndex += 1;
    } else {
      throw LAYER_REDO_ERROR;
    }
  }

  setHistoryIndex(layerName: string, newHistoryIndex: number) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (newHistoryIndex >= 0 && newHistoryIndex <= layer.history.length) {
      layer.historyIndex = newHistoryIndex;
    } else {
      throw LAYER_SET_HISTORY_INDEX_ERROR;
    }
  }

  moveInstruction(layerName: string, oldInstructionIndex: number, newInstructionIndex: number) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (newInstructionIndex >= 0 && newInstructionIndex <= layer.history.length && oldInstructionIndex >= 0 && oldInstructionIndex <= layer.history.length) {
      const [intruction] = layer.history.splice(oldInstructionIndex - 1, 1);
      layer.history.splice(newInstructionIndex - 1, 0, intruction);
    } else {
      throw LAYER_SET_HISTORY_INDEX_ERROR;
    }
  }
}
