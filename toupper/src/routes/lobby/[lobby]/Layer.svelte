<script lang="ts">
  import type { ImageInsertion, InstructionBox, Point, Stroke } from "$lib/drinfo";
  import { drawImage, getX, getY, applyInstruction, stroke } from "$lib/toupper";
  import { onMount, untrack } from "svelte";
  import { gs } from "./state.svelte";
  import {
    FromServer,
    type InstructionMessage,
    type MoveInstructionMessage,
    type SetHistoryElementVisibilityMessage,
    type TempDrawMessage,
  } from "$lib/tolower";

  interface Props {
    name: string;
    listener: HTMLDivElement | undefined;
  }

  let { name, listener }: Props = $props();

  let currentIndex = $state(0);

  // State that is stored in global state to allow context sharing.
  let layerData = gs.layerData.get(name)!;
  let layer = gs.drawing.layers.get(name)!;

  let canvas: HTMLCanvasElement;
  let context: CanvasRenderingContext2D = $derived.by(() => canvas.getContext("2d")!);

  let isVisible = $derived(layer.visible);
  let visibility = $derived(isVisible ? "unset" : "none");

  let mousedown: boolean = $state(false);

  let prevCursorPosition: Point | undefined = $state();
  let cursorPosition: Point | undefined = $state();

  let image: HTMLImageElement | undefined = $state();

  // Used for shift click straight line drawing.
  let lastPoint: Point | undefined = $state(undefined);

  let lastUuid: string | undefined = $state();

  let friendStrokes: Map<string, InstructionBox> = $state(new Map());

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
        const instructionBox = layer.history[i-1]!;
        await pushToHistory(instructionBox);
        if (currentIndex % 5 == 0) {
          const historyContext = layerData.historyContexts.get(currentIndex)!;
          const data = historyContext.canvas.toDataURL("image/png");
          gs.server?.snapshot(name, data, currentIndex);
        }
      }
      const historyContext = layerData.historyContexts.get(layer.historyIndex)!;
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.drawImage(historyContext.canvas, 0, 0);
    };

    let closestContextIndex = 0;

    for (const [contextIndex, _] of layerData.historyContexts) {
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

  // Error here. make this not tourch historyIndex
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
    const x = getX(element, e, gs.ratio);
    const y = getY(element, e, gs.ratio);
    prevCursorPosition = cursorPosition;
    cursorPosition = { x, y };
  };

  const tempDraw = (instructionBox: InstructionBox) => {
    const canvas = layerData.tmps.get(instructionBox.uuid)!.canvas;
    if (!canvas) {
      return;
    }
    const tempContext = canvas!.getContext("2d")!;
    tempContext.clearRect(0, 0, canvas.width, canvas.height);
    stroke(instructionBox.instruction as Stroke, tempContext);
  };

  // Browser event handlers.
  const onmousemoveimageinsertion = (e: MouseEvent) => {
    let imageInsertion = gs.instructionBox!.instruction as ImageInsertion;
    if (e.ctrlKey) {
      imageInsertion.scale.x += (cursorPosition!.x - prevCursorPosition!.x) / 2000;
      imageInsertion.scale.y += (cursorPosition!.y - prevCursorPosition!.y) / 2000;
    } else if (e.shiftKey) {
      imageInsertion.scale.x += (cursorPosition!.x - prevCursorPosition!.x) / 2000;
      imageInsertion.scale.y = imageInsertion.scale.x;
    } else if (e.altKey) {
      const centerX = Math.round(
        (imageInsertion.point.x * 2 + image!.width * imageInsertion.scale.x) / 2,
      );
      const centerY = Math.round(
        (imageInsertion.point.y * 2 + image!.height * imageInsertion.scale.y) / 2,
      );
      const aX = cursorPosition!.x;
      const aY = cursorPosition!.y;
      const bX = prevCursorPosition!.x;
      const bY = prevCursorPosition!.y;
      const caX = aX - centerX;
      const caY = aY - centerY;
      const cbX = bX - centerX;
      const cbY = bY - centerY;
      const product = caX * cbX + caY * cbY;
      const caMag = Math.sqrt(caX ** 2 + caY ** 2);
      const cbMag = Math.sqrt(cbX ** 2 + cbY ** 2);
      const cos = product / (caMag * cbMag);
      const angleRadians = Math.acos(cos);
      const angleDegrees = (angleRadians / Math.PI) * 180;
      const crossProduct = caX * cbY - caY * cbX;
      let rotate;
      if (crossProduct > 0) {
        rotate = (imageInsertion.rotate - angleDegrees) % 360;
      } else {
        rotate = (imageInsertion.rotate + angleDegrees) % 360;
      }
      if (!isNaN(rotate)) {
        imageInsertion.rotate = rotate;
      }
    } else {
      imageInsertion.point.x += cursorPosition!.x - prevCursorPosition!.x;
      imageInsertion.point.y += cursorPosition!.y - prevCursorPosition!.y;
    }
  };
  const onmousemovestroke = () => {
    (gs.instructionBox!.instruction as Stroke).points.push(cursorPosition!);
    tempDraw(gs.instructionBox!);
    gs.server?.drawTemp(
      gs.brush,
      gs.instructionBox!.uuid,
      prevCursorPosition!,
      cursorPosition!,
      name,
    );
  };
  const onmousemove = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    if (mousedown && gs.instructionBox) {
      if ("point" in gs.instructionBox.instruction) {
        onmousemoveimageinsertion(e);
      } else if ("points" in gs.instructionBox.instruction) {
        onmousemovestroke();
      }
    }
  };

  const onmousedownimageinsertion = (e: MouseEvent) => {
    if (e.button === 2) {
      let imageInsertion = gs.instructionBox!.instruction as ImageInsertion;
      imageInsertion.scale.y = imageInsertion.scale.x;
    }
  };
  const onmousedownstroke = (e: MouseEvent) => {
    if (e.button !== 0) return;
    gs.instructionBox = {
      uuid: crypto.randomUUID(),
      applied: true,
      instruction: {
        points: [],
        brush: gs.brush,
      },
    };
    layerData.tmps.set(gs.instructionBox.uuid, { canvas: undefined, brush: gs.brush });
    if (e.shiftKey && lastPoint) {
      (gs.instructionBox.instruction as Stroke).points.push(lastPoint);
      tempDraw(gs.instructionBox);
    }
    (gs.instructionBox.instruction as Stroke).points.push(cursorPosition!);
    tempDraw(gs.instructionBox);
  };
  const onmousedown = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    mousedown = true;
    if (gs.instructionBox && "point" in gs.instructionBox.instruction) {
      onmousedownimageinsertion(e);
    } else if (!gs.instructionBox) {
      onmousedownstroke(e);
    }
  };

  const onmouseupstroke = () => {
    if (gs.instructionBox) {
      gs.server?.instructionBox(gs.instructionBox, name);
      gs.instructionBox = null;
    }
    lastPoint = gs.cursorPosition!;
  };
  const onmouseup = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    mousedown = false;
    if (gs.instructionBox && "point" in gs.instructionBox.instruction) {
      // Nothing to do on mouse up in image insertion mode.
    } else if (gs.instructionBox && "points" in gs.instructionBox.instruction) {
      onmouseupstroke();
    }
  };

  const onmouseout = (element: HTMLDivElement, e: MouseEvent) => {
    if (mousedown) {
      onmouseup(element, e);
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
    const onmouseoutwrapped = function (this: HTMLDivElement, e: MouseEvent) {
      onmouseout(this, e);
    };
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
      };
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
      layerData.tmps.delete(data.detail.instruction.uuid);
      friendStrokes.delete(data.detail.instruction.uuid);
    }
  };

  const ontempdraw = (data: CustomEvent<TempDrawMessage["TempDraw"]>) => {
    const brush = FromServer.brush(data.detail.brush);
    if (data.detail.layer === name) {
      if (!layerData.tmps.has(data.detail.uuid)) {
        layerData.tmps.set(data.detail.uuid, { canvas: undefined, brush });
        const stroke: Stroke = {
          points: [data.detail.start, data.detail.end],
          brush: FromServer.brush(data.detail.brush),
        };
        friendStrokes.set(data.detail.uuid, {
          applied: true,
          uuid: data.detail.uuid,
          instruction: stroke,
        });
      } else {
        const stroke = friendStrokes.get(data.detail.uuid);
        (stroke!.instruction as Stroke).points.push(data.detail.end);
      }
      const stroke = friendStrokes.get(data.detail.uuid)!;
      tempDraw(stroke);
    }
  };

  const onsethistoryelementvisibility = (
    data: CustomEvent<SetHistoryElementVisibilityMessage["SetHistoryElementVisibility"]>,
  ) => {
    if (data.detail.layer === name) {
      renderFrom(data.detail.index);
    }
  };

  const onmoveinstruction = (
    data: CustomEvent<MoveInstructionMessage["MoveInstruction"]>,
  ) => {
    if (data.detail.layer === name) {
      renderFrom(Math.min(data.detail.old_instruction_index, data.detail.new_instruction_index) - 1);
    }
  };

  $effect(() => {
    gs.server?.addEventListener("instruction", oninstruction);
    gs.server?.addEventListener("tempdraw", ontempdraw);
    gs.server?.addEventListener("sethistoryelementvisibility", onsethistoryelementvisibility);
    gs.server?.addEventListener("moveinstruction", onmoveinstruction);

    return () => {
      gs.server?.removeEventListener("instruction", oninstruction);
      gs.server?.removeEventListener("tempdraw", ontempdraw);
      gs.server?.removeEventListener("sethistoryelementvisibility", onsethistoryelementvisibility);
      gs.server?.removeEventListener("moveinstruction", onmoveinstruction);
    };
  });

  $effect(() => {
    if (!layerData.historyContexts.has(0)) {
      let clearContext = copyContext(context);
      clearContext.clearRect(0, 0, clearContext.canvas.width, clearContext.canvas.height);
      layerData.historyContexts.set(0, clearContext);
    }
  });

  // Whenever the history changes, draw the appropriate history context.
  // If historyContexts is not initialized yet, it must be done with a clear context.
  $effect(() => {
    if (layer.historyIndex != untrack(() => currentIndex))
      untrack(() => renderFrom(layer.historyIndex));
  });

  $effect(() => {
    if (
      gs.instructionBox &&
      "point" in gs.instructionBox.instruction &&
      gs.selectedLayer === name
    ) {
      if (!layerData.tmps.get(gs.instructionBox.uuid)) {
        lastUuid = gs.instructionBox.uuid;
        layerData.tmps.set(gs.instructionBox.uuid, { canvas: undefined, brush: gs.brush });
      }
      const canvas = layerData.tmps.get(gs.instructionBox.uuid)!.canvas;
      if (canvas) {
        const tempContext = canvas!.getContext("2d")!;
        tempContext.clearRect(0, 0, tempContext.canvas.width, tempContext.canvas.height);
        const imageInsertion = gs.instructionBox.instruction;
        if (!image) {
          image = new Image();
          new Promise((resolve, reject) => {
            image!.onload = resolve;
            image!.onerror = reject;
            image!.src = (gs.instructionBox!.instruction as ImageInsertion).base64;
          }).then(() => {
            drawImage(image!, imageInsertion, tempContext);
          });
        } else {
          drawImage(image!, imageInsertion, tempContext);
        }
      }
    } else if (!gs.instructionBox && lastUuid) {
      if (lastUuid) {
        layerData.tmps.delete(lastUuid);
      }
      image = undefined;
      lastUuid = undefined;
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
{#if layerData}
  {#each layerData.tmps.entries() as [uuid, canvas] (uuid)}
    <canvas bind:this={canvas.canvas} height={gs.drawing.height} width={gs.drawing.width}></canvas>
  {/each}
{/if}

<style>
  canvas {
    position: absolute;
  }
</style>
