<script setup lang="ts">
import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";

defineProps<{ monthLabel: string }>();
const emit = defineEmits<{ shift: [delta: number] }>();
</script>

<template>
  <div class="cc-month-switcher">
    <button
      type="button"
      class="cc-month-switcher__nav"
      aria-label="Mês anterior"
      data-testid="cc-month-prev"
      @click="emit('shift', -1)"
    >
      <UiIcon name="chevronLeft" :size="18" />
    </button>
    <span class="cc-month-switcher__label">{{ monthLabel }}</span>
    <button
      type="button"
      class="cc-month-switcher__nav"
      aria-label="Próximo mês"
      data-testid="cc-month-next"
      @click="emit('shift', 1)"
    >
      <UiIcon name="chevronRight" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.cc-month-switcher {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 4px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
}
.cc-month-switcher__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-bg-elevated);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.cc-month-switcher__nav:hover {
  background: var(--color-brand-hover-surface, var(--color-bg-elevated));
  color: var(--color-text-primary);
}
.cc-month-switcher__label {
  display: inline-block;
  min-width: 132px;
  text-align: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.cc-month-switcher__label::first-letter {
  text-transform: uppercase;
}
</style>
