<script lang="ts">
  import type { ImageInsertion, InstructionBox, Stroke } from "$lib/drinfo";
  import { drawImage, drawSquares, stroke } from "$lib/toupper";
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
      } else if ("point" in instruction.instruction) {
        (async () => {
          const imageInsertion = instruction.instruction as ImageInsertion;
          let image = gs.images.get(imageInsertion.base64);
          if (!image) {
            image = new Image();
            await new Promise((resolve, reject) => {
              image.onload = resolve;
              image.onerror = reject;
              image.src = imageInsertion.base64;
            });
            gs.images.set(imageInsertion.base64, image);
          }
          let ratio;
          if (image.height * imageInsertion.scale.y > image.width * imageInsertion.scale.x) {
            ratio = 250 / (image.width * imageInsertion.scale.x);
          } else {
            ratio = 150 / (image.height * imageInsertion.scale.y);
          }
          const imageInsertionShifted = structuredClone(imageInsertion);
          imageInsertionShifted.scale.x *= ratio;
          imageInsertionShifted.scale.y *= ratio;
          imageInsertionShifted.point = {
            x: 250 / 2 - (image.width * imageInsertionShifted.scale.x) / 2,
            y: 150 / 2 - (image.height * imageInsertionShifted.scale.y) / 2,
          };
          // imageInsertionShifted.;
          drawImage(image, imageInsertionShifted, context);
        })();
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
    height={150}
    width={250}
    bind:this={canvas}
    class="instruction-preview"
    onmouseenter={() => (gs.hoveredInstruction = instruction ?? null)}
    onmouseout={() => (gs.hoveredInstruction = null)}
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
    align-items: center;
    height: 3rem;
  }
  .future {
    color: var(--lightGrey);
  }
  .instruction-preview {
    height: 3rem;
    width: 5rem;
    border: 1px solid var(--darkGrey);
  }
</style>
