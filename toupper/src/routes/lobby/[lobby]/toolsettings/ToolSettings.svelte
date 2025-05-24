<script lang="ts">
  import { Tool } from "$lib/toupper";
  import { gs } from "../state.svelte";
  import BrushSettings from "./BrushSettings.svelte";
  import BucketSettings from "./BucketSettings.svelte";
</script>

{#if gs.tool === Tool.Stroke}
  <BrushSettings />
{:else if gs.tool === Tool.Bucket}
  <BucketSettings />
{/if}
