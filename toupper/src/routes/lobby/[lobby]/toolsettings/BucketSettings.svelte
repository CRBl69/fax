<script lang="ts">
  import { gs } from "../state.svelte";
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
  <div class="inner-container">
    <label for="brush-diffusion">Tolerance:</label>
    <div class="input-group">
      <input
        id="brush-diffusion"
        type="range"
        min="0"
        max="100"
        bind:value={() => gs.tolerance / 1000, (v) => (gs.tolerance = v * 1000)}
      />
      <input
        type="number"
        bind:value={() => gs.tolerance / 1000, (v) => (gs.tolerance = v * 1000)}
      />
    </div>
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
