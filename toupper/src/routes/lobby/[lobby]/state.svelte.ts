import type { Brush, InstructionBox, Point } from "$lib/drinfo";
import type { Server } from "$lib/tolower";
import { getDefaultBrush } from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";

export type LayerData = {
  historyIndex: number,
  historyContexts: SvelteMap<number, CanvasRenderingContext2D>,
  history: InstructionBox[],
  tmps: SvelteMap<string, {canvas: HTMLCanvasElement | undefined, brush: Brush}>,
};

interface GlobalState {
  cursorPosition: Point | null;
  brush: Brush;
  ratio: number;
  zoom: boolean;
  zoomRatio: number;
  server: Server | null;
  selectedLayer: string | null;
  layerData: SvelteMap<string, LayerData>;
  bg: boolean;
}

export const gs: GlobalState = $state({
  cursorPosition: null,
  brush: getDefaultBrush(),
  ratio: 0,
  zoom: true,
  zoomRatio: 1,
  server: null,
  selectedLayer: null,
  layerData: new SvelteMap(),
  bg: true,
});
