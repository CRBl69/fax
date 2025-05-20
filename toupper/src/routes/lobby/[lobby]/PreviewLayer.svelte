<script lang="ts">
  import { drawSquares, applyInstruction } from "$lib/toupper";
  import { gs } from "./state.svelte";

  let canvas: HTMLCanvasElement;

  $effect(() => {
    if (canvas && gs.hoveredInstruction) {
      const thisContext = canvas.getContext("2d")!;
      drawSquares(thisContext);
      applyInstruction(gs.hoveredInstruction.instruction, thisContext, gs.images);
    } else if (canvas) {
      const thisContext = canvas.getContext("2d")!;
      thisContext.clearRect(0, 0, canvas.width, canvas.height);
    }
  })
</script>

<canvas bind:this={canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
