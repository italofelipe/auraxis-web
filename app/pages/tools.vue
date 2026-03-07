<script setup lang="ts">
import { useToolsCatalogQuery } from "~/composables/useTools";

definePageMeta({ middleware: ["authenticated"] });

const toolsCatalogQuery = useToolsCatalogQuery();
</script>

<template>
  <UiBaseCard title="Ferramentas">
    <BaseSkeleton v-if="toolsCatalogQuery.isLoading.value" />

    <ul v-else class="tools-list">
      <li v-for="tool in toolsCatalogQuery.data.value?.tools ?? []" :key="tool.id">
        <h3>{{ tool.name }}</h3>
        <p>{{ tool.description }}</p>
        <small>{{ tool.enabled ? "Ativo" : "Em planejamento" }}</small>
      </li>
    </ul>
  </UiBaseCard>
</template>

<style scoped>
.tools-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-2);
}

.tools-list li {
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-brand-400);
}

.tools-list h3,
.tools-list p,
.tools-list small {
  margin: 0;
}

.tools-list p {
  margin-top: var(--space-1);
}

.tools-list small {
  display: inline-block;
  margin-top: var(--space-1);
  color: var(--color-neutral-700);
  font-weight: var(--font-weight-semibold);
}
</style>
