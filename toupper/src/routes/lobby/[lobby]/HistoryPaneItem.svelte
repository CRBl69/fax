<script lang="ts">
  import type { InstructionBox } from "$lib/drinfo";
  import { gs } from "./state.svelte";

  interface Props {
    instruction: InstructionBox;
    index: number;
    historyIndex: number;
    layerName: string;
  }

  let { instruction, index, historyIndex, layerName }: Props = $props();
</script>

<div
  class="container {historyIndex >= index ? 'past' : 'future'}"
  onclick={() => {
    // TODO: undo/redo
  }}
>
  <div>
    {index}
    {#if "points" in instruction.instruction}
      Stroke
    {:else if "selection" in instruction.instruction}
      Motion
    {:else if "base64" in instruction.instruction}
      ImageInsertion
    {/if}
  </div>
  <input
    type="checkbox"
    checked={instruction.applied}
    onclick={(v) => {
      gs.server?.setHistoryElementVisibility(layerName, index, !instruction.applied);
    }}
  />
</div>

<style>
  .container {
    border: 1px solid var(--darkGrey);
    border-top: none;
  }
  .future {
    color: var(--lightGrey);
  }
</style>
