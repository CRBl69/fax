<script lang="ts">
  import { gs } from "$lib/state.svelte";
  import { percentageToU32, u32ToPercentage } from "$lib/util";
</script>

<div class="container">
  <div class="inner-container">
    <div>Color:</div>
    <div class="input-group">
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
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
  </div>
  <div class="inner-container brush-container">
    <label for="brush-opactiy">Opacity:</label>
    <div class="input-group">
      <input
        id="brush-opactiy"
        type="range"
        min="0"
        max="100"
        bind:value={
          () => u32ToPercentage(gs.brush.opacity), (v) => (gs.brush.opacity = percentageToU32(v))
        }
      />
      <input
        type="number"
        bind:value={
          () => u32ToPercentage(gs.brush.opacity), (v) => (gs.brush.opacity = percentageToU32(v))
        }
      />
    </div>
  </div>
  <div class="inner-container">
    <label for="brush-width">Width:</label>
    <div class="input-group">
      <input id="brush-width" type="range" min="1" max="1000" bind:value={gs.brush.width} />
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
    <label for="brush-hardness">hardness:</label>
    <div class="input-group">
      <input
        id="brush-hardness"
        type="range"
        min="0"
        max="100"
        bind:value={
          () => u32ToPercentage(gs.brush.hardness), (v) => (gs.brush.hardness = percentageToU32(v))
        }
      />
      <input
        type="number"
        oninput={(e) => {
          if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
            gs.brush.hardness = Number(e.currentTarget.value);
          }
        }}
        bind:value={
          () => u32ToPercentage(gs.brush.hardness), (v) => (gs.brush.hardness = percentageToU32(v))
        }
      />
    </div>
  </div>
  <div class="inner-container brush-container">
    <label for="brush-repeat">Repeat:</label>
    <div class="input-group">
      <input
        id="brush-repeat"
        type="range"
        min="1"
        max="100"
        bind:value={
          () => u32ToPercentage(gs.brush.repeat), (v) => (gs.brush.repeat = percentageToU32(v))
        }
      />
      <input
        type="number"
        bind:value={
          () => u32ToPercentage(gs.brush.repeat), (v) => (gs.brush.repeat = percentageToU32(v))
        }
      />
    </div>
  </div>
  <div class="inner-container">
    <label for="brush-shape">Shape:</label>
    <select bind:value={gs.brush.brushShape.shape}>
      <option value="circle" selected>Circle</option>
      <option value="square">Square</option>
    </select>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }
  .input-group {
    display: flex;
    flex-direction: row;
    place-items: center;
    gap: 0.2em;
  }
  .inner-container {
    height: 2em;
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
  .brush-color {
    width: 7ch;
    font-family: monospace;
    font-size: 16px;
    cursor: pointer;
  }
</style>
