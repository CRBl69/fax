<script lang="ts">
  import { ToolType } from "$lib/toupper";
  import { gs } from "../state.svelte";
  import BrushSettings from "./BrushSettings.svelte";
  import BucketSettings from "./BucketSettings.svelte";
</script>

{#if gs.tool?.getToolType() === ToolType.Stroke}
  <BrushSettings />
{:else if gs.tool?.getToolType() === ToolType.Bucket}
  <BucketSettings />
{/if}
