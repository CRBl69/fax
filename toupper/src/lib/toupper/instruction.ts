import type { ImageInsertion, Instruction, InstructionBox, Stroke } from "$lib/drinfo";
import { draw, drawImage } from "./util";

export const stroke = (
  stroke: Stroke,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  if (stroke.points.length === 1) {
    draw(stroke.points[0], stroke.points[0], stroke.brush, context);
  }
  for (let i = 0; i < stroke.points.length - 1; i++) {
    draw(stroke.points[i], stroke.points[i + 1], stroke.brush, context);
  }
};

export const motion = () => {};

export const insertImage = async (
  imageInsertion: ImageInsertion,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  imageCache: Map<string, HTMLImageElement>,
) => {
  let image = imageCache.get(imageInsertion.base64);
  if (!image) {
    image = new Image();
    await new Promise((resolve, reject) => {
      image!.onload = resolve;
      image!.onerror = reject;
      image!.src = imageInsertion.base64;
    });
    imageCache.set(imageInsertion.base64, image);
  }
  drawImage(image, imageInsertion, context);
};

export const applyInstruction = async (
  instruction: Instruction,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  imageCache: Map<string, HTMLImageElement>,
) => {
  if ("point" in instruction) {
    await insertImage(instruction, context, imageCache);
  } else if ("points" in instruction) {
    stroke(instruction, context);
  }
};
