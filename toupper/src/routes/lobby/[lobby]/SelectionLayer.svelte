<script lang="ts">
  import type { Point } from "$lib/drinfo";
  import { Tool } from "$lib/toupper";
  import { gs } from "./state.svelte";

  let canvas: HTMLCanvasElement;

  const drawRectOutline = (
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    a: Point,
    b: Point,
  ) => {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);
    ctx.lineWidth = Math.max(1, 2 / gs.ratio);
    ctx.strokeStyle = "#000000";
    ctx.setLineDash([6 / gs.ratio, 4 / gs.ratio]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  };

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const moving = gs.tool === Tool.Move && gs.selection && gs.moveGrab && gs.cursorPosition;
    const delta = moving
      ? {
          x: gs.cursorPosition!.x - gs.moveGrab!.x,
          y: gs.cursorPosition!.y - gs.moveGrab!.y,
        }
      : { x: 0, y: 0 };

    if (gs.tool === Tool.Select && gs.selectionStart && gs.cursorPosition) {
      drawRectOutline(ctx, gs.selectionStart, gs.cursorPosition);
    } else if (moving) {
      drawRectOutline(
        ctx,
        { x: gs.selection!.start.x + delta.x, y: gs.selection!.start.y + delta.y },
        { x: gs.selection!.end.x + delta.x, y: gs.selection!.end.y + delta.y },
      );
    } else if (gs.selection) {
      drawRectOutline(ctx, gs.selection.start, gs.selection.end);
    }
  });
</script>

<canvas bind:this={canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
