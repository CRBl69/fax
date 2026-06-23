<script lang="ts">
  import type { ImageInsertion } from "$lib/drinfo";
  import { drawImage } from "$lib/toupper";
  import { gs } from "./state.svelte";
  import { SvelteMap } from "svelte/reactivity";

  let canvas: HTMLCanvasElement;

  // Cache decoded images by base64 so we don't re-decode on every redraw.
  let imageCache: SvelteMap<string, HTMLImageElement> = new SvelteMap();

  const loadImage = (base64: string): Promise<HTMLImageElement> => {
    const cached = imageCache.get(base64);
    if (cached) return Promise.resolve(cached);
    const image = new Image();
    return new Promise((resolve, reject) => {
      image.onload = () => {
        imageCache.set(base64, image);
        resolve(image);
      };
      image.onerror = reject;
      image.src = base64;
    });
  };

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const entries = [...gs.tempImages.entries()];

    for (const [, imageInsertion] of entries) {
      const image = imageCache.get(imageInsertion.base64);
      if (image && image.complete) {
        drawImage(image, imageInsertion as ImageInsertion, ctx);
      } else {
        loadImage(imageInsertion.base64);
      }
    }
  });
</script>

<canvas bind:this={canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
