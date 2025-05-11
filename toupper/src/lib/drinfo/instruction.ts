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
};

export type Instruction = Stroke | Motion | ImageInsertion;

export type InstructionBox = {
  instruction: Instruction;
  uuid: string;
};
