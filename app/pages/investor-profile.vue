<script setup lang="ts">
import { ref, computed } from "vue";
import { useMessage } from "naive-ui";
import { useQuestionnaireQuery } from "~/features/investor-profile/queries/use-questionnaire-query";
import { useSubmitAnswersMutation } from "~/features/investor-profile/mutations/use-submit-answers-mutation";
import { useWizardState } from "~/features/investor-profile/composables/use-wizard-state";
import QuestionnaireStepCard from "~/features/investor-profile/components/QuestionnaireStepCard/QuestionnaireStepCard.vue";
import QuestionnaireResult from "~/features/investor-profile/components/QuestionnaireResult/QuestionnaireResult.vue";
import type { QuestionnaireResultDto } from "~/features/investor-profile/contracts/investor-profile.dto";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Perfil do Investidor",
});

useHead({ title: "Perfil do Investidor | Auraxis" });

const message = useMessage();

const { data: questionnaire, isLoading, isError } = useQuestionnaireQuery();

const totalSteps = computed<number>(() => questionnaire.value?.questions.length ?? 0);

const wizard = useWizardState(totalSteps);

const result = ref<QuestionnaireResultDto | null>(null);

const currentQuestion = computed(
  () => questionnaire.value?.questions[wizard.currentStep.value - 1] ?? null,
);

const selectedOptionIdForCurrentStep = computed<number | null>(() => {
  if (!currentQuestion.value) { return null; }
  const questionId = currentQuestion.value.id;
  const answer = wizard.answers.value.get(questionId);
  return answer !== undefined
    ? (questionnaire.value?.questions
        .find((q) => q.id === questionId)
        ?.options.find((o) => o.points === answer)?.id ?? null)
    : null;
});

const submitMutation = useSubmitAnswersMutation();

const isLastStep = computed<boolean>(
  () => wizard.currentStep.value === totalSteps.value,
);

/**
 * Handles option selection for the current step.
 * Maps the option id to its point value and stores in wizard state.
 *
 * @param optionId The selected option's id.
 */
const handleSelect = (optionId: number): void => {
  if (!currentQuestion.value) { return; }
  const option = currentQuestion.value.options.find((o) => o.id === optionId);
  if (!option) { return; }
  wizard.selectAnswer(currentQuestion.value.id, option.points);
};

/** Advances to the next step (guarded by canGoNext). */
const handleNext = (): void => {
  if (wizard.canGoNext.value) {
    wizard.goNext();
  }
};

/** Goes back to the previous step. */
const handlePrev = (): void => {
  wizard.goPrev();
};

/** Submits answers and shows the result. */
const handleSubmit = (): void => {
  const answers = wizard.getAnswersArray();
  submitMutation.mutate(
    { answers },
    {
      onSuccess: (data: QuestionnaireResultDto): void => {
        result.value = data;
      },
      onError: (): void => {
        message.error("Erro ao enviar suas respostas. Tente novamente.", { duration: 5000 });
      },
    },
  );
};
</script>

<template>
  <div class="investor-profile-page">
    <!-- Loading -->
    <UiPageLoader v-if="isLoading" :rows="4" />

    <!-- Error -->
    <UiInlineError
      v-else-if="isError"
      title="Erro ao carregar o questionário"
      message="Carregando questionário... Tente novamente."
    />

    <!-- Result -->
    <QuestionnaireResult v-else-if="result !== null" :result="result" />

    <!-- Wizard -->
    <template v-else-if="currentQuestion !== null">
      <QuestionnaireStepCard
        :question="currentQuestion"
        :selected-option-id="selectedOptionIdForCurrentStep"
        :step-index="wizard.currentStep.value"
        :total-steps="totalSteps"
        @select="handleSelect"
      />

      <div class="investor-profile-page__actions">
        <button
          v-if="wizard.currentStep.value > 1"
          class="investor-profile-page__btn investor-profile-page__btn--secondary"
          type="button"
          @click="handlePrev"
        >
          Anterior
        </button>

        <button
          v-if="!isLastStep"
          class="investor-profile-page__btn investor-profile-page__btn--primary"
          type="button"
          :disabled="!wizard.canGoNext.value"
          @click="handleNext"
        >
          Próxima
        </button>

        <button
          v-else
          class="investor-profile-page__btn investor-profile-page__btn--primary"
          type="button"
          :disabled="!wizard.isComplete.value || submitMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ submitMutation.isPending.value ? "Enviando..." : "Concluir" }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.investor-profile-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 24px);
  padding: var(--space-4, 24px);
  max-width: 560px;
  margin: 0 auto;
}

.investor-profile-page__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2, 8px);
}

.investor-profile-page__btn {
  padding: 10px var(--space-4, 24px);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  border: none;
  transition: background 0.15s ease;
}

.investor-profile-page__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.investor-profile-page__btn--primary {
  background: var(--color-brand-600, #6366f1);
  color: #fff;
}

.investor-profile-page__btn--primary:hover:not(:disabled) {
  background: var(--color-brand-500, #818cf8);
}

.investor-profile-page__btn--secondary {
  background: var(--color-bg-elevated, #f5f5f5);
  color: var(--color-text-primary, #111);
}

.investor-profile-page__btn--secondary:hover {
  background: var(--color-outline-soft, #e0e0e0);
}
</style>
