<script lang="ts">
  import { drawSquares } from "$lib/render";
  import { getRatio, type Cursor } from "$lib/toupper";
  import CursorLayer from "./CursorLayer.svelte";
  import LayerComponent from "./Layer.svelte";
  import type { SvelteMap } from "svelte/reactivity";
  import { gs } from "./state.svelte";
  import PreviewLayer from "./PreviewLayer.svelte";

  interface Props {
    users: SvelteMap<string, Cursor | null>;
  }

  const { users }: Props = $props();

  let realHeight = $state(0);
  let realWidth = $state(0);

  $effect(() => {
    gs.ratio = getRatio(
      { width: realWidth - 2, height: realHeight - 2 },
      { width: gs.drawing.width, height: gs.drawing.height },
    );
  });

  let listener: HTMLDivElement | undefined = $state();
  let bgCanvas: HTMLCanvasElement | undefined = $state();

  $effect(() => {
    gs.ratio;
    let context = bgCanvas!.getContext("2d")!;
    drawSquares(context);
  });
</script>

<div class="layers" bind:clientWidth={realWidth} bind:clientHeight={realHeight}>
  <div
    class="listener"
    style="height: {gs.drawing.height / gs.ratio}px; width: {gs.drawing.width / gs.ratio}px"
    bind:this={listener}
  >
    <canvas
      class="bg"
      style="visibility: {gs.bg ? 'visible' : 'hidden'};"
      height={gs.drawing.height}
      width={gs.drawing.width}
      bind:this={bgCanvas}
    ></canvas>
    {#each gs.drawing.layerOrder as layer (layer)}
      <LayerComponent {listener} name={layer} />
    {/each}
    <PreviewLayer />
    <CursorLayer {users} {listener} />
  </div>
</div>

<style>
  .layers {
    height: 100%;
    position: relative;
  }
  .layers :global {
    canvas {
      max-width: 100%;
      max-height: 100%;
    }
  }
  .listener {
    position: absolute;
    outline: 1px solid var(--darkGrey);
  }
  .bg {
    position: absolute;
  }
</style>
