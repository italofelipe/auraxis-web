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
  border: 1px solid var(--color-brand-glow-sm);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, var(--color-brand-glow-2xs), transparent 38%),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
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
  border: 1px solid var(--color-brand-glow-md);
  border-radius: var(--radius-sm);
  color: var(--color-brand-500);
  background: var(--color-brand-hover-surface);
}

.goal-ai-panel h2,
.goal-ai-panel p {
  margin: 0;
}

.goal-ai-panel h2 {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
}

.goal-ai-panel__header p {
  margin-top: 4px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.goal-ai-panel__form {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.goal-ai-panel__form label {
  color: var(--color-text-secondary);
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
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-elevated);
  line-height: 1.5;
  outline: none;
}

.goal-ai-panel textarea:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-glow-sm);
}

.goal-ai-panel__form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.goal-ai-panel__form-footer span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.goal-ai-panel__form-footer .is-danger {
  color: var(--color-negative);
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
  color: var(--color-text-on-brand);
  background: var(--gradient-brand);
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
  background: linear-gradient(90deg, var(--color-skeleton-start), var(--color-skeleton-mid), var(--color-skeleton-end));
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
  border: 1px solid var(--color-negative-border);
  border-radius: var(--radius-sm);
  color: var(--color-negative);
  background: var(--color-negative-bg);
}

.goal-ai-result {
  display: grid;
  gap: 16px;
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.goal-ai-result__topline,
.goal-ai-result__metrics {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.goal-ai-result__topline span {
  color: var(--color-positive);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-extrabold);
  text-transform: uppercase;
}

.goal-ai-result__topline strong {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.goal-ai-result__narrative {
  color: var(--color-text-secondary);
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
  background: var(--color-bg-subtle);
}

.goal-ai-result__metrics dt {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
}

.goal-ai-result__metrics dd {
  margin: 6px 0 0;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-extrabold);
}

.goal-ai-result__note {
  width: fit-content;
  padding: 0 16px;
  color: var(--color-text-secondary);
  background: var(--color-bg-subtle);
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
