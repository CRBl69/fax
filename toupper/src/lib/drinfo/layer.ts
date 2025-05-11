import type { InstructionBox } from "./instruction";

export type Layer = {
  history: InstructionBox[],
  historyIndex: number,
  visible: boolean,
};
