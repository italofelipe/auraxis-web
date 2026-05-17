<script setup lang="ts">
import UiWizardProgress from "~/components/ui/UiWizardProgress/UiWizardProgress.vue";
import UiOptionCardRadio from "~/components/ui/UiOptionCardRadio/UiOptionCardRadio.vue";
import type {
  QuestionnaireQuestionDto,
  QuestionnaireOptionDto,
} from "~/features/investor-profile/contracts/investor-profile.dto";

const props = defineProps<{
  /** The question to render. */
  question: QuestionnaireQuestionDto;
  /** ID of the currently selected option, or null if none. */
  selectedOptionId: number | null;
  /** 1-based index of this step in the wizard. */
  stepIndex: number;
  /** Total number of steps in the wizard. */
  totalSteps: number;
}>();

const emit = defineEmits<{
  /** Emitted when the user selects an option. Payload is the option id. */
  select: [optionId: number];
}>();

/**
 * Determines if the given option is the currently selected one.
 *
 * @param option The option to check.
 * @returns True if this option is selected.
 */
const isSelected = (option: QuestionnaireOptionDto): boolean =>
  option.id === props.selectedOptionId;

/**
 * Forwards the select event from UiOptionCardRadio.
 *
 * @param optionId The selected option ID.
 */
const handleSelect = (optionId: number): void => {
  emit("select", optionId);
};
</script>

<template>
  <div class="questionnaire-step-card">
    <div class="questionnaire-step-card__header">
      <UiWizardProgress :current="stepIndex" :total="totalSteps" />
      <span class="questionnaire-step-card__badge">Questionário ativo</span>
    </div>

    <h2 class="questionnaire-step-card__question">{{ question.text }}</h2>

    <div class="questionnaire-step-card__options" role="radiogroup" :aria-label="question.text">
      <UiOptionCardRadio
        v-for="option in question.options"
        :key="option.id"
        :option="option"
        :selected="isSelected(option)"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.questionnaire-step-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  --color-brand-50: rgba(68, 212, 255, 0.12);
  --color-brand-200: rgba(68, 212, 255, 0.3);
  --color-brand-600: var(--color-brand-500);
}

.questionnaire-step-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.questionnaire-step-card__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-brand-glow-sm);
  border-radius: var(--radius-full);
  background: var(--color-brand-glow-2xs);
  color: var(--color-brand-300);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.questionnaire-step-card__question {
  max-width: 780px;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.12;
  letter-spacing: 0;
}

.questionnaire-step-card__options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.questionnaire-step-card :deep(.ui-wizard-progress) {
  color: var(--color-text-muted);
}

.questionnaire-step-card :deep(.ui-option-card-radio) {
  min-height: 96px;
  align-items: flex-start;
  padding: 18px;
  border-width: 1px;
  border-color: var(--color-outline-soft);
  border-radius: var(--radius-md);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.06), rgba(139, 125, 255, 0.03)),
    rgba(5, 7, 13, 0.38);
}

.questionnaire-step-card :deep(.ui-option-card-radio:hover:not(.ui-option-card-radio--disabled)) {
  border-color: var(--color-brand-glow-md);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.1), rgba(66, 232, 169, 0.04)),
    rgba(5, 7, 13, 0.48);
}

.questionnaire-step-card :deep(.ui-option-card-radio--selected) {
  border-color: var(--color-brand-500);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.18), rgba(66, 232, 169, 0.08)),
    rgba(5, 7, 13, 0.58);
  box-shadow: inset 0 0 0 1px rgba(68, 212, 255, 0.18);
}

.questionnaire-step-card :deep(.ui-option-card-radio__text) {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

@media (max-width: 720px) {
  .questionnaire-step-card__options {
    grid-template-columns: 1fr;
  }

  .questionnaire-step-card__question {
    font-size: var(--font-size-2xl);
  }
}
</style>
