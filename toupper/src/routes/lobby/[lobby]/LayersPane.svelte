<script lang="ts">
  import type { Layer } from "$lib/drinfo";
  import LayersPaneLayer from "./LayersPaneLayer.svelte";
  import { gs } from "./state.svelte";

  interface Props {
    layers: Map<string, Layer>;
    layerOrder: string[];
  }

  let { layers, layerOrder }: Props = $props();

  const getNextLayerName = () => {
    let possible = `New layer ${layerOrder.length + 1}`;
    for(let i = 1;layerOrder.includes(possible);i++) {
      possible = `New layer ${layerOrder.length + 1 + i}`
    }
    return possible;
  };

  let newLayerName = $state(getNextLayerName());

  $effect(() => {
    for (let i = 0;newLayerName === `New layer ${layerOrder.length}` || layerOrder.includes(newLayerName); i++) {
      newLayerName = `New layer ${layerOrder.length + 1 + i}`;
    }
  });

  const getLayer = (name: string) => layers.get(name)!;

</script>

<div class="container">
  <div class="layer-name">
    <input type="text" placeholder="layer name" bind:value={newLayerName}>
    <button onclick={() => {
      gs.server?.addLayer(newLayerName);
    }}>+</button>
  </div>
  <div class="layers">
    {#each layerOrder.toReversed() as layer}
      <LayersPaneLayer name={layer} visible={getLayer(layer).visible} />
    {/each}
  </div>
</div>

<style>
.container {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}
.layers {
  margin-top: .4em;
  display: flex;
  flex-direction: column;
  overflow: scroll;
  max-height: calc(100% - 4px);
  border-top: 2px solid var(--darkGrey);
  border-bottom: 2px solid var(--darkGrey);
}
.layer-name {
  display: flex;
  justify-content: space-between;
  max-height: 2em;
}
.layer-name button {
  font-size: 16px;
  margin: auto;
}
</style>
