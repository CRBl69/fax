import { Drawing, type Brush, type InstructionBox, type Point } from "$lib/drinfo";
import type { Server } from "$lib/tolower";
import {
  getDefaultBrush,
  getSecondaryDefaultBrush,
  type Cursor,
  type Tool as ToolServerType,
  ToolType,
} from "$lib/toupper";
import { Tool } from "$lib/toupper/tools";
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
  tool: Tool | null;
  canvasWorker: Worker | null;
  tolerance: number;
  selections: SvelteMap<string, { points: Point[]; closed: boolean }>;
  cursors: SvelteMap<string, Cursor | null>;
  inProgressTick: number;
  username: string;
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
  tool: null,
  canvasWorker: null,
  tolerance: 0,
  selections: new SvelteMap(),
  cursors: new SvelteMap(),
  inProgressTick: 0,
  username: "",
});

export const getStateTool = (gs: GlobalState): ToolServerType | null => {
  if (gs.tool === null) return null;
  const toolType = gs.tool.getToolType();
  if (
    toolType === ToolType.Bucket ||
    toolType === ToolType.Eraser ||
    toolType === ToolType.Stroke
  ) {
    return {
      type: toolType,
      brush: gs.brush,
    };
  }
  return { type: toolType };
};
