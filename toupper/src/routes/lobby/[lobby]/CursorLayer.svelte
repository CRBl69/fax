<script lang="ts">
  import { type Cursor, getX, getY } from "$lib/toupper";
  import { renderTool } from "$lib/render";
  import type { SvelteMap } from "svelte/reactivity";
  import { getStateTool, gs } from "./state.svelte";
  import { untrack } from "svelte";

  interface Props {
    users: SvelteMap<string, Cursor | null>;
    listener: HTMLDivElement | undefined;
  }

  const { users, listener }: Props = $props();

  let cursorCanvas: HTMLCanvasElement;

  const drawAllCursors = () => {
    const context = cursorCanvas.getContext("2d")!;
    context.clearRect(0, 0, gs.drawing.width, gs.drawing.height);

    users.entries().forEach((v) => {
      renderTool(context, v[1], v[0]);
    });

    if (gs.cursorPosition) {
      renderTool(
        context,
        {
          tool: getStateTool(gs),
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
    gs.server?.cursor(getStateTool(gs), gs.cursorPosition);
    drawAllCursors();
  };

  const onmouseout = () => {
    gs.cursorPosition = null;
    gs.server?.cursor(getStateTool(gs), gs.cursorPosition);
    drawAllCursors();
  };

  $effect(() => {
    users.entries();
    untrack(() => drawAllCursors());
  });

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
    drawAllCursors();
  };

  $effect(() => {
    cursorCanvas;
    gs.server?.addEventListener("cursorout", onfriendcursor);
    return () => {
      gs.server?.removeEventListener("cursorout", onfriendcursor);
    };
  });
</script>

<canvas
  bind:this={cursorCanvas}
  height={gs.drawing.height}
  width={gs.drawing.width}
  oncontextmenu={(e) => {
    e.preventDefault();
    return false;
  }}
></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
