<script lang="ts">
  import { onMount } from "svelte";
  import { gs } from "./state.svelte";
  import { stroke } from "$lib/toupper";
  import { SERVER_URL } from "$lib/env";

  let saveUrl = $state("");

  onMount(() => {
    saveUrl = `${location.protocol}//${SERVER_URL}/save`;
  });
</script>

<div class="container">
  <div class="inner-container brush-container">
    <input id="brush-color" type="color" bind:value={gs.brush.color} />
    <div
      class="brush-color"
      onclick={() => {
        navigator.clipboard.writeText(gs.brush.color);
      }}
    >
      {gs.brush.color}
    </div>
  </div>
  <div class="inner-container">
    <label for="brush-width">Width:</label>
    <input id="brush-width" type="range" min="1" max="200" bind:value={gs.brush.width} />
    <input
      type="number"
      oninput={(e) => {
        if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
          gs.brush.width = Number(e.currentTarget.value);
        }
      }}
      value={gs.brush.width}
    />
  </div>
  <div class="inner-container">
    <label for="brush-diffusion">Diffusion:</label>
    <input id="brush-diffusion" type="range" min="0" max="100" bind:value={gs.brush.diffusion} />
    <div>{gs.brush.diffusion}</div>
  </div>
  <div class="inner-container">
    <label for="brush-shape">Shape:</label>
    <select bind:value={gs.brush.brushShape.shape}>
      <option value={"circle"} selected>Circle</option>
      <option value={"square"}>Square</option>
    </select>
  </div>
  <div class="inner-container">
    <label for="brush-type">Erase:</label>
    <input type="checkbox" bind:checked={gs.brush.erase} />
  </div>
  <div class="inner-container">
    <label for="zoom">Zoom:</label>
    <input type="checkbox" bind:checked={gs.zoom} />
    <input id="zoom" type="range" min="1" max="10" step="0.1" bind:value={gs.zoomRatio} />
    <input
      type="number"
      oninput={(e) => {
        if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
          gs.zoomRatio = Number(e.currentTarget.value);
        }
      }}
      value={gs.zoomRatio}
    />
  </div>
  <div class="inner-container">
    <label for="background">Background:</label>
    <input type="checkbox" bind:checked={gs.bg} />
  </div>
  <div class="inner-container">
    <a class="button" href={saveUrl}>Save DrInFo</a>
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="inner-container button"
    onclick={() => {
      const canvas = new OffscreenCanvas(gs.drawing.width, gs.drawing.height);
      const context = canvas.getContext("2d")!;
      for (const layerName of gs.drawing.layerOrder) {
        const layer = gs.drawing.layers.get(layerName)!;
        for (const key of layer.history.keys().toArray().toSorted()) {
          const instruction = layer.history.get(key)!;
          if ("points" in instruction.instruction) {
            stroke(instruction.instruction, context);
          }
        }
      }
      context.canvas.convertToBlob().then((r) => {
        const w = window.open("about:blank")!;
        w.location = URL.createObjectURL(r);
      });
    }}
  >
    Save PNG
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
    gap: 2em;
    margin: 1em;
    flex-wrap: wrap;
  }
  .inner-container {
    display: flex;
    flex-direction: row;
    place-items: center;
    gap: 0.4em;
  }
  .inner-container input[type="number"] {
    font-family: monospace;
    width: 5ch;
    appearance: textfield;
    text-align: right;
    font-size: 14px;
  }
  .brush-container {
    gap: 0.5em;
  }
  .brush-color {
    width: 7ch;
    font-family: monospace;
    font-size: 16px;
    cursor: pointer;
  }
  .button {
    color: var(--white);
    text-decoration: none;
    border: 1px solid var(--lightGrey);
    padding: 0.4em;
    border-radius: 0.2em;
    cursor: pointer;
  }
</style>
