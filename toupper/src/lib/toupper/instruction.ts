import type { ImageInsertion, Instruction, Stroke } from "$lib/drinfo";
import { ToServer } from "$lib/tolower";
import { drawImage } from "./util";

export const stroke = (
  stroke: Stroke,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  if (!context) {
    console.warn("No context for draw.");
    return;
  }
  if (stroke.points.length === 0) return;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.brush.width;
  const color = ToServer.color(stroke.brush.color);
  context.strokeStyle = `rgba(${color.r} ${color.g} ${color.b} / ${stroke.brush.opacity / 1000}%)`;
  if (stroke.brush.erase) {
    context.globalCompositeOperation = "destination-out";
  } else {
    context.globalCompositeOperation = "source-over";
  }

  const start = stroke.points[0];
  context.beginPath();
  context.moveTo(start.x, start.y);
  for (let i = 1; i < stroke.points.length; i++) {
    context.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  context.stroke();
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
