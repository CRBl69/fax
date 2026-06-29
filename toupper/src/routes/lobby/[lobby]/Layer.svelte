<script lang="ts">
  import type { InstructionBox, Point } from "$lib/drinfo";
  import { getX, getY } from "$lib/util";
  import { applyInstruction } from "$lib/render";
  import { onMount, untrack } from "svelte";
  import { gs } from "$lib/state.svelte";
  import { type MoveInstructionMessage, type SetInstructionVisibilityMessage } from "$lib/tolower";

  interface Props {
    name: string;
    listener: HTMLDivElement | undefined;
  }

  let { name, listener }: Props = $props();

  let currentIndex = $state(0);

  // State that is stored in global state to allow context sharing.
  let layerData = $derived.by(() => gs.layerData.get(name)!);
  let layer = $derived.by(() => gs.drawing.layers.get(name)!);

  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D = $derived.by(() => canvas.getContext("2d")!);

  let isVisible = $derived(layer.visible);
  let visibility = $derived(isVisible ? "unset" : "none");

  let prevCursorPosition: Point | undefined = $state();
  let cursorPosition: Point | undefined = $state();

  const onkeydown = (e: KeyboardEvent) => {
    if (gs.selectedLayer === name) {
      // Ctrl Y (or Ctrl Shift Z) handler
      if (
        ((e.key === "Z" && e.ctrlKey && e.shiftKey) || (e.key === "y" && e.ctrlKey)) &&
        layer.historyIndex < layer.history.length
      ) {
        gs.server?.setHistoryIndex(gs.selectedLayer, layer.historyIndex + 1);
        console.log(`sent redo for layer ${name}`);
      }
      // Ctrl Z handler
      if (e.key === "z" && e.ctrlKey && !e.shiftKey && layer.historyIndex > 0) {
        gs.server?.setHistoryIndex(gs.selectedLayer, layer.historyIndex - 1);
        console.log(`sent undo for layer ${name}`);
      }
    }
  };

  const renderFrom = async (index: number) => {
    const renderFromCurrentIndex = async () => {
      for (let i = currentIndex + 1; i <= layer.historyIndex; i++) {
        const instructionBox = layer.history[i - 1]!;
        await pushToHistory(instructionBox);
        if (currentIndex % 20 == 0) {
          const historyContext = layerData.historyContexts.get(currentIndex)!;
          const data = historyContext.canvas.toDataURL("image/png");
          gs.server?.snapshot(name, data, currentIndex);
        }
      }
    };

    let closestContextIndex = 0;

    for (const contextIndex of layerData.historyContexts.keys()) {
      if (contextIndex > closestContextIndex && contextIndex < index) {
        closestContextIndex = contextIndex;
      }
    }

    const snapshotData = gs.drawing.getSnapshotBefore(name, index);

    if (snapshotData && snapshotData![0] > closestContextIndex && snapshotData![0] <= index) {
      let startIndex = snapshotData![0];
      let image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = snapshotData![1];
      });
      const newContext = copyContext(context);
      newContext.clearRect(0, 0, gs.drawing.width, gs.drawing.height);
      newContext.drawImage(image, 0, 0);
      layerData.historyContexts.set(startIndex, newContext);
      currentIndex = startIndex;
      await renderFromCurrentIndex();
    } else {
      currentIndex = closestContextIndex;
      renderFromCurrentIndex();
    }
  };

  const pushToHistory = async (instructionBox: InstructionBox) => {
    const newContext = copyContext(layerData.historyContexts.get(currentIndex)!);
    if (instructionBox.applied) {
      await applyInstruction(instructionBox.instruction, newContext, gs.images);
    }
    currentIndex += 1;
    for (const key of layerData.historyContexts.keys()) {
      if (key > currentIndex) {
        layerData.historyContexts.delete(key);
      }
    }
    layerData.historyContexts.set(currentIndex, newContext);
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
    const x = Math.floor(getX(element, e, gs.ratio));
    const y = Math.floor(getY(element, e, gs.ratio));
    prevCursorPosition = cursorPosition;
    cursorPosition = { x, y };
  };

  // Browser event handlers.
  const onmousemove = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if (gs.tool) {
      gs.tool.onmousemove(e, element);
    }
  };

  const onmousedown = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if (gs.tool) {
      gs.tool.onmousedown(e, element);
    }
  };

  const onmouseup = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if (gs.tool) {
      gs.tool.onmouseup(e, element);
    }
  };

  const onmouseleave = (element: HTMLDivElement, e: MouseEvent) => {
    if (gs.tool) {
      gs.tool.onmouseleave(e, element);
    }
  };

  const onmouseenter = (element: HTMLDivElement, e: MouseEvent) => {
    if (gs.tool) {
      gs.tool.onmouseenter(e, element);
    }
  };

  $effect(() => {
    // Functions are wrapped to handle `this`.
    const onmousemovewrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmousemove(this, e);
    };
    const onmousedownwrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmousedown(this, e);
    };
    const onmouseupwrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmouseup(this, e);
    };
    const onmouseoutleavewrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmouseleave(this, e);
    };
    const onmouseoutenterwrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmouseenter(this, e);
    };
    if (listener && gs.selectedLayer === name) {
      listener.addEventListener("mousemove", onmousemovewrapped);
      listener.addEventListener("mousedown", onmousedownwrapped);
      listener.addEventListener("mouseup", onmouseupwrapped);
      listener.addEventListener("mouseleave", onmouseoutleavewrapped);
      listener.addEventListener("mouseenter", onmouseoutenterwrapped);
      return () => {
        listener.removeEventListener("mousemove", onmousemovewrapped);
        listener.removeEventListener("mousedown", onmousedownwrapped);
        listener.removeEventListener("mouseup", onmouseupwrapped);
        listener.removeEventListener("mouseleave", onmouseoutleavewrapped);
        listener.removeEventListener("mouseenter", onmouseoutenterwrapped);
      };
    } else if (listener && gs.selectedLayer !== name) {
      listener.removeEventListener("mousemove", onmousemovewrapped);
      listener.removeEventListener("mousedown", onmousedownwrapped);
      listener.removeEventListener("mouseup", onmouseupwrapped);
      listener.removeEventListener("mouseleave", onmouseoutleavewrapped);
      listener.removeEventListener("mouseenter", onmouseoutenterwrapped);
    }
  });

  // Server event handlers.
  const onsetinstructionvisibility = (
    data: CustomEvent<SetInstructionVisibilityMessage["SetInstructionVisibility"]>,
  ) => {
    if (data.detail.layer === name) {
      renderFrom(data.detail.index);
    }
  };

  const onmoveinstruction = (data: CustomEvent<MoveInstructionMessage["MoveInstruction"]>) => {
    if (data.detail.layer === name) {
      renderFrom(
        Math.min(data.detail.old_instruction_index, data.detail.new_instruction_index) - 1,
      );
    }
  };

  $effect(() => {
    gs.server?.addEventListener("setinstructionvisibility", onsetinstructionvisibility);
    gs.server?.addEventListener("moveinstruction", onmoveinstruction);

    return () => {
      gs.server?.removeEventListener("setinstructionvisibility", onsetinstructionvisibility);
      gs.server?.removeEventListener("moveinstruction", onmoveinstruction);
    };
  });

  $effect(() => {
    if (!layerData.historyContexts.has(0)) {
      let clearContext = copyContext(context);
      clearContext.clearRect(0, 0, clearContext.canvas.width, clearContext.canvas.height);
      layerData.historyContexts.set(0, clearContext);
      layerData.currentCanvas = canvas;
    }
  });

  // Whenever the history changes, draw the appropriate history context.
  // If historyContexts is not initialized yet, it must be done with a clear context.
  $effect(() => {
    if (layer.historyIndex != untrack(() => currentIndex))
      untrack(() => renderFrom(layer.historyIndex));
  });

  // Render: draw history context, then all in-progress on top.
  $effect(() => {
    const ctx = context;
    const historyContext = layerData.historyContexts.get(layer.historyIndex);
    if (!historyContext) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(historyContext.canvas, 0, 0);
    for (const [, entry] of layerData.inProgress) {
      applyInstruction(entry.instructionBox.instruction, ctx, gs.images);
    }
    if (gs.selectedLayer === name && gs.instructionBox) {
      applyInstruction(gs.instructionBox.instruction, ctx, gs.images);
    }
  });

  onMount(() => {
    // renderAt(layer.historyIndex);
    window.addEventListener("keydown", onkeydown);

    return () => window.removeEventListener("keydown", onkeydown);
  });
</script>

<canvas
  style:display={visibility}
  bind:this={canvas}
  height={gs.drawing.height}
  width={gs.drawing.width}
></canvas>

<style>
  canvas {
    position: absolute;
  }
</style>
