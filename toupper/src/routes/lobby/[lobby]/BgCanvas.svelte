<script lang="ts">
  import { drawSquares } from "$lib/render";
  import { gs } from "$lib/state.svelte";

  let bgCanvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    gs.ratio;
    let context = bgCanvas!.getContext("2d")!;
    drawSquares(context);
  });
</script>

<canvas
  class="bg"
  style="visibility: {gs.bg ? 'visible' : 'hidden'};"
  height={gs.drawing.height}
  width={gs.drawing.width}
  bind:this={bgCanvas}
></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
