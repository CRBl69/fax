<script lang="ts">
  import HistoryPaneItem from "./HistoryPaneItem.svelte";
  import { gs } from "./state.svelte";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  let layer = $derived.by(() => gs.drawing.layers.get(name)!);
</script>

<div class="history">
  {#each layer.history as [index, instruction] (instruction.uuid)}
    <HistoryPaneItem {instruction} {index} layerName={name} historyIndex={layer.historyIndex} />
  {/each}
</div>

<style>
  .history {
    display: flex;
    flex-direction: column;
    overflow: scroll;
    height: 100%;
  }
</style>
