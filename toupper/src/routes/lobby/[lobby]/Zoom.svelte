<script lang="ts">
  import type { Layer } from "$lib/drinfo";
    import { drawSquares } from "$lib/toupper";
    import { onMount } from "svelte";
  import { gs } from "./state.svelte";

  interface Props {
    layers: Map<string, Layer>;
    layerOrder: string[];
  };

  let { layers, layerOrder }: Props = $props();

  let bottom = $state(30);
  let left = $state(30);
  let moving = $state(false);

  let canvas: HTMLCanvasElement;
  let context = $derived.by(() => canvas?.getContext("2d"));

  function onMouseDown() {
    moving = true;
  }

  function onMouseMove(e: any) {
    if (moving) {
      left += e.movementX;
      bottom -= e.movementY;
    }
  }

  function onMouseUp() {
    moving = false;
  }

  $effect(() => {
    const cursorPosition = gs.cursorPosition;
    if (context && cursorPosition !== null) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawSquares(context);
      layerOrder.forEach(name => {
        if (!layers.get(name)?.visible) return;
        const layerData = gs.layerData.get(name);
        if (layerData) {
          const layerContext = layerData.historyContexts.get(layerData.historyIndex)!;
          context.drawImage(layerContext.canvas, cursorPosition.x - 100 / gs.zoomRatio, cursorPosition.y - 100 / gs.zoomRatio, 200 / gs.zoomRatio, 200 / gs.zoomRatio, 0, 0, 200, 200);
          layerData.tmps.values().forEach(({canvas}) => {
            if(!canvas) return;
            context.drawImage(canvas, cursorPosition.x - 100 / gs.zoomRatio, cursorPosition.y - 100 / gs.zoomRatio, 200 / gs.zoomRatio, 200 / gs.zoomRatio, 0, 0, 200, 200);
          })
        }
      })
      context.beginPath();
      context.strokeStyle = gs.brush.color;
      if (gs.brush.brushShape.shape === "circle") {
        context.arc(100, 100, gs.brush.width / 2 * gs.zoomRatio, 0, 2 * Math.PI);
      } else if (gs.brush.brushShape.shape === "square") {
        context.strokeRect(100 - gs.brush.width / 2 * gs.zoomRatio, 100 - gs.brush.width / 2 * gs.zoomRatio, gs.brush.width * gs.zoomRatio, gs.brush.width * gs.zoomRatio);
      }
      context.stroke();
    }
  })

  onMount(() => {
    if(context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawSquares(context);
    }
  })
</script>

<div class="zoom" onmousedown={onMouseDown} style="left: {left}px; bottom: {bottom}px;">
  <canvas bind:this={canvas} height={200} width={200}></canvas>
</div>
<svelte:window onmouseup={onMouseUp} onmousemove={onMouseMove} />

<style>
.zoom {
  position: absolute;
  height: min(15vw, 15vh);
  width: min(15vw, 15vh);
  border: 1px solid var(--darkRed);
}

.zoom, .zoom * {
  border-radius: 100%;
}

.zoom canvas {
  height: 100%;
  width: 100%;
}
</style>
