<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NTag } from "naive-ui";

import AiInsightButton from "~/features/ai-insights/components/AiInsightButton.vue";
import InsightsFluida from "~/features/ai-insights/fluida/components/InsightsFluida.vue";
import { useFeatureFlag } from "~/shared/feature-flags/use-feature-flag";
import {
  getInsightDimensionLabel,
  groupInsightItemsByDimension,
  type InsightDimensionGroup,
} from "~/features/ai-insights/composables/use-insights-by-dimension";
import type { InsightDimension } from "~/features/ai-insights/contracts/ai-insight";
import { useAIInsightsHistory } from "~/features/ai-insights/queries/use-ai-insights-history";
import {
  formatInsightCreatedAt,
  formatInsightPeriod,
  getInsightTypeLabel,
  mapAIInsightDto,
  type AIInsight,
} from "~/features/ai-insights/model/ai-insight";

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Insights de IA",
  pageSubtitle: "Histórico de análises geradas",
});

useHead({ title: "Insights de IA | Auraxis" });

// Editorial "Fluida" reading, gated behind web.insights.fluida (default OFF).
// When the flag is off the legacy report below renders unchanged.
const isFluidaEnabled = useFeatureFlag("web.insights.fluida");

const route = useRoute();
const currentPage = ref(1);
const perPage = 10;
const loadedInsights = ref<AIInsight[]>([]);

const historyQuery = useAIInsightsHistory(currentPage, perPage);

watch(
  () => historyQuery.data.value,
  (history) => {
    if (!history) {
      return;
    }

    const mapped = history.items.map(mapAIInsightDto);
    if (history.page === 1) {
      loadedInsights.value = mapped;
      return;
    }

    const knownIds = new Set(loadedInsights.value.map((item) => item.id));
    loadedInsights.value = [
      ...loadedInsights.value,
      ...mapped.filter((item) => !knownIds.has(item.id)),
    ];
  },
  { immediate: true },
);

const sortedInsights = computed(() =>
  [...loadedInsights.value].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ),
);

const total = computed(() => historyQuery.data.value?.total ?? sortedInsights.value.length);
const hasMore = computed(() => sortedInsights.value.length < total.value);
const requestedOpenInsightId = computed(() => {
  const open = route.query.open;
  return Array.isArray(open) ? open[0] : open;
});
const showFluidaReading = computed(() =>
  isFluidaEnabled.value && !requestedOpenInsightId.value,
);
const selectedInsightId = ref<string | null>(null);
const selectedInsight = computed<AIInsight | null>(() =>
  sortedInsights.value.find((item) => item.id === selectedInsightId.value) ?? null,
);
const selectedInsightGroups = computed<InsightDimensionGroup[]>(() =>
  selectedInsight.value ? groupInsightItemsByDimension(selectedInsight.value.items) : [],
);
const selectedInsightGroupIndex = computed(() => {
  const groups = new Map<InsightDimension, number>();
  selectedInsightGroups.value.forEach((group) => {
    groups.set(group.dimension, group.items.length);
  });
  return groups;
});
const dimensionNavItems = computed(() =>
  (["general", "transactions", "goals", "budgets", "credit_cards", "wallet"] as InsightDimension[])
    .map((dimension) => ({
      dimension,
      label: getInsightDimensionLabel(dimension),
      count: selectedInsightGroupIndex.value.get(dimension) ?? 0,
    })),
);
const reportStats = computed(() => {
  const insight = selectedInsight.value;
  if (!insight) {
    return [];
  }

  return [
    { label: "Período", value: formatInsightPeriod(insight.periodLabel) },
    { label: "Domínios", value: String(selectedInsightGroups.value.length) },
    { label: "Itens", value: String(insight.items.length) },
  ];
});

/**
 * Advances pagination so Vue Query fetches the next history page.
 */
const loadMore = (): void => {
  currentPage.value += 1;
};

/**
 * Selects the insight rendered as the global financial report.
 *
 * @param id Insight id.
 */
const selectInsight = (id: string): void => {
  selectedInsightId.value = id;
};

watch(
  [sortedInsights, requestedOpenInsightId],
  ([insights, insightId]) => {
    if (!insightId) {
      return;
    }

    if (insights.some((item) => item.id === insightId)) {
      selectedInsightId.value = insightId;
    }
  },
  { immediate: true },
);

watch(
  sortedInsights,
  (insights) => {
    if (selectedInsightId.value && insights.some((item) => item.id === selectedInsightId.value)) {
      return;
    }

    selectedInsightId.value = requestedOpenInsightId.value ?? insights[0]?.id ?? null;
  },
  { immediate: true },
);

watch(
  () =>
    Boolean(
      requestedOpenInsightId.value &&
      hasMore.value &&
      !historyQuery.isFetching.value &&
      !sortedInsights.value.some((item) => item.id === requestedOpenInsightId.value),
    ),
  (shouldLoadMore) => {
    if (shouldLoadMore) {
      loadMore();
    }
  },
  { immediate: true },
);
</script>

<template>
  <InsightsFluida v-if="showFluidaReading" />

  <div v-else class="insights-page">
    <section class="insights-page__hero">
      <div class="insights-page__hero-copy">
        <span class="insights-page__eyebrow">Auraxis AI</span>
        <h1>Insights financeiros com IA</h1>
        <p>
          Veja as análises já geradas, acompanhe padrões recorrentes e use o histórico
          para tomar decisões mais conscientes.
        </p>
      </div>
      <AiInsightButton source-surface="insights" />
    </section>

    <UiSurfaceCard v-if="historyQuery.isError.value" class="insights-page__state">
      <UiInlineError
        title="Não foi possível carregar os insights"
        message="Tente novamente em alguns instantes."
      />
    </UiSurfaceCard>

    <UiPageLoader v-else-if="historyQuery.isLoading.value && sortedInsights.length === 0" :rows="4" />

    <UiEmptyState
      v-else-if="sortedInsights.length === 0"
      icon="chartLine"
      title="Nenhum insight gerado ainda"
      description="Clique em 'Gerar insight com IA' no dashboard para criar sua primeira análise."
      compact
    >
      <template #illustration>
        <IllustrationFinanceGrowth />
      </template>
    </UiEmptyState>

    <section v-else class="insights-page__report" aria-label="Relatório global de insights">
      <aside class="insights-page__timeline" aria-label="Histórico de insights gerados">
        <div class="insights-page__timeline-header">
          <span>Histórico</span>
          <small>{{ total }} análise{{ total === 1 ? "" : "s" }}</small>
        </div>

        <button
          v-for="item in sortedInsights"
          :key="item.id"
          type="button"
          class="insights-page__timeline-item"
          :class="{ 'insights-page__timeline-item--active': item.id === selectedInsightId }"
          @click="selectInsight(item.id)"
        >
          <span>{{ formatInsightPeriod(item.periodLabel) }}</span>
          <small>{{ formatInsightCreatedAt(item.createdAt) }}</small>
          <NTag size="small" round>{{ getInsightTypeLabel(item.insightType) }}</NTag>
        </button>

        <NButton
          v-if="hasMore"
          secondary
          size="small"
          class="insights-page__load-more"
          :loading="historyQuery.isFetching.value"
          @click="loadMore"
        >
          Carregar mais
        </NButton>
      </aside>

      <article v-if="selectedInsight" class="insights-page__detail">
        <header class="insights-page__detail-header">
          <div>
            <span class="insights-page__eyebrow">Relatório global</span>
            <h2>Insight de {{ formatInsightPeriod(selectedInsight.periodLabel) }}</h2>
            <p>
              Gerado em {{ formatInsightCreatedAt(selectedInsight.createdAt) }} com
              {{ selectedInsight.model }}. O relatório consolida os domínios retornados pelo backend
              e mantém as evidências visíveis para auditoria.
            </p>
          </div>
          <div class="insights-page__stats" aria-label="Resumo do relatório">
            <span v-for="stat in reportStats" :key="stat.label">
              <small>{{ stat.label }}</small>
              <strong>{{ stat.value }}</strong>
            </span>
          </div>
        </header>

        <section v-if="selectedInsight.summary" class="insights-page__summary">
          <span>Resumo executivo</span>
          <p>{{ selectedInsight.summary }}</p>
        </section>

        <nav class="insights-page__domain-nav" aria-label="Domínios do insight">
          <a
            v-for="item in dimensionNavItems"
            :key="item.dimension"
            :href="`#insight-${item.dimension}`"
            :class="{ 'insights-page__domain-nav-link--muted': item.count === 0 }"
          >
            {{ item.label }}
            <small>{{ item.count }}</small>
          </a>
        </nav>

        <section class="insights-page__domains">
          <article
            v-for="group in selectedInsightGroups"
            :id="`insight-${group.dimension}`"
            :key="group.dimension"
            class="insights-page__domain-card"
          >
            <header>
              <span>{{ group.label }}</span>
              <small>{{ group.items.length }} item{{ group.items.length === 1 ? "" : "s" }}</small>
            </header>

            <div class="insights-page__domain-items">
              <div
                v-for="insight in group.items"
                :key="`${group.dimension}-${insight.title}-${insight.message}`"
                class="insights-page__domain-item"
              >
                <h3>{{ insight.title }}</h3>
                <p>{{ insight.message }}</p>
                <div
                  v-if="insight.evidence?.length"
                  class="insights-page__evidence"
                  aria-label="Evidências usadas no insight"
                >
                  <span v-for="evidence in insight.evidence" :key="evidence">
                    {{ evidence }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </section>
      </article>

      <UiEmptyState
        v-else
        icon="analytics"
        title="Selecione um insight"
        description="Escolha um item do histórico para abrir o relatório global."
        compact
      />
    </section>
  </div>
</template>

<style scoped>
.insights-page {
  display: grid;
  gap: var(--space-4);
}

.insights-page__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 20%, var(--color-outline-soft));
  border-radius: var(--radius-lg);
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.14), rgba(15, 23, 42, 0) 46%),
    var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.insights-page__hero-copy {
  display: grid;
  gap: var(--space-2);
  max-width: 680px;
}

.insights-page__eyebrow {
  color: var(--color-brand-300, #67e8f9);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.insights-page h1,
.insights-page p {
  margin: 0;
}

.insights-page h1 {
  color: var(--color-text-primary);
  font-size: var(--font-size-display-sm, 28px);
  line-height: 1.15;
}

.insights-page p {
  color: var(--color-text-secondary);
  line-height: 1.55;
}

.insights-page__report {
  display: grid;
  grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
  gap: var(--space-4);
}

.insights-page__timeline {
  display: grid;
  align-content: start;
  gap: var(--space-2);
  min-width: 0;
  border-right: 1px solid var(--color-outline-soft);
  padding-right: var(--space-3);
}

.insights-page__timeline-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.insights-page__timeline-header span {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-bold);
}

.insights-page__timeline-item {
  display: grid;
  gap: 3px;
  min-width: 0;
  width: 100%;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 82%, transparent);
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--space-2);
  text-align: left;
  transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
}

.insights-page__timeline-item:hover,
.insights-page__timeline-item--active {
  border-color: var(--color-brand-500);
  background: var(--color-brand-hover-surface);
}

.insights-page__timeline-item:hover {
  transform: translateY(-1px);
}

.insights-page__timeline-item > span {
  font-weight: var(--font-weight-semibold);
}

.insights-page__timeline-item > small {
  color: var(--color-text-muted);
}

.insights-page__detail {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.insights-page__detail-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-4);
  align-items: start;
}

.insights-page__detail-header h2 {
  margin: var(--space-1) 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-2xl);
}

.insights-page__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(72px, 1fr));
  gap: var(--space-2);
}

.insights-page__stats span {
  display: grid;
  gap: 2px;
  min-width: 0;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
  padding: var(--space-2);
}

.insights-page__stats small,
.insights-page__summary span,
.insights-page__domain-card header small {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.insights-page__stats strong {
  color: var(--color-text-primary);
}

.insights-page__summary {
  display: grid;
  gap: var(--space-2);
  border-left: 3px solid var(--color-brand-500);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-brand-500) 8%, transparent);
  padding: var(--space-3);
}

.insights-page__domain-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.insights-page__domain-nav a {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-full);
  color: var(--color-text-primary);
  padding: 7px 10px;
  text-decoration: none;
}

.insights-page__domain-nav small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  background: var(--color-brand-hover-surface);
  color: var(--color-brand-500);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.insights-page__domain-nav-link--muted {
  opacity: 0.54;
}

.insights-page__domains {
  display: grid;
  gap: var(--space-3);
}

.insights-page__domain-card {
  display: grid;
  gap: var(--space-3);
  min-width: 0;
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-bg-elevated) 74%, transparent);
  padding: var(--space-3);
}

.insights-page__domain-card header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.insights-page__domain-card header span {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.insights-page__domain-items {
  display: grid;
  gap: var(--space-2);
}

.insights-page__domain-item {
  display: grid;
  gap: var(--space-1);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  padding: var(--space-3);
}

.insights-page__domain-item h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
}

.insights-page__evidence {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--space-1);
}

.insights-page__evidence span {
  border-radius: var(--radius-full);
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  padding: 4px 8px;
}

@media (max-width: 720px) {
  .insights-page__hero {
    display: grid;
  }

  .insights-page__report {
    grid-template-columns: 1fr;
  }

  .insights-page__timeline {
    border-right: 0;
    border-bottom: 1px solid var(--color-outline-soft);
    padding-right: 0;
    padding-bottom: var(--space-3);
  }

  .insights-page__detail-header {
    grid-template-columns: 1fr;
  }

  .insights-page__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 460px) {
  .insights-page__stats {
    grid-template-columns: 1fr;
  }
}
</style>
