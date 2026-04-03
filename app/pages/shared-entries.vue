<script setup lang="ts">
import {
  NCard,
  NStatistic,
  NEmpty,
  NTabs,
  NTabPane,
  NPageHeader,
} from "naive-ui";
import { useSharedByMeQuery } from "~/features/shared-entries/queries/use-shared-by-me-query";
import { useSharedWithMeQuery } from "~/features/shared-entries/queries/use-shared-with-me-query";
import { useRevokeSharedEntryMutation } from "~/features/shared-entries/queries/use-revoke-shared-entry-mutation";

definePageMeta({
  layout: "default",
  middleware: ["authenticated", "coming-soon"],
  pageTitle: "Entradas Compartilhadas",
  pageSubtitle: "Gerencie divisões de transações",
});

useHead({ title: "Entradas Compartilhadas | Auraxis" });

const { data: sharedByMe, isLoading: isByMeLoading, isError: isByMeError } = useSharedByMeQuery();
const { data: sharedWithMe, isLoading: isWithMeLoading, isError: isWithMeError } = useSharedWithMeQuery();
const revokeMutation = useRevokeSharedEntryMutation();

const isLoading = computed(() => isByMeLoading.value || isWithMeLoading.value);
const isError = computed(() => isByMeError.value || isWithMeError.value);

const byMeList = computed(() => sharedByMe.value ?? []);
const withMeList = computed(() => sharedWithMe.value ?? []);

const allEntries = computed(() => [...byMeList.value, ...withMeList.value]);

const totalCount = computed(() => allEntries.value.length);

const pendingCount = computed(
  () => allEntries.value.filter((e) => e.status === "pending").length,
);

const acceptedCount = computed(
  () => allEntries.value.filter((e) => e.status === "accepted").length,
);

/**
 * Revokes a shared entry by id via the API.
 *
 * @param id - The shared entry id to revoke.
 */
const onRevoke = (id: string): void => {
  revokeMutation.mutate(id);
};
</script>

<template>
  <div class="shared-entries-page">
    <NPageHeader
      :title="$t('pages.sharedEntries.title')"
      :subtitle="$t('pages.sharedEntries.subtitle')"
    />

    <UiInlineError
      v-if="isError"
      :title="$t('pages.sharedEntries.loadError')"
      :message="$t('pages.sharedEntries.loadErrorMessage')"
    />

    <template v-else>
      <NCard :bordered="true" class="shared-entries-page__summary-card">
        <div class="shared-entries-page__summary-stats">
          <NStatistic :label="$t('pages.sharedEntries.total')" :value="String(totalCount)" />
          <NStatistic :label="$t('pages.sharedEntries.pending')" :value="String(pendingCount)" />
          <NStatistic :label="$t('pages.sharedEntries.accepted')" :value="String(acceptedCount)" />
        </div>
      </NCard>

      <UiPageLoader v-if="isLoading" :rows="3" />

      <NTabs v-else type="line" animated>
        <NTabPane name="by-me" :tab="$t('pages.sharedEntries.byMe')">
          <div class="shared-entries-page__tab-content">
            <NEmpty
              v-if="byMeList.length === 0"
              :description="$t('pages.sharedEntries.emptyByMe')"
            />
            <div v-else class="shared-entries-page__list">
              <SharedEntryRow
                v-for="entry in byMeList"
                :key="entry.id"
                :entry="entry"
                mode="by-me"
                @revoke="onRevoke"
              />
            </div>
          </div>
        </NTabPane>

        <NTabPane name="with-me" :tab="$t('pages.sharedEntries.withMe')">
          <div class="shared-entries-page__tab-content">
            <NEmpty
              v-if="withMeList.length === 0"
              :description="$t('pages.sharedEntries.emptyWithMe')"
            />
            <div v-else class="shared-entries-page__list">
              <SharedEntryRow
                v-for="entry in withMeList"
                :key="entry.id"
                :entry="entry"
                mode="with-me"
              />
            </div>
          </div>
        </NTabPane>
      </NTabs>
    </template>
  </div>
</template>

<style scoped>
.shared-entries-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3);
}

.shared-entries-page__summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
}

.shared-entries-page__tab-content {
  padding-top: var(--space-3);
}

.shared-entries-page__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
