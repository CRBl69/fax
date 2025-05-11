<script lang="ts">
  import { gs } from "./state.svelte";

  interface Props {
    name: string;
    visible: boolean;
  }

  let { name, visible }: Props = $props();

  let canvas: HTMLCanvasElement;

  let original = $derived.by(() => {
    const layerData = gs.layerData.get(name);
    return layerData?.historyContexts.get(layerData.historyIndex);
  });

  $effect(() => {
    if(canvas) {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      if(original) {
        context?.drawImage(original?.canvas, 0, 0);
      }
    }
  })

</script>

<div class="layer {gs.selectedLayer === name ? "selected" : ""}" onclick={() => {
  gs.selectedLayer = name;
}}>
  <canvas bind:this={canvas} width={original?.canvas.width} height={original?.canvas.height} class="layer-preview">
  </canvas>
  <span class="name">
  {name}
  </span>
  <div class="buttons">
    <button class="up" onclick={() => gs.server?.layerUp(name)}>UP</button>
    <button class="down" onclick={() => gs.server?.layerDown(name)}>DOWN</button>
    <button class="toggle" onclick={() => gs.server?.toggleLayerVisibility(name)}>{visible ? "HIDE" : "SHOW"}</button>
  </div>
</div>

<style>
.layer {
  border: 1px solid var(--darkGrey);
  padding: .2em;
  outline: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.layer:first-child {
  border-top: none;
}
.layer:last-child {
  border-bottom: none;
}
.selected {
  background: var(--blue);
}
.selected * {
  color: var(--black);
}
.layer-preview {
  border: 1px solid var(--darkGrey);
  max-width: 4em;
}
.buttons {
  display: grid;
  grid-template-rows: 2;
  grid-template-columns: 2;
}
.up, .down {
  border: 1px solid var(--darkGrey);
}
.up {
  grid-row: 1;
}
.down {
  grid-row: 2;
  border-top: none;
}
.toggle {
  grid-column: 2;
  grid-row: 1 / 3;
  width: 7ch;
}
.name {
  place-content: center;
}
</style>
