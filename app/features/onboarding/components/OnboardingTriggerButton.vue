<script setup lang="ts">
import { HelpCircle } from "lucide-vue-next";
import { useOnboarding } from "../composables/useOnboarding";

const { t } = useI18n();
const { start, shouldShow } = useOnboarding();

/** Re-opens the guided onboarding tour from any authenticated page. */
function onClick(): void {
  start();
}
</script>

<template>
  <button
    v-if="!shouldShow"
    type="button"
    class="onboarding-trigger"
    :aria-label="t('onboarding.triggerAriaLabel')"
    :title="t('onboarding.triggerTitle')"
    data-testid="onboarding-trigger"
    @click="onClick"
  >
    <HelpCircle :size="20" aria-hidden="true" />
  </button>
</template>

<style scoped>
.onboarding-trigger {
  position: fixed;
  right: var(--space-3);
  bottom: var(--space-3);
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-brand-500);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: background 0.15s, color 0.15s, transform 0.15s;
}
.onboarding-trigger:hover {
  background: var(--color-brand-glow-xs);
  color: var(--color-brand-400);
  transform: translateY(-1px);
}
.onboarding-trigger:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
</style>
