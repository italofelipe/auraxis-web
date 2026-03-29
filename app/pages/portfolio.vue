<script setup lang="ts">
import { usePortfolioSummaryQuery } from "~/features/wallet/queries/use-portfolio-summary-query";
import { useWalletEntriesQuery } from "~/features/wallet/queries/use-wallet-entries-query";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Carteira",
  pageSubtitle: "Seus ativos e posições",
});

useHead({ title: "Carteira | Auraxis" });

const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = usePortfolioSummaryQuery();
const { data: entries, isLoading: isEntriesLoading, isError: isEntriesError } = useWalletEntriesQuery();

const isLoading = computed(() => isSummaryLoading.value || isEntriesLoading.value);
const isError = computed(() => isSummaryError.value || isEntriesError.value);
</script>

<template>
  <div class="portfolio-page">
    <div class="portfolio-page__header">
      <div class="portfolio-page__title-block">
        <span class="portfolio-page__title">Carteira</span>
        <span class="portfolio-page__subtitle">
          Visão geral dos seus investimentos
        </span>
      </div>
    </div>

    <UiInlineError
      v-if="isError"
      title="Não foi possível carregar a carteira"
      message="Tente recarregar a página."
    />

    <template v-else>
      <UiPageLoader v-if="isLoading" :rows="4" :with-title="true" />

      <template v-else>
        <PortfolioSummaryBar :summary="summary ?? null" />
        <PortfolioTable :entries="entries ?? []" />
      </template>
    </template>
  </div>
</template>

<style scoped>
.portfolio-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.portfolio-page__title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.portfolio-page__title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.portfolio-page__subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
