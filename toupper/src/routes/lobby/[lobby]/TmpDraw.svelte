<script lang="ts">
  import type { Brush, Point } from "$lib/drinfo";
  import { draw } from "$lib/toupper";
  import { gs } from "./state.svelte";
  import { FromServer, type TempDrawMessage } from "$lib/tolower";

  interface Props {
    name: string;
    height: number;
    width: number;
    uuid: string;
    context: CanvasRenderingContext2D | undefined;
  }

  let { name, height, width, uuid, context = $bindable() }: Props = $props();

  let tempDrawCanvas: HTMLCanvasElement;

  $effect(() => {
    if(tempDrawCanvas) {
      context = tempDrawCanvas.getContext("2d")!;
    }
  })

  const tempDraw = (brush: Brush, start: Point, end: Point) => {
    draw(start, end, brush, context!);
  };

  $effect(() => {
    const ontempdraw = (data: CustomEvent<TempDrawMessage["TempDraw"]>) => {
      if (data.detail.layer === name && data.detail.uuid === uuid) {
        tempDraw(FromServer.brush(data.detail.brush), data.detail.start, data.detail.end)
      }
    };

    gs.server?.addEventListener("tempdraw", ontempdraw);

    return () => {
      gs.server?.removeEventListener("tempdraw", ontempdraw);
    };
  })

</script>

<canvas bind:this={tempDrawCanvas} {height} {width}></canvas>

<style>
canvas {
  position: absolute;
}
</style>
