import type { Bucket, ImageInsertion, Instruction, Stroke } from "$lib/drinfo";
import { ToServer } from "$lib/tolower";
import { drawImage, strToRgb } from "./util";

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
  context.lineTo(start.x, start.y);
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

export const bucket = (
  bucket: Bucket,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const imgd = context.getImageData(bucket.point.x, bucket.point.y, 1, 1);
  const colorToPaint = {
    r: imgd.data[0],
    g: imgd.data[1],
    b: imgd.data[2],
    a: imgd.data[3],
  };

  const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  const fillColor = {
    ...strToRgb(bucket.brush.color),
    a: (bucket.brush.opacity * 255) / 100000,
  };

  const colorMatch = (pixelPos: number) => {
    const r = imageData.data[pixelPos];
    const g = imageData.data[pixelPos + 1];
    const b = imageData.data[pixelPos + 2];
    const a = imageData.data[pixelPos + 3];
    const tolerance = 10;
    return (
      Math.abs(r - colorToPaint.r) < tolerance &&
      Math.abs(g - colorToPaint.g) < tolerance &&
      Math.abs(b - colorToPaint.b) < tolerance &&
      Math.abs(a - colorToPaint.a) < tolerance
    );
  };

  const colorPixel = (pixelPos: number) => {
    imageData.data[pixelPos] = fillColor.r;
    imageData.data[pixelPos + 1] = fillColor.g;
    imageData.data[pixelPos + 2] = fillColor.b;
    imageData.data[pixelPos + 3] = fillColor.a;
  };

  const pixelStack = [[Math.floor(bucket.point.x), Math.floor(bucket.point.y)]];

  const atTheEnd: number[] = [];
  const pushSurroundingToAtTheEnd = (pixelPos: number) => {
    atTheEnd.push(pixelPos + 4);
    atTheEnd.push(pixelPos - 4);
    atTheEnd.push(pixelPos + context.canvas.width * 4);
    atTheEnd.push(pixelPos - context.canvas.width * 4);
  };

  while (pixelStack.length) {
    const newPos = pixelStack.pop();
    const x = newPos![0];
    let y, pixelPos, reachLeft, reachRight;
    y = newPos![1];

    pixelPos = (y * context.canvas.width + x) * 4;
    while (y-- >= 0 && colorMatch(pixelPos)) {
      pixelPos -= context.canvas.width * 4;
    }
    if (!colorMatch(pixelPos)) {
      pushSurroundingToAtTheEnd(pixelPos);
    }
    pixelPos += context.canvas.width * 4;
    ++y;
    reachLeft = false;
    reachRight = false;
    while (y++ < context.canvas.height - 1 && colorMatch(pixelPos)) {
      colorPixel(pixelPos);

      if (x > 0) {
        if (colorMatch(pixelPos - 4)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, y]);
            reachLeft = true;
          }
        } else {
          if (!colorMatch(pixelPos)) {
            pushSurroundingToAtTheEnd(pixelPos);
          }
          if (reachLeft) {
            reachLeft = false;
          }
        }
      }

      if (x < context.canvas.width - 1) {
        if (colorMatch(pixelPos + 4)) {
          if (!reachRight) {
            pixelStack.push([x + 1, y]);
            reachRight = true;
          }
        } else {
          if (!colorMatch(pixelPos)) {
            pushSurroundingToAtTheEnd(pixelPos);
          }
          if (reachRight) {
            reachRight = false;
          }
        }
      }

      pixelPos += context.canvas.width * 4;
    }
    if (!colorMatch(pixelPos)) {
      pushSurroundingToAtTheEnd(pixelPos);
    }
  }
  for (const pixel of atTheEnd) {
    colorPixel(pixel);
  }
  context.putImageData(imageData, 0, 0);
};

export const applyInstruction = async (
  instruction: Instruction,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  imageCache: Map<string, HTMLImageElement>,
) => {
  if ("point" in instruction && "base64" in instruction) {
    await insertImage(instruction, context, imageCache);
  } else if ("points" in instruction) {
    stroke(instruction, context);
  } else if ("point" in instruction && "brush" in instruction) {
    bucket(instruction, context);
  }
};
