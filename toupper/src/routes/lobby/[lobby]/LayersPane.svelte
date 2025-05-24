<script lang="ts">
  import { type InstructionBox } from "$lib/drinfo";
  import LayersPaneLayer from "./LayersPaneLayer.svelte";
  import { gs } from "./state.svelte";

  const getNextLayerName = () => {
    let possible = `New layer ${gs.drawing.layerOrder.length + 1}`;
    for (let i = 1; gs.drawing.layerOrder.includes(possible); i++) {
      possible = `New layer ${gs.drawing.layerOrder.length + 1 + i}`;
    }
    return possible;
  };

  let newLayerName = $state(getNextLayerName());

  $effect(() => {
    for (
      let i = 0;
      newLayerName === `New layer ${gs.drawing.layerOrder.length}` ||
      gs.drawing.layerOrder.includes(newLayerName);
      i++
    ) {
      newLayerName = `New layer ${gs.drawing.layerOrder.length + 1 + i}`;
    }
  });

  const getLayer = (name: string) => gs.drawing.layers.get(name)!;
</script>

<div class="container">
  <div class="layer-name">
    <input type="text" placeholder="layer name" bind:value={newLayerName} />
    <button
      onclick={() => {
        gs.server?.addLayer(newLayerName);
      }}>+</button
    >
  </div>
  <div class="layers">
    {#each gs.drawing.layerOrder.toReversed() as layer}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        ondrop={() => {
          if (gs.selectedLayer !== null && gs.draggedInstruction !== null) {
            const instruction = gs.drawing.layers.get(gs.selectedLayer)!.history[
              gs.draggedInstruction - 1
            ];
            const instructionCopy: InstructionBox = {
              instruction: instruction.instruction,
              uuid: crypto.randomUUID(),
              applied: instruction.applied,
            };
            gs.server?.instructionBox(instructionCopy, layer);
            gs.server?.removeInstruction(gs.selectedLayer!, gs.draggedInstruction!);
          }
        }}
        ondragover={(e) => {
          e.preventDefault();
        }}
      >
        <LayersPaneLayer name={layer} visible={getLayer(layer).visible} />
      </div>
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
    margin-top: 0.4em;
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
