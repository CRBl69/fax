import { SvelteMap } from "svelte/reactivity";
import type { Layer } from "./layer";

export const LAYER_NOT_FOUND_ERROR = "Layer not found.";
export const LAYER_UNDO_ERROR = "Layer cannot be undone anymore.";
export const LAYER_REDO_ERROR = "Layer cannot be redone anymore.";
export const LAYER_DOWN_ERROR = "Layer cannot be moved down anymore.";
export const LAYER_UP_ERROR = "Layer cannot be moved up anymore.";

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
    if(drawingData?.layers) {
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
    this.layers.set(name, {
      history: [],
      visible: true,
      historyIndex: 0,
    });
  }

  layerUp(name: string) {
    const layerIndex = this.layerOrder.indexOf(name);
    if (layerIndex === -1) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if(layerIndex === this.layerOrder.length - 1) {
      throw LAYER_UP_ERROR;
    }
    [this.layerOrder[layerIndex], this.layerOrder[layerIndex + 1]] = [this.layerOrder[layerIndex + 1], this.layerOrder[layerIndex]];
  }

  layerDown(name: string) {
    const layerIndex = this.layerOrder.indexOf(name);
    if (layerIndex === -1) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if(layerIndex === 0) {
      throw LAYER_DOWN_ERROR;
    }
    [this.layerOrder[layerIndex], this.layerOrder[layerIndex - 1]] = [this.layerOrder[layerIndex - 1], this.layerOrder[layerIndex]];
  }

  toggleLayerVisibility(name: string) {
    const layer = this.layers.get(name);
    if(!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    layer.visible = !layer.visible;
    this.layers.delete(name);
    this.layers.set(name, layer);
  }

  undo(layerName: string) {
    const layer = this.layers.get(layerName);
    if(!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if(layer.historyIndex == 0) {
      throw LAYER_UNDO_ERROR;
    }
    layer.historyIndex -= 1;
    this.layers.delete(layerName);
    this.layers.set(layerName, layer);
  }

  redo(layerName: string) {
    const layer = this.layers.get(layerName);
    if(!layer) {
      throw LAYER_NOT_FOUND_ERROR;
    }
    if(layer.historyIndex == layer.history.length) {
      throw LAYER_REDO_ERROR;
    }
    layer.historyIndex += 1;
    this.layers.delete(layerName);
    this.layers.set(layerName, layer);
  }
};
