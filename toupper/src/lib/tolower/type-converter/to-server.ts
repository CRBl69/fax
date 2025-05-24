import * as DrInFo from "$lib/drinfo";
import type {
  Brush,
  BrushShape,
  Bucket,
  Color,
  ImageInsertion,
  Instruction,
  InstructionBox,
  Motion,
  Stroke,
} from "../server-types";

export class ToServer {
  static color(color: DrInFo.Color): Color {
    let data: string = color.substring(1);
    if (data.length === 3 || data.length === 4) {
      data = data
        .split("")
        .map((e) => `${e}${e}`)
        .join("");
    }
    const red = data.substring(0, 2);
    const green = data.substring(2, 4);
    const blue = data.substring(4, 6);
    return {
      r: parseInt(red, 16),
      g: parseInt(green, 16),
      b: parseInt(blue, 16),
    };
  }

  static brushShape(brushShape: DrInFo.BrushShape): BrushShape {
    if (brushShape.shape === "circle") {
      return "Circle";
    }
    if (brushShape.shape === "square") {
      return "Square";
    }
    return {
      Custom: {
        points: brushShape.customShape!,
      },
    };
  }

  static brush(brush: DrInFo.Brush): Brush {
    return {
      brush_shape: ToServer.brushShape(brush.brushShape),
      color: ToServer.color(brush.color),
      width: brush.width,
      diffusion: brush.diffusion,
      opacity: brush.opacity,
      erase: brush.erase,
    };
  }

  static stroke(stroke: DrInFo.Stroke): Stroke {
    return {
      Stroke: {
        brush: ToServer.brush(stroke.brush),
        points: stroke.points,
      },
    };
  }

  static motion(motion: DrInFo.Motion): Motion {
    return {
      Motion: motion,
    };
  }

  static imageInsertion(imageInsertion: DrInFo.ImageInsertion): ImageInsertion {
    return {
      ImageInsertion: imageInsertion,
    };
  }

  static bucket(bucket: DrInFo.Bucket): Bucket {
    return {
      Bucket: {
        point: bucket.point,
        brush: ToServer.brush(bucket.brush),
      },
    };
  }

  static instruction(instruction: DrInFo.Instruction): Instruction {
    if ("points" in instruction) {
      return ToServer.stroke(instruction);
    }
    if ("selection" in instruction) {
      return ToServer.motion(instruction);
    }
    if ("base64" in instruction) {
      return ToServer.imageInsertion(instruction);
    }
    return ToServer.bucket(instruction);
  }

  static instructionBox(instructionBox: DrInFo.InstructionBox): InstructionBox {
    return {
      instruction: ToServer.instruction(instructionBox.instruction),
      uuid: instructionBox.uuid,
      applied: instructionBox.applied,
    };
  }
}
