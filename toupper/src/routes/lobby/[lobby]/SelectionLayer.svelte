<script lang="ts">
  import type { Point } from "$lib/drinfo";
  import { Tool } from "$lib/toupper";
  import { gs } from "./state.svelte";

  let canvas: HTMLCanvasElement;

  const strokePoly = (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    points: Point[],
    close: boolean,
  ) => {
    if (points.length === 0) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (close) ctx.closePath();
    ctx.stroke();
  };

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Other users' in-progress selections.
    ctx.lineWidth = Math.max(1, 2 / gs.ratio);
    ctx.strokeStyle = "#5b8def";
    ctx.setLineDash([3 / gs.ratio, 3 / gs.ratio]);
    for (const s of gs.tempSelects.values()) {
      strokePoly(ctx, s.points, s.closed);
    }

    // Local user's selection.
    ctx.lineWidth = Math.max(1, 2 / gs.ratio);
    ctx.strokeStyle = "#000000";
    ctx.setLineDash([6 / gs.ratio, 4 / gs.ratio]);

    const moving =
      gs.tool === Tool.Move &&
      gs.selection &&
      gs.selection.length >= 3 &&
      gs.moveGrab &&
      gs.cursorPosition;
    const delta = moving
      ? {
          x: gs.cursorPosition!.x - gs.moveGrab!.x,
          y: gs.cursorPosition!.y - gs.moveGrab!.y,
        }
      : { x: 0, y: 0 };

    if (gs.tool === Tool.Select && gs.selectionStart && gs.cursorPosition) {
      const s = gs.selectionStart;
      const c = gs.cursorPosition;
      strokePoly(ctx, [s, { x: c.x, y: s.y }, c, { x: s.x, y: c.y }], true);
    } else if (gs.tool === Tool.PolySelect && gs.polyDraft && gs.polyDraft.length > 0) {
      const pts = [...gs.polyDraft];
      if (gs.cursorPosition) pts.push(gs.cursorPosition);
      strokePoly(ctx, pts, false);
    } else if (moving) {
      strokePoly(
        ctx,
        gs.selection!.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
        true,
      );
    } else if (gs.selection && gs.selection.length >= 3) {
      strokePoly(ctx, gs.selection, true);
    }

    ctx.setLineDash([]);
  });
</script>

<canvas bind:this={canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
