<script lang="ts">
  import HistoryPaneItem from "./HistoryPaneItem.svelte";
  import { gs } from "./state.svelte";

  interface Props {
    name: string;
  }

  let { name }: Props = $props();

  let layerData = $derived.by(() => gs.layerData.get(name)!);
</script>

<div class="history">
  {#each layerData.history as instruction, index (instruction.uuid)}
    <HistoryPaneItem {instruction} {index} historyIndex={layerData.historyIndex} />
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
