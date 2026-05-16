<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gauge,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-vue-next";
import { useToast } from "~/composables/useToast";
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

const toast = useToast();

const { data: questionnaire, isLoading, isError } = useQuestionnaireQuery();

const totalSteps = computed<number>(() => questionnaire.value?.questions.length ?? 0);

const wizard = useWizardState(totalSteps);

const result = ref<QuestionnaireResultDto | null>(null);

interface SignalMetric {
  readonly label: string;
  readonly value: string;
  readonly helper: string;
}

interface RiskMarker {
  readonly label: string;
  readonly tone: "calm" | "balanced" | "growth";
  readonly description: string;
}

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

const answeredSteps = computed<number>(() => wizard.answers.value.size);

const completionPercent = computed<number>(() => {
  if (totalSteps.value === 0) { return 0; }
  return Math.round((answeredSteps.value / totalSteps.value) * 100);
});

const currentStepProgress = computed<number>(() => {
  if (totalSteps.value === 0) { return 0; }
  return Math.round((wizard.currentStep.value / totalSteps.value) * 100);
});

const averageScore = computed<number>(() => {
  const answers = Array.from(wizard.answers.value.values());
  if (answers.length === 0) { return 0; }
  return answers.reduce((total, value) => total + value, 0) / answers.length;
});

const profilePreview = computed<string>(() => {
  if (answeredSteps.value === 0) { return "Em calibragem"; }
  if (averageScore.value >= 2.5) { return "Crescimento"; }
  if (averageScore.value >= 1.75) { return "Balanceado"; }
  return "Proteção";
});

const riskMarkers: readonly RiskMarker[] = [
  {
    label: "Proteção",
    tone: "calm",
    description: "Mais peso para liquidez, previsibilidade e reserva.",
  },
  {
    label: "Balanceado",
    tone: "balanced",
    description: "Combina estabilidade com uma parcela de crescimento.",
  },
  {
    label: "Crescimento",
    tone: "growth",
    description: "Aceita oscilações em busca de retorno no longo prazo.",
  },
];

const signalMetrics = computed<readonly SignalMetric[]>(() => [
  {
    label: "Respostas",
    value: `${answeredSteps.value}/${totalSteps.value || "0"}`,
    helper: "Perguntas concluídas",
  },
  {
    label: "Perfil parcial",
    value: profilePreview.value,
    helper: "Atualizado a cada resposta",
  },
  {
    label: "Confiança",
    value: `${completionPercent.value}%`,
    helper: "Base para o resultado final",
  },
]);

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
        toast.error("Erro ao enviar suas respostas. Tente novamente.", { duration: 5000 });
      },
    },
  );
};
</script>

<template>
  <div class="investor-profile-market-pulse">
    <section class="investor-profile-market-pulse__hero" aria-labelledby="investor-profile-title">
      <div class="investor-profile-market-pulse__hero-copy">
        <span class="investor-profile-market-pulse__eyebrow">
          <Sparkles :size="16" aria-hidden="true" />
          Perfil do investidor
        </span>
        <h1 id="investor-profile-title">Calibragem do perfil</h1>
        <p>
          Responda ao questionário para ajustar tolerância a risco, horizonte e liquidez dentro
          do padrão Market Pulse.
        </p>
      </div>

      <div class="investor-profile-market-pulse__hero-panel" aria-label="Status da calibragem">
        <div>
          <span>Progresso</span>
          <strong>{{ completionPercent }}%</strong>
        </div>
        <div class="investor-profile-market-pulse__hero-track" aria-hidden="true">
          <span :style="{ width: `${completionPercent}%` }" />
        </div>
        <small>{{ answeredSteps }} de {{ totalSteps }} respostas registradas</small>
      </div>
    </section>

    <section class="profile-calibration" aria-label="Calibragem do perfil">
      <div class="profile-calibration__wizard">
        <UiPageLoader v-if="isLoading" :rows="4" />

        <UiInlineError
          v-else-if="isError"
          title="Erro ao carregar o questionário"
          message="Carregando questionário... Tente novamente."
        />

        <QuestionnaireResult v-else-if="result !== null" :result="result" />

        <template v-else-if="currentQuestion !== null">
          <div class="profile-calibration__status">
            <div>
              <span>Etapa {{ wizard.currentStep.value }} de {{ totalSteps }}</span>
              <strong>{{ currentStepProgress }}%</strong>
            </div>
            <div class="profile-calibration__track" aria-hidden="true">
              <span :style="{ width: `${currentStepProgress}%` }" />
            </div>
          </div>

          <QuestionnaireStepCard
            :question="currentQuestion"
            :selected-option-id="selectedOptionIdForCurrentStep"
            :step-index="wizard.currentStep.value"
            :total-steps="totalSteps"
            @select="handleSelect"
          />

          <div class="profile-calibration__actions">
            <button
              v-if="wizard.currentStep.value > 1"
              class="profile-calibration__btn profile-calibration__btn--secondary"
              type="button"
              @click="handlePrev"
            >
              <ArrowLeft :size="16" aria-hidden="true" />
              Anterior
            </button>

            <button
              v-if="!isLastStep"
              class="profile-calibration__btn profile-calibration__btn--primary"
              type="button"
              :disabled="!wizard.canGoNext.value"
              @click="handleNext"
            >
              Próxima
              <ArrowRight :size="16" aria-hidden="true" />
            </button>

            <button
              v-else
              class="profile-calibration__btn profile-calibration__btn--primary"
              type="button"
              :disabled="!wizard.isComplete.value || submitMutation.isPending.value"
              @click="handleSubmit"
            >
              <CheckCircle2 :size="16" aria-hidden="true" />
              {{ submitMutation.isPending.value ? "Enviando..." : "Concluir" }}
            </button>
          </div>
        </template>
      </div>

      <aside class="profile-calibration__signals" aria-label="Sinais do perfil">
        <div
          v-for="metric in signalMetrics"
          :key="metric.label"
          class="profile-calibration__signal"
        >
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.helper }}</small>
        </div>
      </aside>
    </section>

    <section class="risk-spectrum" aria-labelledby="risk-spectrum-title">
      <div class="investor-profile-market-pulse__section-heading">
        <Gauge :size="20" aria-hidden="true" />
        <div>
          <h2 id="risk-spectrum-title">Espectro de risco</h2>
          <p>Leitura visual do caminho entre proteção, equilíbrio e crescimento.</p>
        </div>
      </div>

      <div class="risk-spectrum__rail" aria-hidden="true">
        <span class="risk-spectrum__fill" :style="{ width: `${completionPercent}%` }" />
      </div>

      <div class="risk-spectrum__markers">
        <article
          v-for="marker in riskMarkers"
          :key="marker.label"
          class="risk-spectrum__marker"
          :class="`risk-spectrum__marker--${marker.tone}`"
        >
          <span>{{ marker.label }}</span>
          <p>{{ marker.description }}</p>
        </article>
      </div>
    </section>

    <section class="fit-guardrails" aria-labelledby="fit-guardrails-title">
      <div class="investor-profile-market-pulse__section-heading">
        <ShieldCheck :size="20" aria-hidden="true" />
        <div>
          <h2 id="fit-guardrails-title">Guarda-corpos do perfil</h2>
          <p>Limites de comunicação para manter a experiência clara e responsável.</p>
        </div>
      </div>

      <div class="fit-guardrails__grid">
        <article class="fit-guardrails__item">
          <Target :size="18" aria-hidden="true" />
          <div>
            <strong>Uso educativo</strong>
            <span>O resultado organiza preferências e não substitui uma avaliação profissional.</span>
          </div>
        </article>

        <article class="fit-guardrails__item">
          <TimerReset :size="18" aria-hidden="true" />
          <div>
            <strong>Revisão periódica</strong>
            <span>Refaça o questionário quando renda, objetivos ou horizonte mudarem.</span>
          </div>
        </article>

        <article class="fit-guardrails__item fit-guardrails__item--warning">
          <ShieldCheck :size="18" aria-hidden="true" />
          <div>
            <strong>Não é recomendação de investimento</strong>
            <span>Auraxis não recomenda ativos específicos nem promete rentabilidade.</span>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.investor-profile-market-pulse {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 28px;
  max-width: 1280px;
  margin: 0 auto;
  color: var(--color-text-primary);
}

.investor-profile-market-pulse__hero,
.profile-calibration,
.risk-spectrum,
.fit-guardrails {
  border: 1px solid var(--color-outline-soft);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.08), rgba(139, 125, 255, 0.04)),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.investor-profile-market-pulse__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 24px;
  align-items: end;
  padding: 28px;
  border-radius: var(--radius-lg);
}

.investor-profile-market-pulse__hero-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.investor-profile-market-pulse__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--color-brand-300);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.investor-profile-market-pulse__hero h1 {
  max-width: 760px;
  font-size: var(--font-size-4xl);
  line-height: 0.98;
  letter-spacing: 0;
}

.investor-profile-market-pulse__hero p,
.investor-profile-market-pulse__section-heading p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.55;
}

.investor-profile-market-pulse__hero-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.45);
}

.investor-profile-market-pulse__hero-panel div:first-child,
.profile-calibration__status > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.investor-profile-market-pulse__hero-panel span,
.profile-calibration__status span,
.profile-calibration__signal span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.investor-profile-market-pulse__hero-panel strong {
  font-family: var(--font-mono);
  color: var(--color-brand-300);
  font-size: var(--font-size-2xl);
}

.investor-profile-market-pulse__hero-panel small,
.profile-calibration__signal small {
  color: var(--color-text-subtle);
}

.investor-profile-market-pulse__hero-track,
.profile-calibration__track,
.risk-spectrum__rail {
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.08);
}

.investor-profile-market-pulse__hero-track span,
.profile-calibration__track span,
.risk-spectrum__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-brand-500), var(--color-positive));
  box-shadow: var(--shadow-brand-glow-sm);
}

.profile-calibration {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.75fr);
  gap: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.profile-calibration__wizard {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-height: 500px;
  padding: 24px;
  border-right: 1px solid var(--color-outline-soft);
}

.profile-calibration__status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.32);
}

.profile-calibration__status strong {
  font-family: var(--font-mono);
  color: var(--color-brand-300);
}

.profile-calibration__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: auto;
}

.profile-calibration__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
  transition:
    transform var(--motion-fast),
    border-color var(--motion-fast),
    background var(--motion-fast);
}

.profile-calibration__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.profile-calibration__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.profile-calibration__btn--primary {
  color: #031019;
  background: linear-gradient(135deg, var(--color-brand-400), var(--color-brand-600));
  box-shadow: var(--shadow-brand-glow-sm);
}

.profile-calibration__btn--secondary {
  color: var(--color-text-secondary);
  border-color: var(--color-outline-soft);
  background: rgba(255, 255, 255, 0.06);
}

.profile-calibration__signals {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1px;
  background: var(--color-outline-soft);
}

.profile-calibration__signal {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-height: 150px;
  padding: 22px;
  background: rgba(14, 21, 35, 0.92);
}

.profile-calibration__signal strong {
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
}

.investor-profile-market-pulse__section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--color-brand-300);
}

.investor-profile-market-pulse__section-heading h2 {
  font-size: var(--font-size-xl);
  letter-spacing: 0;
}

.risk-spectrum,
.fit-guardrails {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border-radius: var(--radius-lg);
}

.risk-spectrum__rail {
  height: 12px;
}

.risk-spectrum__markers,
.fit-guardrails__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.risk-spectrum__marker,
.fit-guardrails__item {
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-md);
  background: rgba(5, 7, 13, 0.32);
}

.risk-spectrum__marker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
}

.risk-spectrum__marker span {
  font-weight: var(--font-weight-extrabold);
}

.risk-spectrum__marker p {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.risk-spectrum__marker--calm span {
  color: var(--color-brand-300);
}

.risk-spectrum__marker--balanced span {
  color: var(--color-positive);
}

.risk-spectrum__marker--growth span {
  color: var(--color-accent);
}

.fit-guardrails__item {
  display: flex;
  gap: 12px;
  padding: 18px;
  color: var(--color-brand-300);
}

.fit-guardrails__item div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fit-guardrails__item strong {
  color: var(--color-text-primary);
}

.fit-guardrails__item span {
  color: var(--color-text-muted);
  line-height: 1.45;
}

.fit-guardrails__item--warning {
  color: var(--color-warning);
  border-color: rgba(255, 184, 97, 0.28);
  background: var(--color-warning-bg);
}

@media (max-width: 940px) {
  .investor-profile-market-pulse {
    padding: 18px;
  }

  .investor-profile-market-pulse__hero,
  .profile-calibration,
  .risk-spectrum__markers,
  .fit-guardrails__grid {
    grid-template-columns: 1fr;
  }

  .investor-profile-market-pulse__hero h1 {
    font-size: var(--font-size-4xl);
  }

  .profile-calibration__wizard {
    border-right: 0;
    border-bottom: 1px solid var(--color-outline-soft);
  }
}

@media (max-width: 640px) {
  .investor-profile-market-pulse {
    padding: 12px;
  }

  .investor-profile-market-pulse__hero,
  .profile-calibration__wizard,
  .risk-spectrum,
  .fit-guardrails {
    padding: 18px;
  }

  .profile-calibration__actions {
    flex-direction: column-reverse;
  }

  .profile-calibration__btn {
    width: 100%;
  }

  .investor-profile-market-pulse__hero h1 {
    font-size: var(--font-size-4xl);
  }
}
</style>
