<script setup lang="ts">
import { X } from "lucide-vue-next";
import { useOnboarding } from "../composables/useOnboarding";

const { t } = useI18n();
const { shouldShow, complete, skip } = useOnboarding();

const TOTAL_STEPS = 3;
const currentStep = ref(1);

/** Advances the wizard to the next step when not on the last step. */
function onNext(): void {
  if (currentStep.value < TOTAL_STEPS) {
    currentStep.value++;
  }
}

/** Returns the wizard to the previous step when not on the first step. */
function onBack(): void {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

/** Skips the wizard and marks it as dismissed in persistent storage. */
function onSkip(): void {
  skip();
}

/** Completes the wizard and marks it as done in persistent storage. */
function onComplete(): void {
  complete();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="onboarding-fade">
      <div v-if="shouldShow" class="onboarding-overlay" role="dialog" aria-modal="true" :aria-label="t('onboarding.ariaLabel')">
        <div class="onboarding-backdrop" @click.self="onSkip" />
        <div class="onboarding-dialog">
          <!-- Header -->
          <div class="onboarding-dialog__header">
            <span class="onboarding-dialog__brand">Auraxis</span>
            <button
              type="button"
              class="onboarding-dialog__close"
              :aria-label="t('onboarding.closeAriaLabel')"
              @click="onSkip"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- Progress -->
          <div class="onboarding-dialog__progress">
            <UiWizardProgress :current="currentStep" :total="TOTAL_STEPS" />
          </div>

          <!-- Step content -->
          <div class="onboarding-dialog__body">
            <Transition name="onboarding-step" mode="out-in">
              <OnboardingStep1Profile v-if="currentStep === 1" key="step1" @next="onNext" />
              <OnboardingStep2Transaction v-else-if="currentStep === 2" key="step2" @next="onNext" />
              <OnboardingStep3Goals v-else-if="currentStep === 3" key="step3" @complete="onComplete" />
            </Transition>
          </div>

          <!-- Footer navigation -->
          <div class="onboarding-dialog__footer">
            <button
              v-if="currentStep > 1"
              type="button"
              class="onboarding-dialog__btn-back"
              @click="onBack"
            >
              {{ t("onboarding.back") }}
            </button>
            <span v-else />
            <button
              type="button"
              class="onboarding-dialog__btn-skip"
              @click="onSkip"
            >
              {{ t("onboarding.skip") }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.onboarding-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.onboarding-dialog {
  position: relative;
  z-index: 1;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl, 16px);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.onboarding-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-4) var(--space-2);
}

.onboarding-dialog__brand {
  font-family: var(--font-heading);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  color: var(--color-brand-500);
}

.onboarding-dialog__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.onboarding-dialog__close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover, rgba(255, 255, 255, 0.05));
}

.onboarding-dialog__progress {
  padding: 0 var(--space-4);
}

.onboarding-dialog__body {
  padding: var(--space-2) var(--space-4);
  flex: 1;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-subtle);
}

.onboarding-dialog__btn-back {
  background: none;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px var(--space-3);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.onboarding-dialog__btn-back:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text-primary);
}

.onboarding-dialog__btn-skip {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.onboarding-dialog__btn-skip:hover {
  color: var(--color-text-secondary);
}

/* Transitions */
.onboarding-fade-enter-active,
.onboarding-fade-leave-active {
  transition: opacity 0.25s ease;
}
.onboarding-fade-enter-from,
.onboarding-fade-leave-to {
  opacity: 0;
}

.onboarding-step-enter-active,
.onboarding-step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.onboarding-step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.onboarding-step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
