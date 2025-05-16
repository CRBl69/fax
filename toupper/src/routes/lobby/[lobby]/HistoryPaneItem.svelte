<script lang="ts">
  import type { InstructionBox, Stroke } from "$lib/drinfo";
  import { drawSquares, stroke } from "$lib/toupper";
  import { gs } from "./state.svelte";

  interface Props {
    instruction: InstructionBox;
    index: number;
    historyIndex: number;
    layerName: string;
  }

  let { instruction, index, historyIndex, layerName }: Props = $props();

  let canvas: HTMLCanvasElement;

  const getCoordinates = (stroke: Stroke) => {
    let minX, maxX, minY, maxY;
    for (const point of stroke.points) {
      if (maxX) {
        if (point.x > maxX) {
          maxX = point.x;
        }
      } else {
        maxX = point.x;
      }
      if (minX) {
        if (point.x < minX) {
          minX = point.x;
        }
      } else {
        minX = point.x;
      }
      if (maxY) {
        if (point.y > maxY) {
          maxY = point.y;
        }
      } else {
        maxY = point.y;
      }
      if (minY) {
        if (point.y < minY) {
          minY = point.y;
        }
      } else {
        minY = point.y;
      }
    }
    const deltaX = minX! - stroke.brush.width / 2;
    const deltaY = minY! - stroke.brush.width / 2;
    const width = maxX! - minX! + stroke.brush.width;
    const height = maxY! - minY! + stroke.brush.width;
    return { deltaX, deltaY, width, height };
  };

  const centerize = (stroke: Stroke, canvasHeight: number, canvasWidth: number) => {
    const { height, width, deltaX, deltaY } = getCoordinates(stroke);
    const canvasAspectRatio = canvasWidth / canvasHeight;
    const magnifier = !(height * canvasAspectRatio > width)
      ? canvasWidth / width
      : canvasHeight / height;

    let newStroke: Stroke = {
      points: stroke.points.map((p) => ({
        x: (p.x - deltaX - stroke.brush.width / 2) * magnifier,
        y: (p.y - deltaY - stroke.brush.width / 2) * magnifier,
      })),
      brush: structuredClone(stroke.brush),
    };
    newStroke.brush.width *= magnifier;

    let minEmptyX = canvasWidth,
      minEmptyY = canvasHeight;
    for (const point of newStroke.points) {
      const emptyX = canvasWidth - point.x;
      if (emptyX < minEmptyX) {
        minEmptyX = emptyX;
      }
      const emptyY = canvasHeight - point.y;
      if (emptyY < minEmptyY) {
        minEmptyY = emptyY;
      }
    }

    newStroke.points = newStroke.points.map((point) => ({
      x: point.x + minEmptyX / 2,
      y: point.y + minEmptyY / 2,
    }));

    return newStroke;
  };

  $effect(() => {
    if (canvas) {
      const context = canvas.getContext("2d")!;
      drawSquares(context);
      if ("points" in instruction.instruction) {
        stroke(
          centerize(instruction.instruction, context.canvas.height, context.canvas.width),
          context,
        );
      }
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="container {historyIndex >= index ? 'past' : 'future'}"
  onclick={() => {
    // TODO: undo/redo
  }}
>
  <canvas
    height={gs.drawing.height}
    width={gs.drawing.width}
    bind:this={canvas}
    class="instruction-preview"
  >
  </canvas>
  <div>
    {#if "points" in instruction.instruction}
      Stroke
    {:else if "selection" in instruction.instruction}
      Motion
    {:else if "base64" in instruction.instruction}
      ImageInsertion
    {/if}
    N°{index}
  </div>
  <input
    type="checkbox"
    checked={instruction.applied}
    onclick={(_) => {
      gs.server?.setHistoryElementVisibility(layerName, index, !instruction.applied);
    }}
  />
</div>

<style>
  .container {
    border: 1px solid var(--darkGrey);
    border-top: none;
    display: flex;
    justify-content: space-between;
  }
  .future {
    color: var(--lightGrey);
  }
  .instruction-preview {
    max-height: 2rem;
    max-width: 4rem;
    border: 1px solid var(--darkGrey);
  }
</style>
