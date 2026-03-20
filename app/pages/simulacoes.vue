<script setup lang="ts">
import { NSkeleton, NSpace } from "naive-ui";

import { useSimulationsQuery } from "~/features/simulations/queries/use-simulations-query";

definePageMeta({
  middleware: ["authenticated"],
  pageTitle: "Simulações",
  pageSubtitle: "Consulte os resultados salvos das ferramentas",
});

const simulationsQuery = useSimulationsQuery();
</script>

<template>
  <div class="simulacoes-page">
    <NSpace v-if="simulationsQuery.isLoading.value" vertical :size="16">
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
      <NSkeleton height="80px" :sharp="false" />
    </NSpace>

    <UiBaseCard v-else-if="simulationsQuery.isError.value" title="Erro ao carregar simulações">
      <p class="simulacoes-page__support-copy">
        Não foi possível carregar suas simulações. Tente novamente mais tarde.
      </p>
    </UiBaseCard>

    <UiBaseCard
      v-else-if="simulationsQuery.data.value && simulationsQuery.data.value.length === 0"
      title="Nenhuma simulação salva"
    >
      <p class="simulacoes-page__support-copy">
        Você ainda não salvou nenhuma simulação. Use as ferramentas e salve seus resultados para
        acompanhá-los aqui.
      </p>
    </UiBaseCard>

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
  gap: var(--space-4);
}

.simulacoes-page__support-copy {
  margin: 0;
  color: var(--color-text-muted);
}

.simulacoes-page__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.simulacoes-page__item-meta {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
