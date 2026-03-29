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
  middleware: ["authenticated"],
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
      title="Entradas Compartilhadas"
      subtitle="Gerencie divisões de transações"
    />

    <UiInlineError
      v-if="isError"
      title="Não foi possível carregar as entradas compartilhadas"
      message="Tente recarregar a página."
    />

    <template v-else>
      <NCard :bordered="true" class="shared-entries-page__summary-card">
        <div class="shared-entries-page__summary-stats">
          <NStatistic label="Total" :value="String(totalCount)" />
          <NStatistic label="Pendentes" :value="String(pendingCount)" />
          <NStatistic label="Aceitas" :value="String(acceptedCount)" />
        </div>
      </NCard>

      <UiPageLoader v-if="isLoading" :rows="3" />

      <NTabs v-else type="line" animated>
        <NTabPane name="by-me" tab="Compartilhadas por mim">
          <div class="shared-entries-page__tab-content">
            <NEmpty
              v-if="byMeList.length === 0"
              description="Nenhuma entrada compartilhada por você."
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

        <NTabPane name="with-me" tab="Compartilhadas comigo">
          <div class="shared-entries-page__tab-content">
            <NEmpty
              v-if="withMeList.length === 0"
              description="Nenhuma entrada compartilhada com você."
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
