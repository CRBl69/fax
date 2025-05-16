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

  export const ssr = false;
  export const csr = true;

  let username = $page.params.lobby;

  let users: SvelteMap<string, Cursor | null> = $state(new SvelteMap());

  onMount(() => {
    gs.server = new Server(
      `${location.protocol.replace(/http/, "ws")}//${SERVER_URL}`,
      username,
    );

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
      console.log("layer up");
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

    gs.server.registerEventHandler("undo", (data) => {
      gs.drawing.undo(data);
    });

    gs.server.registerEventHandler("redo", (data) => {
      gs.drawing.redo(data);
    });

    gs.server.registerEventHandler("snapshot", ({ layer, data, index }) => {
      gs.drawing.snapshot(layer, data, index);
    });

    gs.server.registerEventHandler("sethistoryelementvisibility", ({ layer, index, visible }) => {
      gs.drawing.setHistoryElementVisibility(layer, index, visible);
    });

    gs.server.registerEventHandler("instruction", ({ layer, instruction }) => {
      gs.drawing.instruct(layer, FromServer.instructionBox(instruction));
    });
  });

  onDestroy(() => {
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
    {#if gs.selectedLayer}
      <HistoryPane name={gs.selectedLayer} />
    {:else}
      <div></div>
    {/if}
  </div>
  <div class="layers">
    <Layers {users} />
  </div>
  <div class="info">
    <div>
      Layers: {gs.layerData.size}
    </div>
    <div>
      Users: {users.size + 1}
    </div>
    <div class="coordinates">
      <div>X: {gs.cursorPosition?.x.toFixed(3)}</div>
      <div>Y: {gs.cursorPosition?.y.toFixed(3)}</div>
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
</style>
