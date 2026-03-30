<script setup lang="ts">
import { NButton } from "naive-ui";
import { usePortfolioSummaryQuery } from "~/features/wallet/queries/use-portfolio-summary-query";
import { useWalletEntriesQuery } from "~/features/wallet/queries/use-wallet-entries-query";
import { useCreateWalletEntryMutation } from "~/features/wallet/queries/use-create-wallet-entry-mutation";
import { useDeleteWalletEntryMutation } from "~/features/wallet/queries/use-delete-wallet-entry-mutation";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Carteira",
  pageSubtitle: "Seus ativos e posições",
});

useHead({ title: "Carteira | Auraxis" });

const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError } = usePortfolioSummaryQuery();
const { data: entries, isLoading: isEntriesLoading, isError: isEntriesError } = useWalletEntriesQuery();

const createMutation = useCreateWalletEntryMutation();
const deleteMutation = useDeleteWalletEntryMutation();

const isLoading = computed(() => isSummaryLoading.value || isEntriesLoading.value);
const isError = computed(() => isSummaryError.value || isEntriesError.value);

const showEntryForm = ref(false);

/**
 * Handles the submit event from WalletEntryForm.
 *
 * @param payload - Typed payload emitted by the form component.
 */
const onCreateEntry = (payload: CreateWalletEntryPayload): void => {
  createMutation.mutate(payload);
};

/**
 * Triggers deletion of a wallet entry by its identifier.
 *
 * @param id - The unique identifier of the entry to delete.
 */
const onDeleteEntry = (id: string): void => {
  deleteMutation.mutate(id);
};
</script>

<template>
  <div class="portfolio-page">
    <div class="portfolio-page__header">
      <div class="portfolio-page__title-block">
        <span class="portfolio-page__title">{{ $t('pages.portfolio.title') }}</span>
        <span class="portfolio-page__subtitle">
          {{ $t('pages.portfolio.subtitle') }}
        </span>
      </div>
      <NButton type="primary" size="small" @click="showEntryForm = true">
        {{ $t('pages.portfolio.addAsset') }}
      </NButton>
    </div>

    <WalletEntryForm
      :visible="showEntryForm"
      @update:visible="showEntryForm = $event"
      @submit="onCreateEntry"
    />

    <UiInlineError
      v-if="isError"
      :title="$t('pages.portfolio.loadError')"
      :message="$t('pages.portfolio.loadErrorMessage')"
    />

    <template v-else>
      <UiPageLoader v-if="isLoading" :rows="4" :with-title="true" />

      <template v-else>
        <PortfolioSummaryBar :summary="summary ?? null" />
        <WalletPositionsPanel :entries="entries ?? []" :is-loading="isLoading" />
        <WalletAllocationSection :entries="entries ?? []" :is-loading="isLoading" />
        <PortfolioTable :entries="entries ?? []" @delete="onDeleteEntry" />
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

.portfolio-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-2);
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
