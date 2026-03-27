<script setup lang="ts">
import PortfolioSummaryBar from "~/features/portfolio/components/PortfolioSummaryBar/PortfolioSummaryBar.vue";
import PortfolioTable from "~/features/portfolio/components/PortfolioTable/PortfolioTable.vue";
import {
  MOCK_WALLET_ENTRIES,
  MOCK_PORTFOLIO_SUMMARY,
} from "~/features/portfolio/mock/portfolio.mock";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Carteira",
  pageSubtitle: "Seus ativos e posições",
});

useHead({ title: "Carteira | Auraxis" });
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

    <PortfolioSummaryBar :summary="MOCK_PORTFOLIO_SUMMARY" />

    <PortfolioTable :entries="MOCK_WALLET_ENTRIES" />
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
