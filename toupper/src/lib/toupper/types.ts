import type { Brush, Point } from "$lib/drinfo";

export type Cursor = {
  tool: Tool;
  point: Point;
};

export type User = {
  name: string;
  cursor?: Cursor;
};

export type Dimensions = {
  width: number;
  height: number;
};

export type Tool = {
  type: ToolType.Stroke,
  brush: Brush,
} | {
  type: ToolType.Eraser,
  brush: Brush,
} | {
  type: ToolType.InsertImage,
} | {
  type: ToolType.PickColor,
} | {
  type: ToolType.Bucket,
  brush: Brush,
} | {
  type: ToolType.Select,
} | {
  type: ToolType.PolySelect,
} | {
  type: ToolType.Move,
};

export enum ToolType {
  Stroke,
  Eraser,
  InsertImage,
  PickColor,
  Bucket,
  Select,
  PolySelect,
  Move,
}
