<script lang="ts">
  import type { Layer } from "$lib/drinfo";
  import { drawSquares, getRatio, type Cursor } from "$lib/toupper";
  import CursorLayer from "./CursorLayer.svelte";
  import LayerComponent from "./Layer.svelte";
  import type { SvelteMap } from "svelte/reactivity";
  import { gs } from "./state.svelte";
    import { onMount } from "svelte";

  interface Props {
    layers: Map<string, Layer>;
    layerOrder: string[];
    height: number;
    width: number;
    users: SvelteMap<string, Cursor | null>;
  }

  const { layers, layerOrder, height, width, users }: Props = $props();

  let realHeight = $state(0);
  let realWidth = $state(0);

  $effect(() => {
    gs.ratio = getRatio(
      { width: realWidth - 2, height: realHeight - 2 },
      { width, height },
    );
  })

  let listener: HTMLDivElement | undefined = $state();
  let bgCanvas: HTMLCanvasElement | undefined = $state();

  onMount(() => {
    let context = bgCanvas!.getContext("2d")!;
    drawSquares(context);
  })
</script>

<div
  class="layers"
  bind:clientWidth={realWidth}
  bind:clientHeight={realHeight}
>
  <div
    class="listener"
    style="height: {height / gs.ratio}px; width: {width / gs.ratio}px"
    bind:this={listener}>
  <canvas class="bg" style="visibility: {gs.bg ? "visible" : "hidden"};" {height} {width} bind:this={bgCanvas}></canvas>
  {#each layerOrder as layer (layer)}
    <LayerComponent listener={listener} name={layer} layer={layers.get(layer) as Layer} {height} {width} />
  {/each}
  <CursorLayer {users} {height} {width} {listener} />
  </div>
</div>

<style>
.layers {
    height: 100%;
    position: relative;
}
.layers :global { canvas {
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
