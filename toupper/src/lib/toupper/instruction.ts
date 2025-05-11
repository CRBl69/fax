import type { Stroke } from '$lib/drinfo';
import { draw } from './util';

export const stroke = (stroke: Stroke, context: CanvasRenderingContext2D) => {
  if (stroke.points.length === 1) {
    draw(stroke.points[0], stroke.points[0], stroke.brush, context);
  }
  for(let i = 0; i < stroke.points.length - 1; i++) {
    draw(stroke.points[i], stroke.points[i+1], stroke.brush, context);
  }
};

export const motion = () => {

};

export const insertImage = () => {

};
