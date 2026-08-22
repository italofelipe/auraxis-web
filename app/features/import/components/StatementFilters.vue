<script setup lang="ts">
/**
 * Filtros da tabela de revisão.
 *
 * A contagem aparece em cada aba porque revisar um extrato de seis meses sem
 * saber quantas linhas cada categoria tem é o mesmo que revisar tudo.
 */
import { NTag } from "naive-ui";
import { computed } from "vue";

import {
  STATEMENT_FILTERS,
  matchesStatementFilter,
  type StatementEntry,
  type StatementFilter,
} from "~/features/import/model/statement-import";

const properties = defineProps<{
  modelValue: StatementFilter;
  entries: readonly StatementEntry[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: StatementFilter): void;
}>();

const tabs = computed(() =>
  STATEMENT_FILTERS.map((filter) => ({
    filter,
    count: properties.entries.filter((entry) =>
      matchesStatementFilter(entry, filter),
    ).length,
  })),
);

/**
 * Troca o filtro ativo.
 *
 * @param filter Filtro escolhido.
 * @returns Nada; apenas propaga a escolha ao pai.
 */
const select = (filter: StatementFilter): void => emit("update:modelValue", filter);
</script>

<template>
  <div
    class="statement-filters"
    role="tablist"
    :aria-label="$t('import.statement.filters.label')"
    data-testid="statement-filters"
  >
    <button
      v-for="tab in tabs"
      :key="tab.filter"
      type="button"
      role="tab"
      class="statement-filters__tab"
      :class="{ 'statement-filters__tab--active': tab.filter === modelValue }"
      :aria-selected="tab.filter === modelValue"
      :data-testid="`statement-filter-${tab.filter}`"
      @click="select(tab.filter)"
    >
      {{ $t(`import.statement.filters.${tab.filter}`) }}
      <NTag size="small" :bordered="false" round>{{ tab.count }}</NTag>
    </button>
  </div>
</template>

<style scoped>
.statement-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.statement-filters__tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-outline-subtle);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--motion-duration-fast);
}

.statement-filters__tab:hover {
  background: var(--color-bg-subtle);
}

.statement-filters__tab--active {
  border-color: var(--color-brand-500);
  color: var(--color-brand-700);
  background: var(--color-bg-subtle);
}

.statement-filters__tab:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
</style>
