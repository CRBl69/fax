<script lang="ts">
  import { type Cursor, getX, getY } from "$lib/toupper";
  import type { SvelteMap } from "svelte/reactivity";
  import { gs } from "./state.svelte";
    import { onMount, untrack } from "svelte";

  interface Props {
    users: SvelteMap<string, Cursor | null>;
    listener: HTMLDivElement | undefined;
  }

  const { users, listener }: Props = $props();

  let cursorCanvas: HTMLCanvasElement;

  const drawCursor = () => {
    const context = cursorCanvas.getContext("2d")!;
    context.clearRect(0, 0, gs.drawing.width, gs.drawing.height);

    const drawCursor = (cursor: Cursor | null, username: string | null) => {
      if (!cursor) {
        return;
      }
      context.beginPath();
      context.strokeStyle = cursor.brush.color;
      if (cursor.brush.brushShape.shape === "circle") {
        context.arc(cursor.point.x, cursor.point.y, cursor.brush.width / 2, 0, 2 * Math.PI);
      } else if (cursor.brush.brushShape.shape === "square") {
        context.strokeRect(
          cursor.point.x - cursor.brush.width / 2,
          cursor.point.y - cursor.brush.width / 2,
          cursor.brush.width,
          cursor.brush.width,
        );
      }
      if (username !== null) {
        context.font = "20px Arial";
        context.fillStyle = "#000000";
        const offset =
          cursor.brush.brushShape.shape === "square"
            ? cursor.brush.width / 2 + 10
            : Math.max(cursor.brush.width / 2, 15);
        context.fillText(username, cursor.point.x + offset, cursor.point.y + offset);
      }
      context.stroke();
    };

    users.entries().forEach((v) => {
      drawCursor(v[1], v[0])
    });

    if (gs.brush && gs.cursorPosition) {
      drawCursor(
        {
          brush: gs.brush,
          point: gs.cursorPosition,
        },
        null,
      );
    }
  };

  const updateCursorPosition = (element: HTMLElement, e: MouseEvent) => {
    const x = getX(element, e, gs.ratio);
    const y = getY(element, e, gs.ratio);
    gs.cursorPosition = {
      x,
      y,
    };
  };

  const onmousemove = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    gs.server?.cursor(gs.brush, gs.cursorPosition);
    drawCursor();
  };

  const onmouseout = () => {
    gs.cursorPosition = null;
    gs.server?.cursor(gs.brush, gs.cursorPosition);
    drawCursor();
  };

  $effect(() => {
    users.entries();
    untrack(() => drawCursor());
  })

  $effect(() => {
    if (listener) {
      listener.addEventListener("mousemove", function (this, e) {
        onmousemove(this, e);
      });
      listener.addEventListener("mouseout", onmouseout);
      return () => {
        listener.removeEventListener("mousemove", function (this, e) {
          onmousemove(this, e);
        });
        listener.removeEventListener("mouseout", onmouseout);
      };
    }
  });

  const onfriendcursor = () => {
    drawCursor();
  };

  $effect(() => {
    cursorCanvas;
    gs.server?.addEventListener("cursorout", onfriendcursor);
    return () => {
      gs.server?.removeEventListener("cursorout", onfriendcursor);
    };
  })
</script>

<canvas bind:this={cursorCanvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
