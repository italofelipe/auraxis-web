<script setup lang="ts">
import { X, Sparkles } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useOnboarding } from "../composables/useOnboarding";

const { t } = useI18n();
const { isSkipped, isDone, start, reset } = useOnboarding();

const dismissed = ref<boolean>(false);

const shouldShow = computed((): boolean => {
  if (dismissed.value) { return false; }
  if (isDone.value) { return false; }
  return isSkipped.value;
});

/** Reopens the wizard from the partial step the user left off on. */
function onResume(): void {
  start();
}

/** Fully restarts the wizard from step 1, clearing the skipped flag. */
function onRestart(): void {
  reset();
  start();
}

/** Hides the nudge for the current session without changing persisted state. */
function onDismiss(): void {
  dismissed.value = true;
}
</script>

<template>
  <aside
    v-if="shouldShow"
    class="onboarding-nudge"
    role="complementary"
    :aria-label="t('onboarding.nudge.ariaLabel')"
    data-testid="onboarding-skip-nudge"
  >
    <span class="onboarding-nudge__icon" aria-hidden="true"><Sparkles :size="18" /></span>
    <div class="onboarding-nudge__copy">
      <strong class="onboarding-nudge__title">{{ t("onboarding.nudge.title") }}</strong>
      <p class="onboarding-nudge__description">{{ t("onboarding.nudge.description") }}</p>
    </div>
    <div class="onboarding-nudge__actions">
      <button type="button" class="onboarding-nudge__primary" data-testid="onboarding-nudge-resume" @click="onResume">
        {{ t("onboarding.nudge.resume") }}
      </button>
      <button type="button" class="onboarding-nudge__secondary" data-testid="onboarding-nudge-restart" @click="onRestart">
        {{ t("onboarding.nudge.restart") }}
      </button>
    </div>
    <button
      type="button"
      class="onboarding-nudge__close"
      :aria-label="t('onboarding.nudge.dismissAriaLabel')"
      data-testid="onboarding-nudge-dismiss"
      @click="onDismiss"
    >
      <X :size="16" />
    </button>
  </aside>
</template>

<style scoped>
.onboarding-nudge {
  display: grid;
  grid-template-columns: 32px 1fr auto 24px;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-brand-glow-xs);
  margin-bottom: var(--space-2);
}
.onboarding-nudge__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--color-brand-500);
  color: var(--color-bg-base);
}
.onboarding-nudge__title {
  display: block;
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
.onboarding-nudge__description {
  margin: 2px 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.onboarding-nudge__actions {
  display: flex;
  gap: var(--space-1);
}
.onboarding-nudge__primary,
.onboarding-nudge__secondary {
  padding: 6px 12px;
  font-size: var(--font-size-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.onboarding-nudge__primary {
  background: var(--color-brand-600);
  color: var(--color-bg-base);
  border: 1px solid var(--color-brand-600);
}
.onboarding-nudge__secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-outline-soft);
}
.onboarding-nudge__close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.onboarding-nudge__close:hover {
  color: var(--color-text-primary);
}
@media (max-width: 640px) {
  .onboarding-nudge {
    grid-template-columns: 32px 1fr 24px;
    row-gap: var(--space-1);
  }
  .onboarding-nudge__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>
