import { Drawing, type Brush, type Point } from "$lib/drinfo";
import type { Server } from "$lib/tolower";
import { getDefaultBrush } from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";

export type LayerData = {
  historyContexts: SvelteMap<number, CanvasRenderingContext2D>;
  tmps: SvelteMap<string, { canvas: HTMLCanvasElement | undefined; brush: Brush }>;
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
  drawing: Drawing;
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
  drawing: new Drawing(),
  bg: true,
});
