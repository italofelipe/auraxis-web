<script setup lang="ts">
import { NSkeleton, NSpace } from "naive-ui";

import { useSimulationsQuery } from "~/features/simulations/queries/use-simulations-query";

definePageMeta({ middleware: ["authenticated"] });

const simulationsQuery = useSimulationsQuery();
</script>

<template>
  <div class="simulacoes-page">
    <header class="simulacoes-page__header">
      <h1>Simulações salvas</h1>
      <p class="simulacoes-page__subtitle">
        Consulte os resultados que você salvou ao usar as ferramentas.
      </p>
    </header>

    <!-- Loading state -->
    <NSpace v-if="simulationsQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
    </NSpace>

    <!-- Error state -->
    <UiBaseCard v-else-if="simulationsQuery.isError.value" title="Erro ao carregar simulações">
      <p class="simulacoes-page__support-copy">
        Não foi possível carregar suas simulações. Tente novamente mais tarde.
      </p>
    </UiBaseCard>

    <!-- Empty state -->
    <UiBaseCard
      v-else-if="simulationsQuery.data.value && simulationsQuery.data.value.length === 0"
      title="Nenhuma simulação salva"
    >
      <p class="simulacoes-page__support-copy">
        Você ainda não salvou nenhuma simulação. Use as ferramentas e salve seus resultados para
        acompanhá-los aqui.
      </p>
    </UiBaseCard>

    <!-- Loaded state -->
    <ul
      v-else-if="simulationsQuery.data.value && simulationsQuery.data.value.length > 0"
      class="simulacoes-page__list"
      role="list"
    >
      <li
        v-for="simulation in simulationsQuery.data.value"
        :key="simulation.id"
        class="simulacoes-page__item"
      >
        <UiBaseCard :title="simulation.name">
          <p class="simulacoes-page__item-meta">
            Ferramenta: <strong>{{ simulation.toolSlug }}</strong>
          </p>
          <p class="simulacoes-page__item-meta">
            Salvo em: {{ new Date(simulation.createdAt).toLocaleDateString("pt-BR") }}
          </p>
        </UiBaseCard>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.simulacoes-page {
  display: grid;
  gap: var(--space-4, 16px);
  padding: var(--space-4, 16px);
}

.simulacoes-page__header {
  margin-bottom: var(--space-2, 8px);
}

.simulacoes-page__subtitle {
  margin: var(--space-1, 4px) 0 0;
  color: var(--color-text-subtle, #888);
}

.simulacoes-page__support-copy {
  margin: 0;
  color: var(--color-text-subtle, #888);
}

.simulacoes-page__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3, 12px);
}

.simulacoes-page__item-meta {
  margin: var(--space-1, 4px) 0 0;
  font-size: var(--font-size-body-sm, 0.875rem);
  color: var(--color-text-subtle, #888);
}
</style>
