<script setup lang="ts">
import {
  NCard,
  NStatistic,
  NEmpty,
  NTabs,
  NTabPane,
  NPageHeader,
} from "naive-ui";
import {
  MOCK_SHARED_BY_ME,
  MOCK_SHARED_WITH_ME,
} from "~/features/shared-entries/mock/shared-entries.mock";

definePageMeta({
  layout: "default",
  middleware: ["authenticated"],
  pageTitle: "Entradas Compartilhadas",
  pageSubtitle: "Gerencie divisões de transações",
});

useHead({ title: "Entradas Compartilhadas | Auraxis" });

const sharedByMe = ref([...MOCK_SHARED_BY_ME]);
const sharedWithMe = ref([...MOCK_SHARED_WITH_ME]);

const allEntries = computed(() => [...sharedByMe.value, ...sharedWithMe.value]);

const totalCount = computed(() => allEntries.value.length);

const pendingCount = computed(
  () => allEntries.value.filter((e) => e.status === "pending").length,
);

const acceptedCount = computed(
  () => allEntries.value.filter((e) => e.status === "accepted").length,
);

/**
 * Revokes a shared entry by id, removing it from the by-me list.
 *
 * @param id - The shared entry id to revoke.
 */
const onRevoke = (id: string): void => {
  sharedByMe.value = sharedByMe.value.filter((e) => e.id !== id);
};
</script>

<template>
  <div class="shared-entries-page">
    <NPageHeader
      title="Entradas Compartilhadas"
      subtitle="Gerencie divisões de transações"
    />

    <NCard :bordered="true" class="shared-entries-page__summary-card">
      <div class="shared-entries-page__summary-stats">
        <NStatistic label="Total" :value="String(totalCount)" />
        <NStatistic label="Pendentes" :value="String(pendingCount)" />
        <NStatistic label="Aceitas" :value="String(acceptedCount)" />
      </div>
    </NCard>

    <NTabs type="line" animated>
      <NTabPane name="by-me" tab="Compartilhadas por mim">
        <div class="shared-entries-page__tab-content">
          <NEmpty
            v-if="sharedByMe.length === 0"
            description="Nenhuma entrada compartilhada por você."
          />
          <div v-else class="shared-entries-page__list">
            <SharedEntryRow
              v-for="entry in sharedByMe"
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
            v-if="sharedWithMe.length === 0"
            description="Nenhuma entrada compartilhada com você."
          />
          <div v-else class="shared-entries-page__list">
            <SharedEntryRow
              v-for="entry in sharedWithMe"
              :key="entry.id"
              :entry="entry"
              mode="with-me"
            />
          </div>
        </div>
      </NTabPane>
    </NTabs>
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
