import type { Dimensions } from "./types";

export const getRatio = (canvas: Dimensions, drawing: Dimensions) => {
  let ratio = drawing.height / canvas.height;
  if (drawing.width / ratio > canvas.width) {
    ratio = drawing.width / canvas.width;
  }
  return ratio;
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
