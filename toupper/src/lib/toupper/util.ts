import type { Brush, ImageInsertion, Point } from "$lib/drinfo";
import { ToServer } from "$lib/tolower";
import type { Dimensions } from "./types";

export const getRatio = (canvas: Dimensions, drawing: Dimensions) => {
  let ratio = drawing.height / canvas.height;
  if (drawing.width / ratio > canvas.width) {
    ratio = drawing.width / canvas.width;
  }
  return ratio;
};

export const draw = (
  start: Point,
  end: Point,
  brush: Brush,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  if (!context) {
    console.warn("No context for draw.");
    return;
  }
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = brush.width;
  const color = ToServer.color(brush.color);
  context.strokeStyle = `rgba(${color.r} ${color.g} ${color.b} / ${brush.opacity / 1000}%)`;
  if (brush.erase) {
    context.globalCompositeOperation = "destination-out";
  } else {
    context.globalCompositeOperation = "source-over";
  }
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
};

export const getX = (element: HTMLElement, e: MouseEvent, ratio: number) => {
  return (
    (e.clientX - element.parentElement!.offsetLeft + document.scrollingElement!.scrollLeft) * ratio
  );
};

export const getY = (element: HTMLElement, e: MouseEvent, ratio: number) => {
  return (
    (e.clientY - element.parentElement!.offsetTop + document.scrollingElement!.scrollTop) * ratio
  );
};

export const drawSquares = (context: CanvasRenderingContext2D) => {
  let x = 0;
  let y = 0;
  let white = true;
  let firstWhite = white;
  while (x < context.canvas.height) {
    firstWhite = white;
    while (y < context.canvas.width) {
      context.fillStyle = white ? "#ffffff" : "#aaaaaa";
      white = !white;
      context.fillRect(y, x, 20, 20);
      y += 20;
    }
    white = !firstWhite;
    y = 0;
    x += 20;
  }
};

export const drawImage = (
  image: HTMLImageElement,
  imageInsertion: ImageInsertion,
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
) => {
  const centerX = Math.round(
    (imageInsertion.point.x * 2 + image.width * imageInsertion.scale.x) / 2,
  );
  const centerY = Math.round(
    (imageInsertion.point.y * 2 + image.height * imageInsertion.scale.y) / 2,
  );
  context.translate(centerX, centerY);
  context.rotate((imageInsertion.rotate * Math.PI) / 180);
  context.drawImage(
    image,
    0,
    0,
    image.width,
    image.height,
    (-image.width * imageInsertion.scale.x) / 2,
    (-image.height * imageInsertion.scale.y) / 2,
    image.width * imageInsertion.scale.x,
    image.height * imageInsertion.scale.y,
  );
  context.resetTransform();
};
