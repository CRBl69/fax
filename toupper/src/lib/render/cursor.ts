import type { Brush, Point } from "$lib/drinfo";
import { type Cursor, ToolType } from "$lib/types";

const renderSelectionCursor = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  point: Point,
  username: string | null,
) => {
  context.lineWidth = 2;
  context.strokeStyle = "#000000";

  context.beginPath();
  context.moveTo(point.x - 12, point.y);
  context.lineTo(point.x + 12, point.y);
  context.stroke();

  context.beginPath();
  context.moveTo(point.x, point.y - 12);
  context.lineTo(point.x, point.y + 12);
  context.stroke();

  if (username !== null) {
    renderUsername(context, { x: point.x + 5, y: point.y + 5 }, username);
  }
};

const renderStrokeCursor = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  point: Point | undefined,
  brush: Brush,
  username: string | null,
) => {
  if (!point) {
    return;
  }
  context.lineWidth = 1;
  context.beginPath();
  context.strokeStyle = brush.color;
  if (brush.brushShape.shape === "circle") {
    context.arc(point.x, point.y, brush.width / 2, 0, 2 * Math.PI);
  } else if (brush.brushShape.shape === "square") {
    context.strokeRect(
      point.x - brush.width / 2,
      point.y - brush.width / 2,
      brush.width,
      brush.width,
    );
  }
  if (username !== null) {
    const offset =
      brush.brushShape.shape === "square" ? brush.width / 2 + 10 : Math.max(brush.width / 2, 15);
    renderUsername(context, { x: point.x + offset, y: point.y + offset }, username);
  }
  context.stroke();
};

const renderUsername = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  point: Point,
  username: string,
) => {
  context.font = "20px Arial";
  context.fillStyle = "#000000";
  context.fillText(username, point.x, point.y);
};

export const renderTool = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  cursor: Cursor | null,
  username: string | null,
) => {
  if (cursor?.tool.type === ToolType.Stroke) {
    renderStrokeCursor(context, cursor.point, cursor.tool.brush, username);
  } else if (cursor) {
    renderSelectionCursor(context, cursor.point, username);
  }
};

export const renderSelection = (
  context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  points: Point[],
  close: boolean,
  ratio: number,
  username: string | null,
) => {
  context.lineWidth = 1;
  context.strokeStyle = "#000000";
  context.setLineDash([6 / ratio, 6 / ratio]);

  if (points.length === 0) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }
  if (close) context.closePath();
  context.stroke();

  context.setLineDash([]);

  if (username) {
    renderUsername(context, { x: points[0].x, y: points[0].y - 4 }, username);
  }
};
