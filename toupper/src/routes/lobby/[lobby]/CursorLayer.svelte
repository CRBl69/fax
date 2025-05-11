<script lang="ts">
  import { type Cursor, getX, getY } from "$lib/toupper";
  import type { SvelteMap } from "svelte/reactivity";
  import { gs } from "./state.svelte";

  interface Props {
    users: SvelteMap<string, Cursor | null>;
    height: number;
    width: number;
    listener: HTMLDivElement | undefined;
  };

  const {users, height, width, listener}: Props = $props();

  let cursorCanvas: HTMLCanvasElement;

  const drawCursor = () => {
    const context = cursorCanvas.getContext("2d")!;
    context.clearRect(0, 0, width, height);

    const drawCursor = (cursor: Cursor | null, username: string | null) => {
      if(!cursor) {
        return;
      }
      context.beginPath();
      context.strokeStyle = cursor.brush.color;
      if (cursor.brush.brushShape.shape === "circle") {
        context.arc(cursor.point.x, cursor.point.y, cursor.brush.width / 2, 0, 2 * Math.PI);
      } else if (cursor.brush.brushShape.shape === "square") {
        context.strokeRect(cursor.point.x - cursor.brush.width / 2, cursor.point.y - cursor.brush.width / 2, cursor.brush.width, cursor.brush.width);
      }
      if (username !== null) {
        context.font = "20px Arial";
        context.fillStyle = "#000000";
        const offset = cursor.brush.brushShape.shape === "square" ? cursor.brush.width / 2 + 10 : Math.max(cursor.brush.width / 2, 15);
        context.fillText(username, cursor.point.x + offset, cursor.point.y + offset)
      }
      context.stroke();
    };

    users.forEach(drawCursor);

    if (gs.brush && gs.cursorPosition) {
      drawCursor({
        brush: gs.brush,
        point: gs.cursorPosition,
      }, null);
    }
  };

  const updateCursorPosition = (element: HTMLElement, e: MouseEvent) => {
    const x = getX(element, e, gs.ratio);
    const y = getY(element, e, gs.ratio);
    gs.cursorPosition = {
      x,
      y,
    };
  }

  const onmousemove = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    drawCursor();
  };

  const onmouseout = () => {
    gs.cursorPosition = null;
    drawCursor();
  };

  $effect(() => {
    if (listener) {
      listener.addEventListener("mousemove", function(this, e) {onmousemove(this, e)});
      listener.addEventListener("mouseout", onmouseout);
      return () => {
        listener.removeEventListener("mousemove", function(this, e) {onmousemove(this, e)});
        listener.removeEventListener("mouseout", onmouseout);
      }
    }
  })

  $effect(() => {
    gs.server?.cursor(gs.brush, gs.cursorPosition);
  })
</script>

<canvas bind:this={cursorCanvas} {height} {width}></canvas>

<style>
canvas {
  position: absolute;
}
</style>
