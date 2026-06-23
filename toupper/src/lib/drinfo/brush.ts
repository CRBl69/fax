import type { Point } from "./point";

export type Color = `#${string}`;

export type Brush = {
  brushShape: BrushShape;
  color: Color;
  width: number;
  hardness: number;
  opacity: number;
  erase: boolean;
  repeat: number;
};

export type BrushShape = {
  shape: "circle" | "square" | "custom";
  customShape?: Point[][];
};
