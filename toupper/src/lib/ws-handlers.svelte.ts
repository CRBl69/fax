import { SvelteMap } from "svelte/reactivity";
import { type Stroke, type Motion, type ImageInsertion } from "$lib/drinfo";
import { FromServer, type Server } from "$lib/tolower";
import { gs, type LayerData } from "$lib/state.svelte";

export function registerWsHandlers(server: Server, username: string): void {
  server.registerEventHandler("init", (data) => {
    for (const layerName of data.drawing.layer_order) {
      const x: LayerData = $state({
        historyContexts: new SvelteMap(),
        currentCanvas: null,
        inProgress: new SvelteMap(),
      });
      gs.layerData.set(layerName, x);
    }
    gs.drawing = FromServer.drawing(data.drawing);
    data.users.forEach((u) => {
      if (u !== username) gs.cursors.set(u, null);
    });
  });

  server.registerEventHandler("cursorout", (data) => {
    gs.cursors.set(data.username, data.cursor ? FromServer.cursor(data.cursor) : null);
  });

  server.registerEventHandler("addlayer", (data) => {
    gs.layerData.set(data, {
      historyContexts: new SvelteMap(),
      currentCanvas: null,
      inProgress: new SvelteMap(),
    });
    gs.drawing.addLayer(data);
  });

  server.registerEventHandler("layerup", (data) => {
    gs.drawing.layerUp(data);
  });

  server.registerEventHandler("layerdown", (data) => {
    gs.drawing.layerDown(data);
  });

  server.registerEventHandler("setlayervisibility", (data) => {
    gs.drawing.setLayerVisibility(data.layer, data.visible);
  });

  server.registerEventHandler("join", (data) => {
    gs.cursors.set(data, null);
  });

  server.registerEventHandler("sethistoryindex", (data) => {
    gs.drawing.setHistoryIndex(data.layer, data.new_history_index);
  });

  server.registerEventHandler("moveinstruction", (data) => {
    gs.drawing.moveInstruction(
      data.layer,
      data.old_instruction_index,
      data.new_instruction_index,
    );
  });

  server.registerEventHandler("snapshot", ({ layer, data, index }) => {
    gs.drawing.snapshot(layer, data, index);
  });

  server.registerEventHandler("setinstructionvisibility", ({ layer, index, visible }) => {
    gs.drawing.setInstructionVisibility(layer, index, visible);
  });

  server.registerEventHandler("instruction", ({ layer, instruction }) => {
    gs.drawing.instruct(layer, FromServer.instructionBox(instruction));
    gs.layerData.get(layer)?.inProgress.delete(instruction.uuid);
    gs.inProgressTick++;
  });

  server.registerEventHandler("removeinstruction", ({ layer, index }) => {
    gs.drawing.removeInstruction(layer, index);
  });

  server.registerEventHandler("selection", ({ points, closed, username }) => {
    gs.selections.set(username, { points, closed });
  });

  server.registerEventHandler("tempdraw", (data) => {
    if (data.layer !== gs.selectedLayer) return;
    const ip = gs.layerData.get(data.layer)?.inProgress;
    if (!ip) return;
    const brush = FromServer.brush(data.brush);
    const existing = ip.get(data.uuid);
    if (!existing) {
      const stroke: Stroke = {
        points: [data.start, data.end],
        brush,
      };
      ip.set(data.uuid, {
        instructionBox: { uuid: data.uuid, applied: true, instruction: stroke },
        layer: data.layer,
        username: "",
      });
    } else {
      const stroke = existing.instructionBox.instruction as Stroke;
      ip.set(data.uuid, {
        ...existing,
        instructionBox: {
          ...existing.instructionBox,
          instruction: {
            ...stroke,
            points: [...stroke.points, data.end],
          },
        },
      });
    }
    gs.inProgressTick++;
  });

  server.registerEventHandler("tempimagestart", ({ uuid, image_insertion, layer }) => {
    const ip = gs.layerData.get(layer)?.inProgress;
    if (!ip) return;
    ip.set(uuid, {
      instructionBox: { uuid, applied: true, instruction: image_insertion as ImageInsertion },
      layer,
      username: "",
    });
    gs.inProgressTick++;
  });

  server.registerEventHandler("tempimage", ({ uuid, point, rotate, scale }) => {
    for (const ld of gs.layerData.values()) {
      const entry = ld.inProgress.get(uuid);
      if (entry) {
        const img = entry.instructionBox.instruction as ImageInsertion;
        ld.inProgress.set(uuid, {
          ...entry,
          instructionBox: {
            ...entry.instructionBox,
            instruction: { ...img, point, rotate, scale },
          },
        });
        break;
      }
    }
    gs.inProgressTick++;
  });

  server.registerEventHandler("tempmove", ({ uuid, username, end, layer }) => {
    const ip = gs.layerData.get(layer)?.inProgress;
    if (!ip) return;
    if (end) {
      const existing = ip.get(uuid);
      if (!existing) {
        ip.set(uuid, {
          instructionBox: {
            uuid,
            applied: true,
            instruction: { end, selection: [] } as Motion,
          },
          layer,
          username,
        });
      } else {
        const motion = existing.instructionBox.instruction as Motion;
        ip.set(uuid, {
          ...existing,
          instructionBox: {
            ...existing.instructionBox,
            instruction: { ...motion, end },
          },
        });
      }
    } else {
      ip.delete(uuid);
    }
    gs.inProgressTick++;
  });
}
