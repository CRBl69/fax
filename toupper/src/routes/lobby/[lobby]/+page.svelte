<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { SERVER_URL } from "$lib/env";
  import { FromServer, Server } from "$lib/tolower";
  import type { Stroke, Motion, ImageInsertion } from "$lib/drinfo";
  import Layers from "./Layers.svelte";
  import Buttons from "./Buttons.svelte";
  import HistoryPane from "./HistoryPane.svelte";
  import LayersPane from "./LayersPane.svelte";
  import { page } from "$app/stores";
  import { gs, type LayerData } from "$lib/state.svelte";
  import Zoom from "./Zoom.svelte";
  import ToolSettings from "./toolsettings/ToolSettings.svelte";

  let username = $page.params.lobby ?? crypto.randomUUID();

  $effect(() => {
    gs.username = username;
  });

  let menu: "tool" | "history" = $state("tool");

  async function initWebWorker() {
    if (window.Worker) {
      const CanvasWorker = await import("$lib/toupper/canvas-worker.ts?worker");
      gs.canvasWorker = new CanvasWorker.default();
    }
  }

  function terminateWorker() {
    if (gs.canvasWorker) {
      gs.canvasWorker.terminate();
    }
  }

  $inspect(gs.instructionBox);

  onMount(() => {
    initWebWorker();
    gs.server = new Server(`${location.protocol.replace(/http/, "ws")}//${SERVER_URL}`, username);

    gs.server.registerEventHandler("init", (data) => {
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

    gs.server.registerEventHandler("cursorout", (data) => {
      gs.cursors.set(data.username, data.cursor ? FromServer.cursor(data.cursor) : null);
    });

    gs.server.registerEventHandler("addlayer", (data) => {
      gs.layerData.set(data, {
        historyContexts: new SvelteMap(),
        currentCanvas: null,
        inProgress: new SvelteMap(),
      });
      gs.drawing.addLayer(data);
    });

    gs.server.registerEventHandler("layerup", (data) => {
      gs.drawing.layerUp(data);
    });

    gs.server.registerEventHandler("layerdown", (data) => {
      gs.drawing.layerDown(data);
    });

    gs.server.registerEventHandler("setlayervisibility", (data) => {
      gs.drawing.setLayerVisibility(data.layer, data.visible);
    });

    gs.server.registerEventHandler("join", (data) => {
      gs.cursors.set(data, null);
    });

    gs.server.registerEventHandler("sethistoryindex", (data) => {
      gs.drawing.setHistoryIndex(data.layer, data.new_history_index);
    });

    gs.server.registerEventHandler("moveinstruction", (data) => {
      gs.drawing.moveInstruction(
        data.layer,
        data.old_instruction_index,
        data.new_instruction_index,
      );
    });

    gs.server.registerEventHandler("snapshot", ({ layer, data, index }) => {
      gs.drawing.snapshot(layer, data, index);
    });

    gs.server.registerEventHandler("setinstructionvisibility", ({ layer, index, visible }) => {
      gs.drawing.setInstructionVisibility(layer, index, visible);
    });

    gs.server.registerEventHandler("instruction", ({ layer, instruction }) => {
      gs.drawing.instruct(layer, FromServer.instructionBox(instruction));
      gs.layerData.get(layer)?.inProgress.delete(instruction.uuid);
      gs.inProgressTick++;
    });

    gs.server.registerEventHandler("removeinstruction", ({ layer, index }) => {
      gs.drawing.removeInstruction(layer, index);
    });

    gs.server.registerEventHandler("selection", ({ points, closed, username }) => {
      gs.selections.set(username, { points, closed });
    });

    gs.server.registerEventHandler("tempdraw", (data) => {
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

    gs.server.registerEventHandler("tempimagestart", ({ uuid, image_insertion, layer }) => {
      const ip = gs.layerData.get(layer)?.inProgress;
      if (!ip) return;
      ip.set(uuid, {
        instructionBox: { uuid, applied: true, instruction: image_insertion as ImageInsertion },
        layer,
        username: "",
      });
      gs.inProgressTick++;
    });

    gs.server.registerEventHandler("tempimage", ({ uuid, point, rotate, scale }) => {
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

    gs.server.registerEventHandler("tempmove", ({ uuid, username, end, layer }) => {
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "x") {
        const temp = gs.secondaryBrush;
        gs.secondaryBrush = gs.brush;
        gs.brush = temp;
      }
    });
  });

  $effect(() => {
    if (gs.selectedLayer === null && gs.drawing.layerOrder.length > 0) {
      gs.selectedLayer = gs.drawing.layerOrder[0];
    }
  });

  onDestroy(() => {
    terminateWorker();
    if (gs.server) {
      gs.server.close();
      gs.server = null;
    }
  });
</script>

<div class="container">
  <div class="buttons">
    <Buttons />
  </div>
  <div class="layers-pane">
    <LayersPane />
  </div>
  <div class="history-pane">
    <div class="tool-history-tabs">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class={`tool-history-tab ${menu === "tool" ? "tool-history-tab-selected" : ""}`}
        onclick={() => (menu = "tool")}
      >
        Tool
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class={`tool-history-tab ${menu === "history" ? "tool-history-tab-selected" : ""}`}
        onclick={() => (menu = "history")}
      >
        History
      </div>
    </div>
    {#if menu === "tool"}
      <ToolSettings />
    {:else if menu === "history"}
      {#if gs.selectedLayer}
        <HistoryPane name={gs.selectedLayer} />
      {:else}
        <div></div>
      {/if}
    {/if}
  </div>
  <div class="layers">
    <Layers />
  </div>
  <div class="info">
    <div class="coordinates">
      <div>X: {gs.cursorPosition?.x.toFixed(0)}</div>
      <div>Y: {gs.cursorPosition?.y.toFixed(0)}</div>
    </div>
    <div class="coordinates">
      <div>H: {gs.drawing.height}</div>
      <div>W: {gs.drawing.width}</div>
    </div>
  </div>
  {#if gs.zoom}
    <Zoom />
  {/if}
</div>

<style>
  .container {
    height: 100vh;
    width: 100vw;
    display: grid;
    grid-template-rows: auto repeat(2, minmax(0, 1fr)) auto;
    grid-template-columns: minmax(0, 1fr) 5fr;
    overflow: hidden;
  }
  .layers-pane {
    grid-row: 2;
    grid-column: 1;
  }
  .history-pane {
    grid-row: 3;
    grid-column: 1;
  }
  .layers {
    grid-row: 2 / 4;
    grid-column: 2;
  }
  .buttons {
    grid-row: 1;
    grid-column: 1 / 3;
  }
  .info {
    grid-column: 1 / 3;
    display: flex;
    justify-content: space-between;
  }
  .coordinates {
    display: flex;
  }
  .coordinates div {
    width: 15ch;
  }
  .tool-history-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--lightGrey);
    cursor: pointer;
  }
  .tool-history-tab {
    width: 100%;
    text-align: center;
  }
  .tool-history-tab:nth-child(1) {
    border-right: 1px solid var(--lightGrey);
  }
  .tool-history-tab-selected {
    background-color: var(--lightGrey);
  }
</style>
