import type { Brush, Point } from "$lib/drinfo";
import type { Dimensions } from "./types";

export const getRatio = (canvas: Dimensions, drawing: Dimensions) => {
  let ratio = drawing.height / canvas.height;
  if(drawing.width / ratio > canvas.width) {
    ratio = drawing.width / canvas.width;
  }
  return ratio;
};

export const draw = (start: Point, end: Point, brush: Brush, context: CanvasRenderingContext2D) => {
  if(!context) {
    console.warn("No context for draw.");
    return;
  }
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = brush.width;
  context.strokeStyle = brush.color;
  if (brush.erase) {
    context.globalCompositeOperation = "destination-out";
  } else {
    context.globalCompositeOperation = "source-over";
  }
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}

export const getX = (element: HTMLElement, e: MouseEvent, ratio: number) => {
  return (e.clientX -
    element.parentElement!.offsetLeft +
    document.scrollingElement!.scrollLeft) *
    ratio;
};

export const getY = (element: HTMLElement, e: MouseEvent, ratio: number) => {
  return (e.clientY -
    element.parentElement!.offsetTop +
    document.scrollingElement!.scrollTop) *
    ratio;
};

export const drawSquares = (context: CanvasRenderingContext2D) => {
  let x = 0;
  let y = 0;
  let white = true;
  while(x < context.canvas.height) {
    while(y < context.canvas.width) {
      context.fillStyle = white ? "#ffffff" : "#aaaaaa";
      white = !white;
      context.fillRect(y, x, 20, 20);
      y += 20;
    }
    white = !white;
    y = 0;
    x += 20;
  }
}
