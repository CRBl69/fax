<script lang="ts">
  import { onMount } from "svelte";
  import { gs } from "$lib/state.svelte";

  let canvas: HTMLCanvasElement;

  $effect(() => {
    gs.canvas = canvas;
  });

  $effect(() => {
    let req: number;
    let cancelled = false;
    function loop() {
      gs.renderer?.render().then(() => {
        if (!cancelled) req = requestAnimationFrame(loop);
      });
    }
    req = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(req);
    };
  });

  const onkeydown = (e: KeyboardEvent) => {
    if (!gs.selectedLayer) return;
    const layer = gs.drawing.layers.get(gs.selectedLayer);
    if (!layer) return;
    // Ctrl Y (or Ctrl Shift Z) handler
    if (
      ((e.key === "Z" && e.ctrlKey && e.shiftKey) || (e.key === "y" && e.ctrlKey)) &&
      layer.historyIndex < layer.history.length
    ) {
      gs.server?.setHistoryIndex(gs.selectedLayer, layer.historyIndex + 1);
      console.log(`sent redo for layer ${gs.selectedLayer}`);
    }
    // Ctrl Z handler
    if (e.key === "z" && e.ctrlKey && !e.shiftKey && layer.historyIndex > 0) {
      gs.server?.setHistoryIndex(gs.selectedLayer, layer.historyIndex - 1);
      console.log(`sent undo for layer ${gs.selectedLayer}`);
    }
  };

  onMount(() => {
    window.addEventListener("keydown", onkeydown);

    return () => window.removeEventListener("keydown", onkeydown);
  });
</script>

<canvas bind:this={canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
