import { Drawing, type Brush, type InstructionBox, type Point } from "$lib/drinfo";
import type { Server } from "$lib/tolower";
import {
  getDefaultBrush,
  getSecondaryDefaultBrush,
  type Cursor,
  type Tool,
  ToolType,
} from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";

export type LayerData = {
  historyContexts: SvelteMap<number, CanvasRenderingContext2D>;
  currentCanvas: HTMLCanvasElement | null;
  inProgress: SvelteMap<string, InProgressEntry>;
};

export type InProgressEntry = {
  instructionBox: InstructionBox;
  layer: string;
  username: string;
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
  toolType: ToolType;
  canvasWorker: Worker | null;
  tolerance: number;
  userMoveStart: Point | null;
  selections: SvelteMap<string, { points: Point[]; closed: boolean }>;
  users: SvelteMap<string, Cursor | null>;
  inProgressTick: number;
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
  toolType: ToolType.Stroke,
  canvasWorker: null,
  tolerance: 0,
  userMoveStart: null,
  selections: new SvelteMap(),
  users: new SvelteMap(),
  inProgressTick: 0,
});

export const getStateTool = (gs: GlobalState): Tool => {
  if (
    gs.toolType === ToolType.Bucket ||
    gs.toolType === ToolType.Eraser ||
    gs.toolType === ToolType.Stroke
  ) {
    return {
      type: gs.toolType,
      brush: gs.brush,
    };
  }
  return { type: gs.toolType };
};
