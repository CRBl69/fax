import { Drawing, type Brush, type InstructionBox, type Point } from "$lib/drinfo";
import type { Server } from "$lib/tolower";
import { getDefaultBrush, getSecondaryDefaultBrush, Tool } from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";

export type LayerData = {
  historyContexts: SvelteMap<number, CanvasRenderingContext2D>;
  tmps: SvelteMap<string, { canvas: HTMLCanvasElement | undefined; brush: Brush }>;
};

interface GlobalState {
  cursorPosition: Point | null;
  brush: Brush;
  secondaryBrush: Brush;
  ratio: number;
  zoom: boolean;
  zoomRatio: number;
  server: Server | null;
  selectedLayer: string | null;
  layerData: SvelteMap<string, LayerData>;
  drawing: Drawing;
  bg: boolean;
  instructionBox: InstructionBox | null;
  hoveredInstruction: InstructionBox | null;
  images: SvelteMap<string, HTMLImageElement>;
  draggedInstruction: number | null;
  tool: Tool;
  canvasWorker: Worker | null;
  tolerance: number;
  selection: Point[] | null;
  selectionStart: Point | null;
  polyDraft: Point[] | null;
  moveGrab: Point | null;
  tempSelects: SvelteMap<string, { points: Point[]; closed: boolean }>;
}

export const gs: GlobalState = $state({
  cursorPosition: null,
  brush: getDefaultBrush(),
  secondaryBrush: getSecondaryDefaultBrush(),
  ratio: 0,
  zoom: false,
  zoomRatio: 2,
  server: null,
  selectedLayer: null,
  layerData: new SvelteMap(),
  drawing: new Drawing(),
  bg: true,
  instructionBox: null,
  hoveredInstruction: null,
  images: new SvelteMap(),
  draggedInstruction: null,
  tool: Tool.Stroke,
  canvasWorker: null,
  tolerance: 0,
  selection: null,
  selectionStart: null,
  polyDraft: null,
  moveGrab: null,
  tempSelects: new SvelteMap(),
});
