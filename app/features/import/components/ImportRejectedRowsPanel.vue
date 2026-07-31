<script setup lang="ts">
import { NAlert, NCollapse, NCollapseItem, NText } from "naive-ui";

import type { ImportRejectedRow } from "~/features/import/model/import";

const props = defineProps<{ rows: readonly ImportRejectedRow[] }>();

const { t } = useI18n();
</script>

<template>
  <!--
    Sem este painel, um arquivo de 100 lançamentos que rende 87 parece ter
    importado tudo — e a diferença só aparece na conferência do extrato (#1298).
  -->
  <NAlert
    v-if="props.rows.length > 0"
    type="warning"
    :title="t('import.rejectedRows.title', props.rows.length)"
    data-testid="import-rejected-rows"
  >
    <NText depth="3">{{ t("import.rejectedRows.description") }}</NText>

    <NCollapse class="import-rejected__list">
      <NCollapseItem
        :title="t('import.rejectedRows.expand')"
        name="rejected"
      >
        <ul class="import-rejected__items">
          <li v-for="row in props.rows" :key="`${row.lineNumber}-${row.reason}`">
            <NText strong>
              {{ t("import.rejectedRows.lineLabel", { line: row.lineNumber }) }}
            </NText>
            <NText depth="3"> — {{ row.reason }}</NText>
          </li>
        </ul>
      </NCollapseItem>
    </NCollapse>
  </NAlert>
</template>

<style scoped>
.import-rejected__list {
  margin-top: var(--space-2);
}

.import-rejected__items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding-left: var(--space-3);
}
</style>
