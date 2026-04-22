<script setup lang="ts">
import { computed } from "vue";
import UiSurfaceCard from "~/components/ui/UiSurfaceCard/UiSurfaceCard.vue";
import UiEmptyState from "~/components/ui/UiEmptyState/UiEmptyState.vue";
import { formatCurrency } from "~/utils/currency";
import type { SurvivalIndexCardProps, SurvivalTier } from "./SurvivalIndexCard.types";

const props = withDefaults(defineProps<SurvivalIndexCardProps>(), {
  loading: false,
});

const tier = computed<SurvivalTier | null>(() => {
  const months = props.data?.months;
  if (months === null || months === undefined || !Number.isFinite(months)) { return null; }
  if (months < 3) { return "critical"; }
  if (months < 6) { return "low"; }
  if (months < 12) { return "ok"; }
  return "comfortable";
});

const tierLabel = computed<string>(() => {
  switch (tier.value) {
    case "critical": return "Reserva crítica";
    case "low":      return "Reserva baixa";
    case "ok":       return "Reserva confortável";
    case "comfortable": return "Reserva ótima";
    default: return "—";
  }
});

const formattedMonths = computed<string>(() => {
  const months = props.data?.months;
  if (months === null || months === undefined || !Number.isFinite(months)) { return "—"; }
  if (months >= 24) { return "24+"; }
  return months.toFixed(1);
});

const hasData = computed(() => {
  return props.data !== null && props.data.months !== null && Number.isFinite(props.data.months);
});

const tooltip = computed<string>(() => {
  if (!props.data || !hasData.value) { return ""; }
  const assets = formatCurrency(props.data.totalAssets);
  const expense = formatCurrency(props.data.avgMonthlyExpense);
  return `Baseado em ${assets} de patrimônio e ${expense}/mês de despesas médias.`;
});
</script>

<template>
  <UiSurfaceCard class="survival-index-card" :class="tier ? `survival-index-card--${tier}` : null">
    <div v-if="loading" class="survival-index-card__skeleton" aria-busy="true" />
    <template v-else-if="hasData">
      <header class="survival-index-card__header">
        <span class="survival-index-card__label">Índice de sobrevivência</span>
        <span class="survival-index-card__badge" :class="`survival-index-card__badge--${tier}`">{{ tierLabel }}</span>
      </header>
      <p class="survival-index-card__value">
        <strong>{{ formattedMonths }}</strong>
        <span class="survival-index-card__unit">meses de despesas cobertos</span>
      </p>
      <p v-if="tooltip" class="survival-index-card__tooltip">{{ tooltip }}</p>
    </template>
    <UiEmptyState
      v-else
      title="Índice indisponível"
      description="Registre transações e investimentos para calcular seu índice de sobrevivência."
      compact
    />
  </UiSurfaceCard>
</template>

<style scoped>
.survival-index-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-height: 120px;
}
.survival-index-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}
.survival-index-card__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.survival-index-card__badge {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}
.survival-index-card__badge--critical { background: color-mix(in srgb, var(--color-danger) 18%, transparent); color: var(--color-danger); }
.survival-index-card__badge--low      { background: color-mix(in srgb, var(--color-warning) 18%, transparent); color: var(--color-warning); }
.survival-index-card__badge--ok       { background: color-mix(in srgb, var(--color-positive) 18%, transparent); color: var(--color-positive); }
.survival-index-card__badge--comfortable { background: color-mix(in srgb, var(--color-brand) 18%, transparent); color: var(--color-brand); }

.survival-index-card__value {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin: 0;
}
.survival-index-card__value strong {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
}
.survival-index-card__unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
.survival-index-card__tooltip {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  margin: 0;
}
.survival-index-card__skeleton {
  height: 72px;
  border-radius: var(--radius-md);
  background: linear-gradient(90deg, var(--color-surface-raised) 0%, var(--color-surface) 50%, var(--color-surface-raised) 100%);
  background-size: 200% 100%;
  animation: survival-index-card-skeleton 1.2s infinite;
}
@keyframes survival-index-card-skeleton {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
