<script setup lang="ts">
import { NAlert, NButton, NStatistic, NText } from "naive-ui";

import UiEmptyState from "~/components/ui/UiEmptyState/UiEmptyState.vue";
import type { ImportConfirmResult } from "~/features/import/model/import";

const props = defineProps<{ result: ImportConfirmResult }>();

const emit = defineEmits<{ "go-to-transactions": []; "import-another": [] }>();

const { t } = useI18n();
</script>

<template>
  <div class="import-result" data-testid="import-result">
    <UiEmptyState
      icon="check"
      :title="t('import.success.title')"
      :description="t('import.success.description')"
      :action-label="t('import.success.goToTransactions')"
      :secondary-label="t('import.success.importAnother')"
      @action="emit('go-to-transactions')"
      @secondary-action="emit('import-another')"
    />

    <div class="import-result__stats">
      <NStatistic
        :label="t('import.success.imported')"
        :value="props.result.importedCount"
      />
      <NStatistic
        :label="t('import.success.skipped')"
        :value="props.result.skippedCount"
      />
    </div>

    <NAlert
      v-if="props.result.errors.length > 0"
      type="warning"
      :title="t('import.success.errorsTitle', props.result.errors.length)"
      data-testid="import-result-errors"
    >
      <NText depth="3">{{ t("import.success.errorsDescription") }}</NText>
      <ul class="import-result__errors">
        <li v-for="rowError in props.result.errors" :key="rowError.draftId">
          {{ rowError.reason }}
        </li>
      </ul>
    </NAlert>

    <NButton quaternary @click="emit('import-another')">
      {{ t("import.success.importAnother") }}
    </NButton>
  </div>
</template>

<style scoped>
.import-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.import-result__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-4);
}

.import-result__errors {
  margin: var(--space-1) 0 0;
  padding-left: var(--space-3);
}
</style>
