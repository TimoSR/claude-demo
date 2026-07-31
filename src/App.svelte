<script>
  let count = 0;
</script>

<main class="card">
  <h1>Hello, Svelte!</h1>
  <p>This is a minimal interactive demo.</p>
  <button on:click={() => count += 1}>
    Clicked {count} {count === 1 ? "time" : "times"}
  </button>
</main>
