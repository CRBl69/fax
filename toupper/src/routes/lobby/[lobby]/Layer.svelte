<script lang="ts">
  import type { Brush, InstructionBox, Layer, Point } from "$lib/drinfo";
  import { draw, getX, getY, stroke } from "$lib/toupper";
  import { onMount, untrack } from "svelte";
  import { gs } from "./state.svelte";
  import { FromServer, type InstructionMessage, type RedoMessage, type TempDrawMessage, type ToggleLayerVisibilityMessage, type UndoMessage } from "$lib/tolower";
  import { SvelteMap } from "svelte/reactivity";

  interface Props {
    name: string;
    layer: Layer;
    height: number;
    width: number;
    listener: HTMLDivElement | undefined;
  }

  let { name, layer: initial, height, width, listener }: Props = $props();

  // State that is stored in global state to allow context sharing.
  let layerData = gs.layerData.get(name)!;

  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D = $derived.by(() => canvas.getContext("2d")!);

  let isVisible = $state(initial.visible);
  let visibility = $derived(isVisible ? "unset" : "none");

  // Buffer used to send a stroke instruction on stroke end.
  let pointsBuffer: Point[] = $state([]);

  let mousedown: boolean = $state(false);

  let uuid: string | null = $state(null);

  let prevCursorPosition: Point | undefined = $state();
  let cursorPosition: Point | undefined = $state();

  // Map that stores point buffers while the canvas is created.
  let bufferMap = $state(new SvelteMap<string, Point[]>())

  // Used for shift click straight line drawing.
  let lastPoint: Point | undefined = $state(undefined);

  const onkeydown = (e: KeyboardEvent) => {
    if(gs.selectedLayer === name) {
      // Ctrl Y (or Ctrl Shift Z) handler
      if(((e.key === "Z" && e.ctrlKey && e.shiftKey) || (e.key === "y" && e.ctrlKey)) && layerData.historyIndex < layerData.history.length) {
        gs.server?.redo(gs.selectedLayer);
        console.log(`sent redo for layer ${name}`);
      }
      // Ctrl Z handler
      if(e.key === "z" && e.ctrlKey && !e.shiftKey && layerData.historyIndex > 0) {
        gs.server?.undo(gs.selectedLayer);
        console.log(`sent undo for layer ${name}`);
      }
    }
  };

  const pushToHistory = (instructionBox: InstructionBox) => {
    const newContext = copyContext(layerData.historyContexts.get(layerData.historyIndex)!);
    if ('points' in instructionBox.instruction) {
      stroke(instructionBox.instruction, newContext);
    }
    layerData.historyIndex += 1;
    for (let i = layerData.historyIndex + 1; i <= layerData.history.length; i++) {
      layerData.historyContexts.delete(i);
    }
    layerData.history = layerData.history.slice(0, layerData.historyIndex - 1);
    layerData.history.push(instructionBox);
    layerData.historyContexts.set(layerData.historyIndex, newContext);
  };

  const copyContext = (context: CanvasRenderingContext2D) => {
    const canvasCopy = document.createElement("canvas");
    const contextCopy = canvasCopy.getContext("2d")!;
    contextCopy.canvas.height = context.canvas.height;
    contextCopy.canvas.width = context.canvas.width;
    contextCopy.canvas.style.height = context.canvas.style.height;
    contextCopy.canvas.style.width = context.canvas.style.width;
    contextCopy.drawImage(context.canvas, 0, 0);
    return contextCopy;
  };

  const updateCursorPosition = (element: HTMLElement, e: MouseEvent) => {
    const x = getX(element, e, gs.ratio);
    const y = getY(element, e, gs.ratio);
    prevCursorPosition = cursorPosition;
    cursorPosition = {x,y};
  };

  const tempDraw = (uuid: string, brush: Brush, start: Point, end: Point) => {
    const canvas = layerData.tmps.get(uuid)!.canvas;
    if (!canvas) {
      if(bufferMap.has(uuid)) {
        bufferMap.get(uuid)!.push(start);
      } else {
        bufferMap.set(uuid, [start]);
      }
      return;
    }
    const tempContext = canvas!.getContext("2d")!;
    draw(start, end, {...brush, color: brush.erase ? "#000000" : brush.color, erase: false}, tempContext);
  };

  // Browser event handlers.
  const onmousemove = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if(mousedown && uuid !== null) {
      pointsBuffer.push(cursorPosition!);
      tempDraw(uuid, gs.brush, prevCursorPosition!, cursorPosition!);
      gs.server?.drawTemp(gs.brush, uuid, prevCursorPosition!, cursorPosition!, name);
    }
  };

  const onmousedown = (element: HTMLDivElement, e: MouseEvent) => {
    uuid = crypto.randomUUID();
    layerData.tmps.set(uuid, {canvas: undefined, brush: gs.brush});
    updateCursorPosition(element, e);
    mousedown = true;
    if (e.shiftKey && lastPoint) {
      pointsBuffer.push(lastPoint);
      tempDraw(uuid, gs.brush, lastPoint, prevCursorPosition!);
    }
    pointsBuffer.push(cursorPosition!);
    tempDraw(uuid, gs.brush, prevCursorPosition!, cursorPosition!);
  };

  const onmouseup = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    mousedown = false;
    if(uuid) {
      gs.server?.instructionBox({
        uuid: uuid,
        instruction: {
          brush: gs.brush,
          points: pointsBuffer,
        }
      }, name);
    }
    lastPoint = gs.cursorPosition!;
    pointsBuffer = [];
    uuid = null;
  };

  const onmouseout = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if(mousedown) {
      onmouseup(element, e);
    }
  };

  $effect(() => {
    // Functions are wrapped to handle `this`.
    const onmousemovewrapped = function(this: HTMLDivElement, e: MouseEvent) {onmousemove(this, e)};
    const onmousedownwrapped = function(this: HTMLDivElement, e: MouseEvent) {onmousedown(this, e)};
    const onmouseupwrapped = function(this: HTMLDivElement, e: MouseEvent) {onmouseup(this, e)};
    const onmouseoutwrapped = function(this: HTMLDivElement, e: MouseEvent) {onmouseout(this, e)};
    if (listener && gs.selectedLayer === name) {
      listener.addEventListener("mousemove", onmousemovewrapped);
      listener.addEventListener("mousedown", onmousedownwrapped);
      listener.addEventListener("mouseup", onmouseupwrapped);
      listener.addEventListener("mouseout", onmouseoutwrapped);
      return () => {
        listener.removeEventListener("mousemove", onmousemovewrapped);
        listener.removeEventListener("mousedown", onmousedownwrapped);
        listener.removeEventListener("mouseup", onmouseupwrapped);
        listener.removeEventListener("mouseout", onmouseoutwrapped);
      }
    } else if (listener && gs.selectedLayer !== name) {
        listener.removeEventListener("mousemove", onmousemovewrapped);
        listener.removeEventListener("mousedown", onmousedownwrapped);
        listener.removeEventListener("mouseup", onmouseupwrapped);
        listener.removeEventListener("mouseout", onmouseoutwrapped);
    }
  });

  // Server event handlers.
  const oninstruction = (data: CustomEvent<InstructionMessage["Instruction"]>) => {
    if (data.detail.layer === name) {
      const instructionBox = FromServer.instructionBox(data.detail.instruction);
      pushToHistory(instructionBox);
      layerData.tmps.delete(data.detail.instruction.uuid);
    }
  };

  const ontogglelayervisibility = (data: CustomEvent<ToggleLayerVisibilityMessage["ToggleLayerVisibility"]>) => {
    if (data.detail === name) {
      isVisible = !untrack(() => isVisible);
    }
  };

  const onundo = (data: CustomEvent<UndoMessage["Undo"]>) => {
    if (data.detail === name) {
      layerData.historyIndex--;
    }
  }

  const onredo = (data: CustomEvent<RedoMessage["Redo"]>) => {
    if (data.detail === name) {
      layerData.historyIndex++;
    }
  }

  const ontempdraw = (data: CustomEvent<TempDrawMessage["TempDraw"]>) => {
    const brush = FromServer.brush(data.detail.brush);
    if (data.detail.layer === name) {
      if (!layerData.tmps.has(data.detail.uuid)) {
        layerData.tmps.set(data.detail.uuid, {canvas: undefined, brush});
      }
      tempDraw(data.detail.uuid, brush, data.detail.start, data.detail.end);
    }
  };

  $effect(() => {
    gs.server?.addEventListener("instruction", oninstruction);
    gs.server?.addEventListener("togglelayervisibility", ontogglelayervisibility);
    gs.server?.addEventListener("undo", onundo);
    gs.server?.addEventListener("redo", onredo);
    gs.server?.addEventListener("tempdraw", ontempdraw);

    return () => {
      gs.server?.removeEventListener("instruction", oninstruction);
      gs.server?.removeEventListener("togglelayervisibility", ontogglelayervisibility);
      gs.server?.removeEventListener("undo", onundo);
      gs.server?.removeEventListener("redo", onredo);
      gs.server?.removeEventListener("tempdraw", ontempdraw);
    };
  });

  // Whenever the history changes, draw the appropriate history context.
  // If historyContexts is not initialized yet, it must be done with a clear context.
  $effect(() => {
    if(layerData.historyContexts.size === 0) {
      layerData.historyContexts.set(0, copyContext(context));
    }
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(layerData.historyContexts.get(layerData.historyIndex)!.canvas, 0, 0);
  });

  // Draw things in buffer map.
  $effect(() => {
    layerData.tmps.entries().forEach(([uuid, c]) => {
      if(c.canvas && bufferMap.has(uuid)) {
        const tempContext = c.canvas.getContext("2d")!;
        const buffer = bufferMap.get(uuid)!;
        bufferMap.delete(uuid);
        for (let i = 0;i < buffer.length - 1; i++) {
          draw(buffer[i], buffer[i+1], c.brush, tempContext);
        }
        if(buffer.length === 1) {
          draw(buffer[0], buffer[0], c.brush, tempContext);
        }
      }
    });
  })

  onMount(() => {
    for (const instructionBox of initial.history.values()) {
      pushToHistory(instructionBox);
    }
    layerData.historyIndex = initial.historyIndex;
    window.addEventListener("keydown", onkeydown);

  // Draw a temp 
    return () => window.removeEventListener("keydown", onkeydown);
  });
</script>

<canvas style:display={visibility} bind:this={canvas} {height} {width}></canvas>
{#if layerData}
  {#each layerData.tmps.entries() as [uuid, canvas] (uuid)}
    <canvas bind:this={canvas.canvas} {height} {width}></canvas>
  {/each}
{/if}

<style>
canvas {
  position: absolute;
}
</style>
