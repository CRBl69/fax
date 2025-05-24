<script lang="ts">
  import HistoryPaneItem from "./HistoryPaneItem.svelte";
  import { gs } from "./state.svelte";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  let layer = $derived.by(() => gs.drawing.layers.get(name)!);

  let over: number | null = $state(null);
</script>

<div class="history">
  {#each layer.history as instruction, i (instruction.uuid)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="item"
      draggable={true}
      ondragstart={() => {
        gs.draggedInstruction = i + 1;
      }}
      ondragend={() => {
        gs.draggedInstruction = null;
        over = null;
      }}
      ondragenter={() => {
        over = i + 1;
      }}
      ondragexit={() => {
        over = null;
      }}
    >
      <HistoryPaneItem
        {instruction}
        index={i + 1}
        layerName={name}
        historyIndex={layer.historyIndex}
      />
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        ondrop={() => {
          const oldIndex = gs.draggedInstruction!;
          const newIndex = over!;
          gs.server?.moveInstruction(name, oldIndex, newIndex);
        }}
        ondragover={(e) => {
          e.preventDefault();
        }}
        class={(over === i + 1 &&
        gs.draggedInstruction !== i + 1 &&
        gs.draggedInstruction !== i + 1 - 1
          ? "over"
          : "not-over") + " dragarea dragarea-top"}
      >
        Drop here
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        ondrop={() => {
          const oldIndex = gs.draggedInstruction!;
          let newIndex = over! + 1;
          if (gs.draggedInstruction! < over!) {
            newIndex -= 1;
          }
          gs.server?.moveInstruction(name, oldIndex, newIndex);
        }}
        ondragover={(e) => {
          e.preventDefault();
        }}
        class={(over === i + 1 &&
        gs.draggedInstruction !== i + 1 &&
        gs.draggedInstruction !== i + 1 + 1
          ? "over"
          : "not-over") + " dragarea dragarea-bottom"}
      >
        Drop here
      </div>
    </div>
  {/each}
</div>

<style>
  .history {
    display: flex;
    flex-direction: column;
    overflow: scroll;
    height: 100%;
  }
  .item {
    position: relative;
  }
  .dragarea {
    position: absolute;
    z-index: 5;
    height: 2em;
    width: 100%;
    background: rgba(0, 0, 0, 0.6);
    text-align: center;
    place-content: center;
  }
  .over {
    display: unset;
  }
  .not-over {
    display: none;
  }
  .description {
    user-select: none;
  }
  .dragarea-bottom {
    bottom: -1em;
  }
  .dragarea-top {
    top: -1em;
  }
</style>
