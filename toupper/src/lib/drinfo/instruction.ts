import type { Brush } from "./brush";
import type { Point } from "./point";

export type Stroke = {
  points: Point[];
  brush: Brush;
};

export type Motion = {
  start: Point;
  end: Point;
  selection: [Point, Point];
};

export type ImageInsertion = {
  base64: string;
  point: Point;
  scale: Point;
  rotate: number;
};

export type Bucket = {
  point: Point;
  brush: Brush;
};

export type Instruction = Stroke | Motion | ImageInsertion | Bucket;

export type InstructionBox = {
  instruction: Instruction;
  uuid: string;
  applied: boolean;
};
