<script setup lang="ts">
import { NSkeleton, NSpace } from "naive-ui";

import { useSimulationsQuery } from "~/features/simulations/queries/use-simulations-query";

const { t } = useI18n();

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Simulações",
  pageSubtitle: "Consulte os resultados salvos das ferramentas",
});

const simulationsQuery = useSimulationsQuery();
</script>

<template>
  <div class="simulations-page">
    <NSpace v-if="simulationsQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
    </NSpace>

    <UiBaseCard v-else-if="simulationsQuery.isError.value" :title="t('pages.simulations.errorTitle')">
      <p class="simulations-page__support-copy">
        {{ t('pages.simulations.errorMessage') }}
      </p>
    </UiBaseCard>

    <UiBaseCard
      v-else-if="simulationsQuery.data.value && simulationsQuery.data.value.length === 0"
      :title="t('pages.simulations.emptyTitle')"
    >
      <p class="simulations-page__support-copy">
        {{ t('pages.simulations.emptyMessage') }}
      </p>
    </UiBaseCard>

    <ul
      v-else-if="simulationsQuery.data.value && simulationsQuery.data.value.length > 0"
      class="simulations-page__list"
      role="list"
    >
      <li
        v-for="simulation in simulationsQuery.data.value"
        :key="simulation.id"
        class="simulations-page__item"
      >
        <UiBaseCard :title="simulation.name">
          <p class="simulations-page__item-meta">
            {{ t('pages.simulations.tool') }} <strong>{{ simulation.toolSlug }}</strong>
          </p>
          <p class="simulations-page__item-meta">
            {{ t('pages.simulations.savedAt') }} {{ new Date(simulation.createdAt).toLocaleDateString("pt-BR") }}
          </p>
        </UiBaseCard>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.simulations-page {
  display: grid;
  gap: var(--space-4);
}

.simulations-page__support-copy {
  margin: 0;
  color: var(--color-text-muted);
}

.simulations-page__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.simulations-page__item-meta {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
