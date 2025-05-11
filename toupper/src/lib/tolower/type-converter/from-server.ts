import * as DrInFo from "$lib/drinfo";
import * as ToUpper from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";
import type { Brush, BrushShape, Color, Cursor, Drawing, ImageInsertion, Instruction, InstructionBox, Layer, Motion, Stroke } from "../server-types";

export class FromServer {
  static color(color: Color): DrInFo.Color {
    return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}${color.a.toString(16).padStart(2, "0")}`;
  }

  static brushShape(brushShape: BrushShape): DrInFo.BrushShape {
    if (brushShape === "Circle") {
      return {
        shape: "circle",
      };
    }
    if (brushShape === "Square") {
      return {
        shape: "square",
      };
    }
    return {
      shape: "custom",
      customShape: brushShape.Custom.points,
    };
  }

  static brush(brush: Brush): DrInFo.Brush {
    return {
      brushShape: FromServer.brushShape(brush.brush_shape),
      color: FromServer.color(brush.color),
      width: brush.width,
      diffusion: brush.diffusion,
      erase: brush.erase,
    }
  }

  static stroke({ Stroke: stroke }: Stroke): DrInFo.Stroke {
    return {
      brush: FromServer.brush(stroke.brush),
      points: stroke.points,
    }
  }

  static motion({ Motion: motion }: Motion): DrInFo.Motion {
    return motion;
  }

  static imageInsertion({ ImageInsertion: imageInsertion }: ImageInsertion): DrInFo.ImageInsertion {
    return imageInsertion;
  }

  static instruction(instruction: Instruction): DrInFo.Instruction {
    if ('Stroke' in instruction) {
      return FromServer.stroke(instruction);
    }
    if ('Motion' in instruction) {
      return FromServer.motion(instruction);
    }
    return FromServer.imageInsertion(instruction);
  }

  static instructionBox(instructionBox: InstructionBox): DrInFo.InstructionBox {
    return {
      instruction: FromServer.instruction(instructionBox.instruction),
      uuid: instructionBox.uuid,
    };
  }

  static layer(layer: Layer): DrInFo.Layer {
    return {
      history: layer.history.map(FromServer.instructionBox),
      visible: layer.visible,
      historyIndex: layer.history_index,
    }
  }

  static drawing(drawing: Drawing): DrInFo.Drawing {
    const layers: [string,DrInFo.Layer][] = Object.entries(drawing.layers).map(([k, v], _) => [k, FromServer.layer(v)]);
    return new DrInFo.Drawing({
      height: drawing.height,
      width: drawing.width,
      layerOrder: drawing.layer_order,
      layers: new SvelteMap(layers),
    });
  }

  static cursor(cursor: Cursor): ToUpper.Cursor {
    return {
      brush: FromServer.brush(cursor.brush),
      point: cursor.point,
    };
  }
}
