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
    <UiWizardProgress :current="stepIndex" :total="totalSteps" />

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
  gap: var(--space-3, 12px);
}

.questionnaire-step-card__question {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--color-text-primary, #111);
  margin: 0;
  line-height: 1.4;
}

.questionnaire-step-card__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
}
</style>
