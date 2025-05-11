<script lang="ts">
  let { children } = $props();
</script>

{@render children()}

<style>
  :root {
    --black: #282c34;
    --white: #abb2bf;
    --lightRed: #e06c75;
    --darkRed: #be5046;
    --green: #98c379;
    --lightYellow: #e5c07b;
    --darkYellow: #d19a66;
    --blue: #61afef;
    --magenta: #c678dd;
    --cyan: #56b6c2;
    --darkGrey: #4b5263;
    --lightGrey: #5c6370;
    color: var(--white);
    font-family: sans-serif;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--black);
  }

  :global(input) {
    background: var(--black);
    border: 2px solid var(--darkGrey);
    outline: none;
    color: var(--white);
  }

  :global(input:focus) {
    border: 2px solid var(--lightGrey);
  }

  :global(button) {
    outline: none;
    border: none;
    background: transparent;
    color: var(--white);
  }
</style>
