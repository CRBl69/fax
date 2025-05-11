<script lang="ts">
  let value = $state();
</script>

<div class="container">
  <form action="/lobby/{value}">
    <input bind:value={value} placeholder="username" type="text" autocomplete="off" />
    <input aria-label="join" type="submit" value="join">
  </form>
</div>

<style>
.container {
  display: grid;
  place-content: center;
  place-items: center;
  height: 100vh;
  gap: 1em;
}
</style>
