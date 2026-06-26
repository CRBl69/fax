import { applyInstruction } from "$lib/render";

const images = new Map();

const historyCanvases: Map<string, OffscreenCanvas[]> = new Map();
const canvases: Map<string, OffscreenCanvas> = new Map();

self.onmessage = (e) => {
  const messageType: "registerContext" | "applyInstruction" | "setHistoryIndex" = e.data.type;
  const layer = e.data.layer;
  if (messageType === "registerContext") {
    canvases.set(layer, e.data.canvas);
    historyCanvases.set(layer, []);
  } else if (messageType === "applyInstruction") {
    const canvas = canvases.get(layer)!;
    const canvasCopy = new OffscreenCanvas(canvas.width, canvas.height);
    const contextCopy = canvasCopy.getContext("2d")!;
    contextCopy.drawImage(canvas, 0, 0);
    // applyInstruction(e.data.instructionBox, canvas, images);
  } else if (messageType === "setHistoryIndex") {
  }
};
