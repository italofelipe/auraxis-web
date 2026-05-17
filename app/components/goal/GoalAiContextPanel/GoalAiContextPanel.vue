<script setup lang="ts">
import { AlertCircle, Bot, Loader2, Save, Sparkles } from "lucide-vue-next";

import UiUpgradePrompt from "~/components/paywall/UiUpgradePrompt.vue";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import type {
  GoalAIProjectionResponseDto,
  GoalDto,
} from "~/features/goals/contracts/goal.dto";
import { useGoalAIProjectionMutation } from "~/features/goals/queries/use-goal-ai-projection-mutation";
import { buildGoalAIProjectionContext } from "~/features/goals/model/goal-ai-projection";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";

const MAX_CONTEXT_LENGTH = 500;

const props = defineProps<{
  readonly goal: GoalDto;
  readonly monthlyContribution: number;
  readonly recentTransactions?: readonly TransactionDto[];
}>();

const emit = defineEmits<{
  (event: "save-note", value: GoalAIProjectionResponseDto): void;
}>();

const context = ref("");
const entitlementQuery = useEntitlementQuery("advanced_simulations");
const projectionMutation = useGoalAIProjectionMutation();

const hasPremiumAccess = computed(() => entitlementQuery.data.value === true);
const isCheckingAccess = computed(() => entitlementQuery.isLoading.value === true);
const isContextTooLong = computed(() => context.value.length > MAX_CONTEXT_LENGTH);
const canSubmit = computed(
  () =>
    hasPremiumAccess.value &&
    !projectionMutation.isPending.value &&
    !isContextTooLong.value,
);

const projection = computed(() => projectionMutation.data.value?.projection ?? null);
const generatedProjection = computed(() => projectionMutation.data.value ?? null);

const monthsToCompletionLabel = computed(() => {
  const months = projection.value?.months_to_completion;

  if (typeof months !== "number") {
    return "Sem estimativa";
  }

  return `${months} meses`;
});

const projectedDateLabel = computed(() => {
  const date = projection.value?.projected_completion_date;

  if (!date) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
});

const suggestedContributionLabel = computed(() => {
  const suggestion = projection.value?.suggested_monthly_contribution;

  if (!suggestion) {
    return "Aporte atual suficiente";
  }

  return formatCurrency(Number(suggestion));
});

/**
 * Sends the current goal context to the AI projection mutation.
 */
const generateProjection = (): void => {
  if (!canSubmit.value) {
    return;
  }

  projectionMutation.mutate({
    goalId: props.goal.id,
    payload: {
      monthly_contribution: props.monthlyContribution,
      user_context: buildGoalAIProjectionContext({
        userContext: context.value,
        recentTransactions: props.recentTransactions ?? [],
      }),
    },
  });
};

/**
 * Emits the generated projection so the page can persist or display it as a note.
 */
const saveGeneratedProjection = (): void => {
  if (generatedProjection.value) {
    emit("save-note", generatedProjection.value);
  }
};
</script>

<template>
  <section class="goal-ai-panel" aria-labelledby="goal-ai-panel-title">
    <div class="goal-ai-panel__header">
      <span class="goal-ai-panel__icon" aria-hidden="true">
        <Bot :size="20" />
      </span>
      <div>
        <h2 id="goal-ai-panel-title">Projecao de meta com IA</h2>
        <p>Use contexto livre e movimentacoes recentes para ajustar o plano desta meta.</p>
      </div>
    </div>

    <div v-if="isCheckingAccess" class="goal-ai-panel__loading" aria-live="polite">
      <span />
      <span />
      <span />
    </div>

    <UiUpgradePrompt
      v-else-if="!hasPremiumAccess"
      feature-name="Projecao de meta com IA"
      description="Usuarios free recebem apenas os insights automaticos mensais. Assine o Premium para gerar novas projecoes quando quiser."
      cta-label="Assinar Premium"
      to="/plans"
    />

    <template v-else>
      <form class="goal-ai-panel__form" @submit.prevent="generateProjection">
        <label for="goal-ai-context">Contexto para a IA</label>
        <textarea
          id="goal-ai-context"
          v-model="context"
          rows="3"
          maxlength="500"
          placeholder="Ex.: recebi bonus este mes, mas quero preservar liquidez para emergencias."
        />
        <div class="goal-ai-panel__form-footer">
          <span :class="{ 'is-danger': isContextTooLong }">
            {{ context.length }}/{{ MAX_CONTEXT_LENGTH }}
          </span>
          <button class="goal-ai-panel__submit" type="submit" :disabled="!canSubmit">
            <Loader2 v-if="projectionMutation.isPending.value" :size="16" aria-hidden="true" />
            <Sparkles v-else :size="16" aria-hidden="true" />
            Gerar nova projecao
          </button>
        </div>
      </form>

      <div v-if="projectionMutation.isPending.value" class="goal-ai-panel__skeleton" aria-live="polite">
        <span />
        <span />
        <span />
      </div>

      <div v-else-if="projectionMutation.isError.value" class="goal-ai-panel__error" role="alert">
        <AlertCircle :size="18" aria-hidden="true" />
        <span>Nao foi possivel gerar a projecao agora. Tente novamente em instantes.</span>
      </div>

      <article v-if="generatedProjection" class="goal-ai-result">
        <div class="goal-ai-result__topline">
          <span>Analise gerada</span>
          <strong>{{ generatedProjection.model }}</strong>
        </div>

        <p class="goal-ai-result__narrative">
          {{ generatedProjection.narrative }}
        </p>

        <dl class="goal-ai-result__metrics">
          <div>
            <dt>Conclusao estimada</dt>
            <dd>{{ monthsToCompletionLabel }}</dd>
          </div>
          <div>
            <dt>Nova data</dt>
            <dd>{{ projectedDateLabel }}</dd>
          </div>
          <div>
            <dt>Aporte sugerido</dt>
            <dd>{{ suggestedContributionLabel }}</dd>
          </div>
        </dl>

        <button
          class="goal-ai-result__note"
          type="button"
          data-testid="save-goal-ai-note"
          @click="saveGeneratedProjection"
        >
          <Save :size="15" aria-hidden="true" />
          Salvar como nota da meta
        </button>
      </article>
    </template>
  </section>
</template>

<style scoped>
.goal-ai-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 24px;
  border: 1px solid rgba(68, 212, 255, 0.18);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(68, 212, 255, 0.08), transparent 38%),
    #111827;
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.26);
}

.goal-ai-panel__header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.goal-ai-panel__icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border: 1px solid rgba(68, 212, 255, 0.26);
  border-radius: var(--radius-sm);
  color: #44d4ff;
  background: rgba(68, 212, 255, 0.1);
}

.goal-ai-panel h2,
.goal-ai-panel p {
  margin: 0;
}

.goal-ai-panel h2 {
  color: #f7fbff;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
}

.goal-ai-panel__header p {
  margin-top: 4px;
  color: #8da2bf;
  line-height: 1.5;
}

.goal-ai-panel__form {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.goal-ai-panel__form label {
  color: #dce8f8;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.goal-ai-panel textarea {
  width: 100%;
  min-width: 0;
  min-height: 92px;
  padding: 14px 16px;
  resize: vertical;
  border: 1px solid rgba(141, 162, 191, 0.26);
  border-radius: var(--radius-sm);
  color: #f7fbff;
  background: rgba(8, 13, 24, 0.72);
  line-height: 1.5;
  outline: none;
}

.goal-ai-panel textarea:focus {
  border-color: rgba(68, 212, 255, 0.68);
  box-shadow: 0 0 0 3px rgba(68, 212, 255, 0.12);
}

.goal-ai-panel__form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.goal-ai-panel__form-footer span {
  color: #8da2bf;
  font-size: var(--font-size-sm);
}

.goal-ai-panel__form-footer .is-danger {
  color: #ff7a8a;
}

.goal-ai-panel__submit,
.goal-ai-result__note {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-extrabold);
  cursor: pointer;
}

.goal-ai-panel__submit {
  padding: 0 18px;
  color: #06111f;
  background: linear-gradient(135deg, #44d4ff, #42e8a9);
}

.goal-ai-panel__submit:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.goal-ai-panel__loading,
.goal-ai-panel__skeleton {
  display: grid;
  gap: 10px;
}

.goal-ai-panel__loading span,
.goal-ai-panel__skeleton span {
  height: 16px;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, rgba(141, 162, 191, 0.12), rgba(141, 162, 191, 0.25), rgba(141, 162, 191, 0.12));
}

.goal-ai-panel__loading span:nth-child(2),
.goal-ai-panel__skeleton span:nth-child(2) {
  width: 82%;
}

.goal-ai-panel__loading span:nth-child(3),
.goal-ai-panel__skeleton span:nth-child(3) {
  width: 58%;
}

.goal-ai-panel__error {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 122, 138, 0.28);
  border-radius: var(--radius-sm);
  color: #ffd1d7;
  background: rgba(255, 122, 138, 0.08);
}

.goal-ai-result {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border: 1px solid rgba(141, 162, 191, 0.18);
  border-radius: var(--radius-md);
  background: rgba(8, 13, 24, 0.54);
}

.goal-ai-result__topline,
.goal-ai-result__metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.goal-ai-result__topline span {
  color: #42e8a9;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.goal-ai-result__topline strong {
  color: #8da2bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.goal-ai-result__narrative {
  color: #dce8f8;
  line-height: 1.62;
}

.goal-ai-result__metrics {
  margin: 0;
  min-width: 0;
}

.goal-ai-result__metrics div {
  flex: 1;
  min-width: 0;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: rgba(141, 162, 191, 0.08);
}

.goal-ai-result__metrics dt {
  color: #8da2bf;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.goal-ai-result__metrics dd {
  margin: 6px 0 0;
  color: #f7fbff;
  font-weight: var(--font-weight-extrabold);
}

.goal-ai-result__note {
  width: fit-content;
  padding: 0 16px;
  color: #dce8f8;
  background: rgba(141, 162, 191, 0.12);
}

@media (max-width: 700px) {
  .goal-ai-panel {
    padding: 20px;
    border-radius: var(--radius-md);
  }

  .goal-ai-panel__form-footer,
  .goal-ai-result__metrics {
    align-items: stretch;
    flex-direction: column;
  }

  .goal-ai-panel__submit,
  .goal-ai-result__note {
    width: 100%;
  }
}
</style>
