import * as DrInFo from "$lib/drinfo";
import * as ToUpper from "$lib/toupper";
import { SvelteMap } from "svelte/reactivity";
import type {
  Brush,
  BrushShape,
  Bucket,
  Color,
  Cursor,
  Drawing,
  ImageInsertion,
  Instruction,
  InstructionBox,
  Layer,
  Motion,
  Stroke,
} from "../server-types";

export class FromServer {
  static color(color: Color): DrInFo.Color {
    return `#${color.r.toString(16).padStart(2, "0")}${color.g.toString(16).padStart(2, "0")}${color.b.toString(16).padStart(2, "0")}`;
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
      opacity: brush.opacity,
      erase: brush.erase,
    };
  }

  static stroke({ Stroke: stroke }: Stroke): DrInFo.Stroke {
    return {
      brush: FromServer.brush(stroke.brush),
      points: stroke.points,
    };
  }

  static motion({ Motion: motion }: Motion): DrInFo.Motion {
    return motion;
  }

  static imageInsertion({ ImageInsertion: imageInsertion }: ImageInsertion): DrInFo.ImageInsertion {
    return imageInsertion;
  }

  static bucket({ Bucket: bucket }: Bucket): DrInFo.Bucket {
    return {
      point: bucket.point,
      brush: FromServer.brush(bucket.brush),
    };
  }

  static instruction(instruction: Instruction): DrInFo.Instruction {
    if ("Stroke" in instruction) {
      return FromServer.stroke(instruction);
    }
    if ("Motion" in instruction) {
      return FromServer.motion(instruction);
    }
    if ("ImageInsertion" in instruction) {
      return FromServer.imageInsertion(instruction);
    }
    if ("Bucket" in instruction) {
      return FromServer.bucket(instruction);
    }
    throw new Error("Unknown instruction type.");
  }

  static instructionBox(instructionBox: InstructionBox): DrInFo.InstructionBox {
    return {
      instruction: FromServer.instruction(instructionBox.instruction),
      uuid: instructionBox.uuid,
      applied: instructionBox.applied,
    };
  }

  static layer(layer: Layer): DrInFo.Layer {
    const drinfoLayer = new DrInFo.Layer();
    drinfoLayer.historyIndex = layer.history_index;
    drinfoLayer.visible = layer.visible;
    for (const instructionBox of layer.history) {
      drinfoLayer.history.push(FromServer.instructionBox(instructionBox));
    }
    for (const [index, snapshot] of Object.entries(layer.snapshots)) {
      drinfoLayer.snapshots.set(parseInt(index), snapshot);
    }
    return drinfoLayer;
  }

  static drawing(drawing: Drawing): DrInFo.Drawing {
    const layers: [string, DrInFo.Layer][] = Object.entries(drawing.layers).map(([k, v]) => [
      k,
      FromServer.layer(v),
    ]);
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
