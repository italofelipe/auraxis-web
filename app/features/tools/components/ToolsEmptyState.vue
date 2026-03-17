<script setup lang="ts">
// No props required — this is a static empty state component.
</script>

<template>
  <div class="tools-empty-state">
    <p class="tools-empty-state__message">
      Nenhuma ferramenta disponível no momento.
    </p>
    <p class="tools-empty-state__hint">
      Novas ferramentas estão sendo preparadas. Volte em breve!
    </p>
  </div>
</template>

<style scoped>
.tools-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-2);
  text-align: center;
}

.tools-empty-state__message {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-neutral-700);
}

.tools-empty-state__hint {
  margin: 0;
  font-size: var(--font-size-body-sm);
  color: var(--color-neutral-500);
}
</style>
