<script lang="ts">
  import { ToolType } from "$lib/types";
  import { gs } from "$lib/state.svelte";
  import BrushSettings from "./BrushSettings.svelte";
  import BucketSettings from "./BucketSettings.svelte";
</script>

{#if gs.tool?.getToolType() === ToolType.Stroke || gs.tool?.getToolType() === ToolType.Eraser}
  <BrushSettings />
{:else if gs.tool?.getToolType() === ToolType.Bucket}
  <BucketSettings />
{/if}
