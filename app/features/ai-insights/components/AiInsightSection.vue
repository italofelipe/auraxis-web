<script setup lang="ts">
import { computed } from "vue";
import { NAlert, NTag } from "naive-ui";
import {
  AlertTriangle,
  BarChart2,
  Heart,
  PiggyBank,
  TrendingUp,
} from "lucide-vue-next";

import {
  formatInsightPeriod,
  getInsightPresentation,
} from "~/features/ai-insights/model/ai-insight";
import { filterInsightItemsByDimension } from "~/features/ai-insights/composables/use-insights-by-dimension";
import type { InsightDimension, InsightItem } from "~/features/ai-insights/contracts/ai-insight";

const props = defineProps<{
  insight: InsightItem[] | null;
  periodLabel: string;
  dimension?: InsightDimension;
  isStale: boolean;
  model: string;
  tokensUsed: number;
  costUsd: number;
  forecast?: boolean;
}>();

const formattedPeriodLabel = computed(() => formatInsightPeriod(props.periodLabel));
const visibleInsights = computed(() => {
  const items = props.insight ?? [];
  return props.dimension ? filterInsightItemsByDimension(items, props.dimension) : items;
});
const costLabel = computed(() =>
  props.costUsd.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }),
);

/**
 * Resolves the card icon for a backend insight item type.
 *
 * @param type Backend insight item type.
 * @returns Lucide icon component.
 */
const iconForType = (type: string): typeof BarChart2 => {
  const map = {
    gasto_elevado: TrendingUp,
    oportunidade_economia: PiggyBank,
    saude_financeira: Heart,
    alerta_orcamento: AlertTriangle,
    padrao_gasto: BarChart2,
  } as const;

  return map[type as keyof typeof map] ?? BarChart2;
};
</script>

<template>
  <section class="ai-insight-section" aria-label="Insights de IA">
    <header class="ai-insight-section__header">
      <div>
        <span class="ai-insight-section__eyebrow">Análise inteligente</span>
        <h2>Insights de IA — {{ formattedPeriodLabel }}</h2>
      </div>
      <NTag size="small" round class="ai-insight-section__meta">
        {{ model || 'modelo IA' }} · {{ tokensUsed }} tokens · {{ costLabel }}
      </NTag>
    </header>

    <NAlert
      v-if="forecast"
      type="info"
      class="ai-insight-section__alert"
      data-testid="forecast-banner"
    >
      Modo previsão — análise de {{ formattedPeriodLabel }}, um período futuro. Baseada em
      lançamentos recorrentes e agendados; os valores podem mudar.
    </NAlert>

    <NAlert v-if="isStale" type="warning" class="ai-insight-section__alert">
      Dados de {{ formattedPeriodLabel }} — os insights podem estar desatualizados.
    </NAlert>

    <div class="ai-insight-section__grid">
      <article
        v-for="item in visibleInsights"
        :key="`${item.type}-${item.title}`"
        class="ai-insight-card"
        :class="`ai-insight-card--${getInsightPresentation(item.type).tone}`"
      >
        <component :is="iconForType(item.type)" class="ai-insight-card__icon" :size="20" />
        <div class="ai-insight-card__body">
          <span class="ai-insight-card__type">
            {{ getInsightPresentation(item.type).label }}
          </span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.message }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.ai-insight-section {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 18%, var(--color-outline-soft));
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(15, 23, 42, 0) 44%),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.ai-insight-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.ai-insight-section__eyebrow {
  color: var(--color-brand-300, #67e8f9);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ai-insight-section h2,
.ai-insight-card h3,
.ai-insight-card p {
  margin: 0;
}

.ai-insight-section h2 {
  color: var(--color-text-primary);
  font-size: var(--font-size-body-xl);
  line-height: 1.25;
}

.ai-insight-section__meta {
  flex-shrink: 0;
}

.ai-insight-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-3);
}

.ai-insight-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 92%, transparent);
}

.ai-insight-card__icon {
  margin-top: 2px;
}

.ai-insight-card--danger .ai-insight-card__icon { color: var(--color-negative); }
.ai-insight-card--success .ai-insight-card__icon { color: var(--color-positive); }
.ai-insight-card--info .ai-insight-card__icon { color: var(--color-brand-400, #38bdf8); }
.ai-insight-card--warning .ai-insight-card__icon { color: var(--color-warning, #f0a020); }
.ai-insight-card--neutral .ai-insight-card__icon { color: var(--color-text-muted); }

.ai-insight-card__body {
  display: grid;
  gap: var(--space-1);
}

.ai-insight-card__type {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.ai-insight-card h3 {
  color: var(--color-text-primary);
  font-size: var(--font-size-body-md);
  line-height: 1.3;
}

.ai-insight-card p {
  color: var(--color-text-secondary);
  line-height: 1.5;
}

@media (max-width: 720px) {
  .ai-insight-section__header {
    display: grid;
  }

  .ai-insight-section__meta {
    justify-self: start;
  }
}
</style>
