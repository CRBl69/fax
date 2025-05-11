import * as DrInFo from "../drinfo";

export type Point = DrInFo.Point;

export type Color = {
  r: number,
  g: number,
  b: number,
  a: number,
};

export type BrushShape = "Circle" | "Square" | { Custom: {
  points: Point[][]
}};

export type Brush = {
  brush_shape: BrushShape,
  color: Color,
  width: number,
  diffusion: number,
  erase: boolean,
};

export type Stroke = {
  Stroke: {
    points: Point[],
    brush: Brush,
  },
};

export type Motion = {
  Motion: DrInFo.Motion,
};

export type ImageInsertion = {
  ImageInsertion: DrInFo.ImageInsertion,
};

export type Instruction = Stroke | Motion | ImageInsertion;

export type InstructionBox = {
  instruction: Instruction,
  uuid: string,
}

export type InstructionMessage = {
  Instruction: {
    layer: string;
    instruction: InstructionBox;
  };
};

export type Layer = {
  history: InstructionBox[],
  history_index: number,
  visible: boolean,
};

export type RequestInitMessage = "RequestInit";

export type Drawing = {
  height: number;
  width: number;
  layers: {
    [index: string]: Layer;
  };
  layer_order: string[];
}

export type InitMessage = {
  Init: {
    drawing: Drawing;
    users: string[];
  };
};

export type Cursor = {
  point: Point;
  brush: Brush;
}

export type CursorInMessage = {
  CursorIn: Cursor | null;
};

export type CursorOutMessage = {
  CursorOut: {
    cursor: Cursor | null,
    username: string;
  };
};

export type TempDrawMessage = {
  TempDraw: {
    brush: Brush;
    uuid: string;
    start: Point;
    end: Point;
    layer: string;
  };
};

export type ToggleLayerVisibilityMessage = {
  ToggleLayerVisibility: string;
};

export type UndoMessage = {
  Undo: string;
};

export type RedoMessage = {
  Redo: string;
};

export type AddLayerMessage = {
  AddLayer: string;
};

export type LayerUpMessage = {
  LayerUp: string;
};

export type LayerDownMessage = {
  LayerDown: string;
};

export type JoinMessage = {
  Join: string;
};

export type WebSocketMessage =
  | CursorInMessage
  | CursorOutMessage
  | InstructionMessage
  | ToggleLayerVisibilityMessage
  | AddLayerMessage
  | LayerUpMessage
  | LayerDownMessage
  | UndoMessage
  | RedoMessage
  | RequestInitMessage
  | InitMessage
  | JoinMessage
  | TempDrawMessage;
