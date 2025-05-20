<script lang="ts">
  import { onMount } from "svelte";
  import { gs } from "./state.svelte";
  import { stroke } from "$lib/toupper";
  import { SERVER_URL } from "$lib/env";

  let saveUrl = $state("");

  let files: FileList | undefined = $state(undefined);

  onMount(() => {
    saveUrl = `${location.protocol}//${SERVER_URL}/save`;
  });

  $effect(() => {
    if (gs.selectedLayer && files && files[0]) {
      const fileReader = new FileReader();
      fileReader.addEventListener("load", (e) => {
        if (!e.target) {
          return;
        }
        const base64img = e.target.result as string;
        let image = new Image();
        image.onload = () => {
          gs.instructionBox = {
            applied: true,
            instruction: {
              base64: base64img,
              point: {
                x: 0,
                y: 0,
              },
              scale: {
                x: 1,
                y: 1,
              },
              rotate: 0,
            },
            uuid: crypto.randomUUID(),
          };
        };
        image.src = base64img;
        files = undefined;
      });
      fileReader.readAsDataURL(files[0]);
    } else {
      files = undefined;
    }
  });
</script>

<div class="container">
  <div class="inner-group">
    <div class="inner-container brush-container">
      <div
        class="brush-color"
        onclick={() => {
          navigator.clipboard.writeText(gs.brush.color);
        }}
      >
        {gs.brush.color}
      </div>
      <input id="brush-color" type="color" bind:value={gs.brush.color} />
    </div>
    <div class="inner-container">
      <label for="brush-type">Erase:</label>
      <input type="checkbox" bind:checked={gs.brush.erase} />
    </div>
  </div>
  <div class="inner-group">
    <div class="inner-container">
      <label for="brush-width">Width:</label>
      <div class="input-group">
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
    </div>
    <div class="inner-container">
      <label for="brush-diffusion">Diffusion:</label>
      <div class="input-group">
        <input
          id="brush-diffusion"
          type="range"
          min="0"
          max="100"
          bind:value={gs.brush.diffusion}
        />
        <input
          type="number"
          oninput={(e) => {
            if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
              gs.brush.diffusion = Number(e.currentTarget.value);
            }
          }}
          value={gs.brush.width}
        />
      </div>
    </div>
  </div>
  <div class="inner-container">
    <label for="brush-shape">Shape:</label>
    <select bind:value={gs.brush.brushShape.shape}>
      <option value={"circle"} selected>Circle</option>
      <option value={"square"}>Square</option>
    </select>
  </div>
  <div class="inner-group">
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
  </div>
  <div class="inner-container">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <label for="insertion">Insert picture:</label>
    {#if !(gs.instructionBox && "point" in gs.instructionBox.instruction)}
      <input
        class="button"
        type="file"
        accept="image/png, image/jpeg"
        id="insertion"
        name="insertion"
        oninput={(f) => {
          if (f.currentTarget.files) {
            files = f.currentTarget.files;
          }
        }}
      />
    {:else}
      <button
        class="button"
        onclick={() => {
          gs.server?.instructionBox(gs.instructionBox!, gs.selectedLayer!);
          gs.instructionBox = null;
        }}>Confirm</button
      >
      <button
        class="button"
        onclick={() => {
          gs.instructionBox = null;
          files = undefined;
        }}>Abort</button
      >
    {/if}
  </div>
  <div class="inner-container">
    <a class="button" href={saveUrl}>Save DrInFo</a>
  </div>
  <div class="inner-container">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="button"
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
</div>

<style>
  .container {
    display: flex;
    flex-direction: row;
    gap: 1em;
    padding: 0.5em;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--darkGrey);
  }
  .inner-group {
    display: flex;
    flex-direction: column;
  }
  .input-group {
    display: flex;
    flex-direction: row;
    place-items: center;
  }
  .inner-container {
    display: flex;
    flex-direction: row;
    place-items: center;
    gap: 0.4em;
    justify-content: space-between;
  }
  .inner-container input[type="number"] {
    font-family: monospace;
    width: 5ch;
    appearance: textfield;
    text-align: right;
    font-size: 14px;
  }
  .inner-container input[type="range"] {
    width: 7.5rem;
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
    padding: 0.2em;
    margin: 0.1em;
    border-radius: 0.2em;
    cursor: pointer;
  }
</style>
