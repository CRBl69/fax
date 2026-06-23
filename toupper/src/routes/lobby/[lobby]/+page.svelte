<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { SvelteMap } from "svelte/reactivity";
  import { SERVER_URL } from "$lib/env";
  import { FromServer, Server } from "$lib/tolower";
  import Layers from "./Layers.svelte";
  import Buttons from "./Buttons.svelte";
  import HistoryPane from "./HistoryPane.svelte";
  import LayersPane from "./LayersPane.svelte";
  import type { Cursor } from "$lib/toupper";
  import { page } from "$app/stores";
  import { gs, type LayerData } from "./state.svelte";
  import Zoom from "./Zoom.svelte";
  import ToolSettings from "./toolsettings/ToolSettings.svelte";

  let username = $page.params.lobby;

  let users: SvelteMap<string, Cursor | null> = new SvelteMap();

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

  onMount(() => {
    initWebWorker();
    gs.server = new Server(`${location.protocol.replace(/http/, "ws")}//${SERVER_URL}`, username);

    gs.server.registerEventHandler("init", (data) => {
      for (const layerName of data.drawing.layer_order) {
        const x: LayerData = $state({
          historyIndex: 0,
          historyContexts: new SvelteMap(),
          history: [],
          tmps: new SvelteMap(),
        });
        gs.layerData.set(layerName, x);
      }
      gs.drawing = FromServer.drawing(data.drawing);
      data.users.forEach((u) => {
        if (u !== username) users.set(u, null);
      });
    });

    gs.server.registerEventHandler("cursorout", (data) => {
      users.set(data.username, data.cursor ? FromServer.cursor(data.cursor) : null);
    });

    gs.server.registerEventHandler("addlayer", (data) => {
      gs.layerData.set(data, {
        historyContexts: new SvelteMap(),
        tmps: new SvelteMap(),
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
      users.set(data, null);
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
    });

    gs.server.registerEventHandler("removeinstruction", ({ layer, index }) => {
      gs.drawing.removeInstruction(layer, index);
    });

    gs.server.registerEventHandler("tempselect", ({ uuid, points, closed }) => {
      gs.tempSelects.set(uuid, { points, closed });
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
    <Layers {users} />
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
