<script lang="ts">
  import { getX, getY } from "$lib/util";
  import { renderSelection, renderTool } from "$lib/render";
  import { getStateTool, gs } from "$lib/state.svelte";
  import { untrack } from "svelte";

  interface Props {
    listener: HTMLDivElement | undefined;
  }

  const { listener }: Props = $props();

  let cursorCanvas: HTMLCanvasElement;

  const drawAllCursors = () => {
    const context = cursorCanvas.getContext("2d")!;
    context.clearRect(0, 0, gs.drawing.width, gs.drawing.height);

    gs.cursors.entries().forEach((v) => {
      renderTool(context, v[1], v[0]);
    });

    gs.selections.entries().forEach((v) => {
      renderSelection(context, v[1].points, v[1].closed, 1, v[0]);
    });

    if (gs.cursorPosition && gs.tool) {
      renderTool(
        context,
        {
          tool: getStateTool(gs)!,
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
    if (gs.tool) gs.server?.cursor(getStateTool(gs)!, gs.cursorPosition);
    drawAllCursors();
  };

  const onmouseout = () => {
    gs.cursorPosition = null;
    if (gs.tool) gs.server?.cursor(getStateTool(gs)!, gs.cursorPosition);
    drawAllCursors();
  };

  $effect(() => {
    gs.cursors.entries();
    gs.selections.entries();
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
    cursor: none;
  }
</style>
