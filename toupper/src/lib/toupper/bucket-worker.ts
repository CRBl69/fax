import { applyInstruction } from "./instruction";

const images = new Map();

const contexts = new Map();

self.onmessage = (e) => {
  const messageType: "registerContext" | "applyInstruction" | "deleteContext" = e.data.type;
  switch (messageType) {
    case "registerContext":
      contexts.set(e.data.contextId, e.data.context);
      break;
    case "applyInstruction":
      applyInstruction(e.data.instructionBox, contexts.get(e.data.contextId)!, images);
      break;
    case "deleteContext":
      contexts.delete(e.data.contextId);
      break;
  }
};
