<script lang="ts">
  import { env } from "$env/dynamic/public";
  import { onMount } from "svelte";
  import { gs } from "./state.svelte";

  let saveUrl = $state("");

  onMount(() => {
    saveUrl = `${location.protocol}//${env.PUBLIC_HOST}/save`;
  })
</script>

<div class="container">
  <div class="inner-container brush-container">
    <input id="brush-color" type="color" bind:value={gs.brush.color}>
    <div class="brush-color" onclick={() => {
      navigator.clipboard.writeText(gs.brush.color)
    }}>{gs.brush.color}</div>
  </div>
  <div class="inner-container">
    <label for="brush-width">Width:</label>
    <input id="brush-width" type="range" min="1" max="200" bind:value={gs.brush.width}>
    <input type="number" oninput={(e) => {
      if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
        gs.brush.width = Number(e.currentTarget.value);
      }
    }} value={gs.brush.width}>
  </div>
  <div class="inner-container">
    <label for="brush-diffusion">Diffusion:</label>
    <input id="brush-diffusion" type="range" min="0" max="100" bind:value={gs.brush.diffusion}>
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
    <input type="checkbox" bind:checked={gs.brush.erase}>
  </div>
  <div class="inner-container">
    <label for="zoom">Zoom:</label>
    <input type="checkbox" bind:checked={gs.zoom}>
    <input id="zoom" type="range" min="1" max="10" step="0.1" bind:value={gs.zoomRatio}>
    <input type="number" oninput={(e) => {
      if (e.currentTarget.value && !isNaN(Number(e.currentTarget.value))) {
        gs.zoomRatio = Number(e.currentTarget.value);
      }
    }} value={gs.zoomRatio}>
  </div>
  <div class="inner-container">
    <label for="background">Background:</label>
    <input type="checkbox" bind:checked={gs.bg}>
  </div>
  <div class="inner-container">
    <a href={saveUrl}>Save</a>
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
  gap: .4em;
}
.inner-container input[type=number] {
  font-family: monospace;
  width: 5ch;
  appearance: textfield;
  text-align: right;
  font-size: 14px;
}
.brush-container {
  gap: .5em;
}
.brush-color {
  width: 7ch;
  font-family: monospace;
  font-size: 16px;
  cursor: pointer;
}
a {
  color: var(--white);
  text-decoration: none;
  border: 1px solid var(--lightGrey);
  padding: .4em;
  border-radius: .2em;
}
</style>

