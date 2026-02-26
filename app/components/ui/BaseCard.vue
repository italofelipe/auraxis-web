<template>
  <section class="base-card">
    <header v-if="title" class="base-card__header">
      <h2>{{ title }}</h2>
      <slot name="header-extra" />
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

defineProps<Props>();
</script>

<style scoped>
.base-card {
  border-radius: var(--radius-md);
  background: #ffffff;
  border: 1px solid rgba(38, 33, 33, 0.08);
  box-shadow: var(--shadow-card);
  padding: var(--space-2);
}

.base-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.base-card__header h2 {
  font-size: 1.25rem;
}
</style>
