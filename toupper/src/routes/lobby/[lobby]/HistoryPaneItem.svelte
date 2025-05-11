<script lang="ts">
  import type { InstructionBox } from "$lib/drinfo";

  interface Props {
    instruction: InstructionBox;
    index: number;
    historyIndex: number;
  }

  let { instruction, index, historyIndex }: Props = $props();

  $inspect({index, historyIndex});
</script>

<div class="container {historyIndex > index ? "past" : "future"}" onclick={() => {
  // TODO: undo/redo
}}>
  {index}
  {#if 'points' in instruction.instruction}
    Stroke
  {:else if 'selection' in instruction.instruction}
    Motion
  {:else if 'base64' in instruction.instruction}
    ImageInsertion
  {/if}
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
