<script setup lang="ts">
import { NButton } from "naive-ui";
import { usePortfolioSummaryQuery } from "~/features/wallet/queries/use-portfolio-summary-query";
import { useWalletEntriesQuery } from "~/features/wallet/queries/use-wallet-entries-query";
import { useCreateWalletEntryMutation } from "~/features/wallet/queries/use-create-wallet-entry-mutation";
import { useDeleteWalletEntryMutation } from "~/features/wallet/queries/use-delete-wallet-entry-mutation";
import type { CreateWalletEntryPayload } from "~/features/wallet/services/wallet.client";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

definePageMeta({
  middleware: ["authenticated", "coming-soon"],
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

/** Entry being edited — null when creating a new entry. */
const editingEntry = ref<WalletEntryDto | null>(null);

/**
 * Handles the submit event from WalletEntryForm (create mode).
 *
 * @param payload - Typed payload emitted by the form component.
 */
const onCreateEntry = (payload: CreateWalletEntryPayload): void => {
  createMutation.mutate(payload);
};

/**
 * Handles the edit event from WalletEntryForm.
 * Deletes the old entry then creates a new one with the updated payload.
 *
 * @param id - The id of the entry being replaced.
 * @param payload - The new payload with updated data.
 */
const onEditEntry = (id: string, payload: CreateWalletEntryPayload): void => {
  deleteMutation.mutate(id, {
    onSuccess: () => {
      createMutation.mutate(payload);
    },
  });
  editingEntry.value = null;
};

/**
 * Triggers deletion of a wallet entry by its identifier.
 *
 * @param id - The unique identifier of the entry to delete.
 */
const onDeleteEntry = (id: string): void => {
  deleteMutation.mutate(id);
};

/**
 * Opens the form in edit mode pre-filled with the given entry.
 *
 * @param entry - The wallet entry to edit.
 */
const onEditRequest = (entry: WalletEntryDto): void => {
  editingEntry.value = entry;
  showEntryForm.value = true;
};

/**
 * Syncs the form modal visibility and resets edit state when it closes.
 *
 * @param visible - New visibility value emitted by WalletEntryForm.
 */
const onFormVisibilityChange = (visible: boolean): void => {
  showEntryForm.value = visible;
  if (!visible) {
    editingEntry.value = null;
  }
};

const hasEntries = computed(() => (entries.value?.length ?? 0) > 0);
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
      :initial-entry="editingEntry"
      @update:visible="onFormVisibilityChange"
      @submit="onCreateEntry"
      @edit="onEditEntry"
    />

    <UiInlineError
      v-if="isError"
      :title="$t('pages.portfolio.loadError')"
      :message="$t('pages.portfolio.loadErrorMessage')"
    />

    <template v-else>
      <UiPageLoader v-if="isLoading" :rows="4" :with-title="true" />

      <template v-else-if="!hasEntries">
        <div class="portfolio-page__empty-state">
          <span class="portfolio-page__empty-title">{{ $t('pages.portfolio.emptyTitle') }}</span>
          <span class="portfolio-page__empty-body">{{ $t('pages.portfolio.emptyBody') }}</span>
          <NButton type="primary" @click="showEntryForm = true">
            {{ $t('pages.portfolio.emptyAction') }}
          </NButton>
        </div>
      </template>

      <template v-else>
        <PortfolioSummaryBar :summary="summary ?? null" />
        <WalletPositionsPanel :entries="entries ?? []" :is-loading="isLoading" />
        <WalletAllocationSection :entries="entries ?? []" :is-loading="isLoading" />
        <PortfolioTable
          :entries="entries ?? []"
          @delete="onDeleteEntry"
          @edit="onEditRequest"
        />
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

.portfolio-page__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8, 4rem) var(--space-4);
  text-align: center;
}

.portfolio-page__empty-title {
  font-size: var(--font-size-lg, 1.25rem);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.portfolio-page__empty-body {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: 360px;
}
</style>
