import type { Drawing, InstructionBox } from "$lib/drinfo";
import type { InProgressEntry } from "$lib/state.svelte";
import { SvelteMap } from "svelte/reactivity";
import { applyInstruction } from "./instruction";

export type SnapshotCallback = (layer: string, data: string, index: number) => void;

const SNAPSHOT_INTERVAL = 20;

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  readonly drawing: Drawing;
  readonly imageCache = new SvelteMap<string, HTMLImageElement>();
  // Layer => UUID => entry
  private inProgress: Map<string, Map<string, InProgressEntry>>;
  // Layer => History index => data
  private layerHistoryCanvases = new SvelteMap<string, Map<number, OffscreenCanvas>>();
  private onSnapshot?: SnapshotCallback;

  constructor(
    canvas: HTMLCanvasElement,
    drawing: Drawing,
    inProgress: Map<string, Map<string, InProgressEntry>>,
    onSnapshot?: SnapshotCallback,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.drawing = drawing;
    this.inProgress = inProgress;
    this.onSnapshot = onSnapshot;
  }

  async render(): Promise<void> {
    const w = this.drawing.width;
    const h = this.drawing.height;
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;

    this.ctx.clearRect(0, 0, w, h);

    for (const layerName of this.drawing.layerOrder) {
      const layer = this.drawing.layers.get(layerName);
      if (!layer || !layer.visible) continue;

      await this.ensureLayerContext(layerName, layer.historyIndex);

      const context = this.getContext(layerName, layer.historyIndex);
      if (context) {
        this.ctx.drawImage(context, 0, 0);
      }

      const inProgress = this.inProgress.get(layerName);
      if (inProgress) {
        for (const [, entry] of inProgress) {
          if (entry.instructionBox.applied) {
            await applyInstruction(entry.instructionBox.instruction, this.ctx, this.imageCache);
          }
        }
      }
    }
  }

  getPNG(): string {
    return this.canvas.toDataURL("image/png");
  }

  getLayerCanvas(layer: string): OffscreenCanvas | undefined {
    const historyIndex = this.drawing.layers.get(layer)?.historyIndex;
    if (historyIndex === undefined) return undefined;
    return this.layerHistoryCanvases.get(layer)?.get(historyIndex);
  }

  private getContext(layerName: string, index: number): OffscreenCanvas | null {
    return this.layerHistoryCanvases.get(layerName)?.get(index) ?? null;
  }

  private async ensureLayerContext(layerName: string, targetIndex: number): Promise<void> {
    let contexts = this.layerHistoryCanvases.get(layerName);
    if (!contexts) {
      contexts = new Map();
      this.layerHistoryCanvases.set(layerName, contexts);
    }

    if (contexts.has(targetIndex)) return;

    const w = this.drawing.width;
    const h = this.drawing.height;

    if (!contexts.has(0)) {
      const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
      contexts.set(0, ctx.canvas);
    }

    if (targetIndex === 0) return;

    const layer = this.drawing.layers.get(layerName);
    if (!layer) return;

    let currentIndex = this.findClosestContext(contexts, targetIndex);

    const snapshot = this.drawing.getSnapshotBefore(layerName, targetIndex);
    if (snapshot && snapshot[0] > currentIndex && snapshot[0] <= targetIndex) {
      const image = await this.loadImage(snapshot[1]);
      const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(image, 0, 0);
      contexts.set(snapshot[0], ctx.canvas);
      currentIndex = snapshot[0];
    }

    await this.replayInstructions(
      layerName,
      layer.history,
      currentIndex,
      targetIndex,
      contexts,
      w,
      h,
    );
  }

  private async replayInstructions(
    layerName: string,
    history: InstructionBox[],
    from: number,
    to: number,
    contexts: Map<number, OffscreenCanvas>,
    w: number,
    h: number,
  ): Promise<void> {
    let current = from;

    for (let i = from; i < to; i++) {
      const instructionBox = history[i];
      if (!instructionBox) break;

      const prevContext = contexts.get(current)!;
      const newCanvas = new OffscreenCanvas(w, h);
      const newCtx = newCanvas.getContext("2d")!;
      newCtx.drawImage(prevContext, 0, 0);

      if (instructionBox.applied) {
        await applyInstruction(instructionBox.instruction, newCtx, this.imageCache);
      }

      current++;

      for (const key of contexts.keys()) {
        if (key > current) {
          contexts.delete(key);
        }
      }

      contexts.set(current, newCanvas);

      if (current % SNAPSHOT_INTERVAL === 0 && this.onSnapshot) {
        const blob = await newCanvas.convertToBlob();
        const data = await this.blobToDataUrl(blob);
        this.onSnapshot(layerName, data, current);
      }
    }
  }

  private findClosestContext(contexts: Map<number, OffscreenCanvas>, target: number): number {
    let closest = 0;
    for (const index of contexts.keys()) {
      if (index > closest && index <= target) {
        closest = index;
      }
    }
    return closest;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
