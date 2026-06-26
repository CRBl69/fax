<script lang="ts">
  import type { Bucket, ImageInsertion, InstructionBox, Stroke } from "$lib/drinfo";
  import { ToServer } from "$lib/tolower";
  import { drawImage, drawSquares, stroke } from "$lib/render";
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
      brush: {
        brushShape: {
          shape: stroke.brush.brushShape.shape,
          customShape: stroke.brush.brushShape.customShape,
        },
        color: stroke.brush.color,
        width: stroke.brush.width,
        hardness: stroke.brush.hardness,
        opacity: stroke.brush.opacity,
        erase: stroke.brush.erase,
        repeat: stroke.brush.repeat,
      },
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
      } else if ("point" in instruction.instruction && "base64" in instruction.instruction) {
        (async () => {
          const imageInsertion = instruction.instruction as ImageInsertion;
          let image = gs.images.get(imageInsertion.base64);
          if (!image) {
            image = new Image();
            await new Promise((resolve, reject) => {
              image!.onload = resolve;
              image!.onerror = reject;
              image!.src = imageInsertion.base64;
            });
            gs.images.set(imageInsertion.base64, image);
          }
          let ratio;
          if (image.height * imageInsertion.scale.y > image.width * imageInsertion.scale.x) {
            ratio = 250 / (image.width * imageInsertion.scale.x);
          } else {
            ratio = 150 / (image.height * imageInsertion.scale.y);
          }
          const imageInsertionShifted: ImageInsertion = {
            base64: imageInsertion.base64,
            point: {
              x: imageInsertion.point.x,
              y: imageInsertion.point.y,
            },
            scale: {
              x: imageInsertion.scale.x,
              y: imageInsertion.scale.y,
            },
            rotate: imageInsertion.rotate,
          };
          imageInsertionShifted.scale.x *= ratio;
          imageInsertionShifted.scale.y *= ratio;
          imageInsertionShifted.point = {
            x: 250 / 2 - (image.width * imageInsertionShifted.scale.x) / 2,
            y: 150 / 2 - (image.height * imageInsertionShifted.scale.y) / 2,
          };
          drawImage(image, imageInsertionShifted, context);
        })();
      } else if ("point" in instruction.instruction && "brush" in instruction.instruction) {
        const bucket = instruction.instruction as Bucket;
        const color = ToServer.color(bucket.brush.color);
        context.fillStyle = `rgba(${color.r} ${color.g} ${color.b} / ${bucket.brush.opacity / 1000}%)`;
        context.fillRect(0, 0, 250, 150);
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
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <canvas
    height={150}
    width={250}
    bind:this={canvas}
    class="instruction-preview"
    onmouseenter={() => (gs.hoveredInstruction = instruction ?? null)}
    onmouseout={() => (gs.hoveredInstruction = null)}
  >
  </canvas>
  <div class="inner-container">
    <div class="description">
      {#if "points" in instruction.instruction}
        Stroke
      {:else if "selection" in instruction.instruction}
        Motion
      {:else if "base64" in instruction.instruction}
        ImageInsertion
      {:else if "point" in instruction.instruction && "brush" in instruction.instruction}
        Bucket
      {/if}
      N°{index}
    </div>
    <input
      type="checkbox"
      checked={instruction.applied}
      onclick={() => {
        gs.server?.setHistoryElementVisibility(layerName, index, !instruction.applied);
      }}
    />
    <button
      class="trash"
      onclick={() => {
        gs.server?.removeInstruction(layerName, index);
      }}>X</button
    >
  </div>
</div>

<style>
  .container {
    border: 1px solid var(--darkGrey);
    border-top: none;
    display: flex;
    height: 3rem;
    position: relative;
  }
  .inner-container {
    padding: 0.2em;
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }
  .future {
    color: var(--lightGrey);
  }
  .instruction-preview {
    height: 3rem;
    width: 5rem;
    border: 1px solid var(--darkGrey);
  }
  .trash {
    border: 1px solid var(--lightGrey);
    border-radius: 0.2em;
  }
</style>
