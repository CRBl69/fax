<script lang="ts">
  import type { ImageInsertion, InstructionBox, Point, Stroke } from "$lib/drinfo";
  import { getX, getY, ToolType } from "$lib/toupper";
  import { applyInstruction, rgbToStr } from "$lib/render";
  import { onMount, untrack } from "svelte";
  import { gs } from "./state.svelte";
  import { type MoveInstructionMessage, type SetInstructionVisibilityMessage } from "$lib/tolower";
  import { page } from "$app/state";

  interface Props {
    name: string;
    listener: HTMLDivElement | undefined;
  }

  let username = page.params.lobby;

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

  // Used for shift click straight line drawing.
  let lastPoint: Point | undefined = $state(undefined);

  let moveUuid: string | undefined = $state();

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

  const sendSelection = (points: Point[], closed: boolean) => {
    gs.server?.sendSelection(points, closed);
  };

  const sendMove = (end: Point) => {
    if (moveUuid) {
      gs.server?.sendMove(moveUuid, name, end);
    }
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
      const img = gs.images.get(imageInsertion.base64);
      if (!img) return;
      const centerX = Math.round(
        (imageInsertion.point.x * 2 + img.width * imageInsertion.scale.x) / 2,
      );
      const centerY = Math.round(
        (imageInsertion.point.y * 2 + img.height * imageInsertion.scale.y) / 2,
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
    if (gs.toolType === ToolType.Select && cursorPosition) {
      const selection = gs.selections.get(username)!;
      if (selection.points.length === 1) {
        const s = selection.points[0];
        const c = cursorPosition;
        sendSelection([s, { x: c.x, y: s.y }, c, { x: s.x, y: c.y }], true);
      }
    }
    if (gs.toolType === ToolType.Move && gs.userMoveStart && cursorPosition) {
      const dx = cursorPosition.x - gs.userMoveStart!.x;
      const dy = cursorPosition.y - gs.userMoveStart!.y;
      const selectionStart = gs.selections.get(username)!.points[0];
      sendMove({
        x: selectionStart.x + dx,
        y: selectionStart.y + dy,
      });
    }
    if (gs.toolType === ToolType.InsertImage) {
      gs.server?.sendTempImage(
        gs.instructionBox!.uuid,
        name,
        gs.instructionBox!.instruction as ImageInsertion,
      );
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
    if (e.shiftKey && lastPoint) {
      (gs.instructionBox.instruction as Stroke).points.push(lastPoint);
    }
    (gs.instructionBox.instruction as Stroke).points.push(cursorPosition!);
  };
  const onmousedownbucket = () => {
    gs.server?.instructionBox(
      {
        instruction: {
          point: cursorPosition!,
          brush: gs.brush,
        },
        uuid: crypto.randomUUID(),
        applied: true,
      },
      name,
    );
  };
  const onmousedownselect = () => {
    if (!gs.selections.has(username)) {
      gs.selections.set(username, {
        points: [cursorPosition!, cursorPosition!, cursorPosition!, cursorPosition!],
        closed: true,
      });
    } else {
      const selection = gs.selections.get(username)!;
      const start = selection.points[0];
      const end = cursorPosition!;
      gs.selections.set(username, {
        points: [start, { x: end.x, y: start.y }, end, { x: start.x, y: end.y }],
        closed: true,
      });
    }
  };
  const onmousedownpolyselect = () => {
    const prev = gs.selections.get(username);
    const newPoints = [...(prev?.points ?? []), cursorPosition!];
    gs.selections.set(username, { points: newPoints, closed: false });
    sendSelection(newPoints, false);
  };
  const onmousedownmove = () => {
    if ((gs.selections.get(username)?.points.length ?? 0) >= 3) {
      gs.userMoveStart = cursorPosition!;
      moveUuid = crypto.randomUUID();
      sendMove(cursorPosition!);
    }
  };
  const onmousedown = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    mousedown = true;
    if (gs.toolType === ToolType.PickColor) {
      const imgd = context.getImageData(cursorPosition!.x, cursorPosition!.y, 1, 1);
      const colorStr = rgbToStr(imgd.data[0], imgd.data[1], imgd.data[2]);
      gs.brush.opacity = Math.floor((imgd.data[3] * 100000) / 255);
      gs.brush.color = colorStr;
      gs.toolType = ToolType.Stroke;
    } else if (gs.toolType === ToolType.InsertImage) {
      onmousedownimageinsertion(e);
    } else if (gs.toolType === ToolType.Bucket) {
      onmousedownbucket();
    } else if (gs.toolType === ToolType.Select) {
      onmousedownselect();
    } else if (gs.toolType === ToolType.PolySelect) {
      onmousedownpolyselect();
    } else if (gs.toolType === ToolType.Move) {
      onmousedownmove();
    } else if (gs.toolType === ToolType.Stroke && !gs.instructionBox) {
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
  const onmouseupmove = () => {
    const delta = {
      x: cursorPosition!.x - gs.userMoveStart!.x,
      y: cursorPosition!.y - gs.userMoveStart!.y,
    };
    const selection = gs.selections.get(username)!;
    gs.server?.instructionBox(
      {
        instruction: {
          end: { x: selection.points[0].x + delta.x, y: selection.points[0].y + delta.y },
          selection: selection.points,
        },
        uuid: crypto.randomUUID(),
        applied: true,
      },
      name,
    );
    gs.selections.set(username, {
      closed: true,
      points: selection.points.map((p) => ({ x: p.x + delta.x, y: p.y + delta.y })),
    });
    gs.userMoveStart = null;
    moveUuid = undefined;
  };
  const onmouseup = (element: HTMLDivElement, e: MouseEvent) => {
    updateCursorPosition(element, e);
    mousedown = false;
    if (gs.toolType === ToolType.InsertImage) {
    } else if (gs.toolType === ToolType.Move) {
      onmouseupmove();
    } else if (gs.instructionBox && gs.toolType === ToolType.Stroke) {
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
    for (const [, entry] of gs.inProgress) {
      if (entry.layer !== name) continue;
      applyInstruction(entry.instructionBox.instruction, ctx, gs.images);
    }
    if (gs.instructionBox) {
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
