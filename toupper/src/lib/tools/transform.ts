import type { Point } from "$lib/drinfo";

/**
 * Shared transform logic for tools that support move/scale/rotate.
 * Mirrors the image insertion tool's modifier key behavior:
 *   No modifier = translate
 *   Ctrl  = free scale
 *   Shift = uniform scale
 *   Alt   = rotate around the given pivot
 */
export function applyTransform(
  position: Point,
  scale: Point,
  rotate: number,
  cursorPosition: Point,
  previousCursorPosition: Point,
  event: MouseEvent,
  pivot: { x: number; y: number },
): { position: Point; scale: Point; rotate: number } {
  if (event.ctrlKey) {
    scale.x += (cursorPosition.x - previousCursorPosition.x) / 2000;
    scale.y += (cursorPosition.y - previousCursorPosition.y) / 2000;
  } else if (event.shiftKey) {
    scale.x += (cursorPosition.x - previousCursorPosition.x) / 2000;
    scale.y = scale.x;
  } else if (event.altKey) {
    const aX = cursorPosition.x;
    const aY = cursorPosition.y;
    const bX = previousCursorPosition.x;
    const bY = previousCursorPosition.y;
    const caX = aX - pivot.x;
    const caY = aY - pivot.y;
    const cbX = bX - pivot.x;
    const cbY = bY - pivot.y;
    const product = caX * cbX + caY * cbY;
    const caMag = Math.sqrt(caX ** 2 + caY ** 2);
    const cbMag = Math.sqrt(cbX ** 2 + cbY ** 2);
    if (caMag === 0 || cbMag === 0) return { position, scale, rotate };
    const cos = product / (caMag * cbMag);
    const angleRadians = Math.acos(cos);
    const angleDegrees = (angleRadians / Math.PI) * 180;
    const crossProduct = caX * cbY - caY * cbX;
    if (crossProduct > 0) {
      rotate = ((rotate * 360) / (2 ** 32 - 1) - angleDegrees) % 360;
    } else {
      rotate = ((rotate * 360) / (2 ** 32 - 1) + angleDegrees) % 360;
    }
    rotate = Math.round((rotate * (2 ** 32 - 1)) / 360);
    if (isNaN(rotate)) rotate = 0;
    if (rotate < 0) {
      rotate = 2 ** 32 - 1 - rotate;
    }
  } else {
    position.x += cursorPosition.x - previousCursorPosition.x;
    position.y += cursorPosition.y - previousCursorPosition.y;
  }
  return { position: { x: position.x, y: position.y }, scale: { x: scale.x, y: scale.y }, rotate };
}
