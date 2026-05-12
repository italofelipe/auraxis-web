<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NCollapse } from "naive-ui";

import AiInsightAccordionItem from "~/features/ai-insights/components/AiInsightAccordionItem.vue";
import AiInsightButton from "~/features/ai-insights/components/AiInsightButton.vue";
import { useAIInsightsHistory } from "~/features/ai-insights/queries/use-ai-insights-history";
import { mapAIInsightDto, type AIInsight } from "~/features/ai-insights/model/ai-insight";

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Insights de IA",
  pageSubtitle: "Histórico de análises geradas",
});

useHead({ title: "Insights de IA | Auraxis" });

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

/**
 * Advances pagination so Vue Query fetches the next history page.
 */
const loadMore = (): void => {
  currentPage.value += 1;
};
</script>

<template>
  <div class="insights-page">
    <section class="insights-page__hero">
      <div class="insights-page__hero-copy">
        <span class="insights-page__eyebrow">Auraxis AI</span>
        <h1>Insights financeiros com IA</h1>
        <p>
          Veja as análises já geradas, acompanhe padrões recorrentes e use o histórico
          para tomar decisões mais conscientes.
        </p>
      </div>
      <AiInsightButton />
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

    <section v-else class="insights-page__history" aria-label="Histórico de insights">
      <NCollapse accordion>
        <AiInsightAccordionItem
          v-for="item in sortedInsights"
          :key="item.id"
          :item="item"
        />
      </NCollapse>

      <NButton
        v-if="hasMore"
        secondary
        class="insights-page__load-more"
        :loading="historyQuery.isFetching.value"
        @click="loadMore"
      >
        Carregar mais
      </NButton>
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

.insights-page__history {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-lg);
  background: var(--color-bg-surface);
  box-shadow: var(--shadow-card);
}

.insights-page__load-more {
  justify-self: center;
}

@media (max-width: 720px) {
  .insights-page__hero {
    display: grid;
  }
}
</style>
