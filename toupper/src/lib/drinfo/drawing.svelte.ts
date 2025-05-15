import { SvelteMap } from "svelte/reactivity";
import { Layer } from "./layer.svelte";
import type { InstructionBox } from "./instruction";

export const LAYER_NOT_FOUND_ERROR = "Layer not found.";
export const LAYER_UNDO_ERROR = "Layer cannot be undone anymore.";
export const LAYER_REDO_ERROR = "Layer cannot be redone anymore.";
export const LAYER_DOWN_ERROR = "Layer cannot be moved down anymore.";
export const LAYER_UP_ERROR = "Layer cannot be moved up anymore.";
export const LAYER_HISTORY_ERROR = "Layer history element cannot be toggled.";

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

  toggleLayerVisibility(name: string) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.visible = !layer.visible;
    this.layers.delete(name);
    this.layers.set(name, layer);
  }

  toggleHistoryElement(name: string, index: number) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layer.historyIndex < index || index < 0) {
      throw LAYER_HISTORY_ERROR;
    }
    layer.history.get(index)!.applied = !layer.history.get(index)!.applied;
    for (const snapshotIndex of layer.snapshots.keys()) {
      if (snapshotIndex >= index) {
        layer.snapshots.delete(snapshotIndex);
      }
    }
    this.layers.set(name, layer);
  }

  instruct(name: string, instructionBox: InstructionBox) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.historyIndex += 1;
    for (const key of layer.history.keys()) {
      if (key > layer.historyIndex) {
        layer.history.delete(key);
      }
    }
    layer.history.set(layer.historyIndex, instructionBox);
  }

  snapshot(name: string, data: string) {
    const layer = this.layers.get(name);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.snapshots.set(layer.historyIndex, data);
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
      if (greatestSnapshotIndex == null) {
        greatestSnapshotIndex = snapshotIndex;
        greatestSnapshot = snapshot;
      } else if (snapshotIndex < index && snapshotIndex > greatestSnapshotIndex) {
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
    if (layer.historyIndex == 0) {
      throw LAYER_UNDO_ERROR;
    }
    layer.historyIndex -= 1;
    this.layers.delete(layerName);
    this.layers.set(layerName, layer);
  }

  redo(layerName: string) {
    const layer = this.layers.get(layerName);
    if (!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if (layer.historyIndex == layer.history.size) {
      throw LAYER_REDO_ERROR;
    }
    layer.historyIndex += 1;
    this.layers.delete(layerName);
    this.layers.set(layerName, layer);
  }
}
