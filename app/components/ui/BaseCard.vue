<template>
  <section class="base-card">
    <header v-if="title" class="base-card__header">
      <h2 class="base-card__title">{{ title }}</h2>
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
  background: var(--color-surface-50);
  border: 1px solid var(--color-outline-soft);
  box-shadow: var(--shadow-card);
  padding: var(--space-2);
}

.base-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.base-card__title {
  color: var(--color-neutral-900);
  font-family: var(--font-heading);
  font-size: var(--font-size-heading-md);
  line-height: var(--line-height-heading-md);
}
</style>
