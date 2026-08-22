<script setup lang="ts">
/**
 * Aba de extrato em PDF: conta → upload → revisão → confirmação.
 *
 * Cada erro tem sua própria mensagem porque cada um tem uma saída diferente:
 * exportar sem senha, baixar em outro formato, usar a aba de OFX. "Algo deu
 * errado" não diz à pessoa o que fazer a seguir.
 */
import { NAlert, NButton, NCard, NStatistic } from "naive-ui";
import { computed, ref } from "vue";

import ImportDropzone from "~/features/import/components/ImportDropzone.vue";
import StatementAccountPicker from "~/features/import/components/StatementAccountPicker.vue";
import StatementDuplicateModal from "~/features/import/components/StatementDuplicateModal.vue";
import StatementFilters from "~/features/import/components/StatementFilters.vue";
import StatementPreviewTable from "~/features/import/components/StatementPreviewTable.vue";
import StatementSummaryPanel from "~/features/import/components/StatementSummaryPanel.vue";
import { useStatementImportWizard } from "~/features/import/composables/useStatementImportWizard";
import {
  STATEMENT_ACCEPTED_EXTENSIONS,
  type StatementDecisionAction,
  type StatementEntry,
} from "~/features/import/model/statement-import";

const {
  step,
  accountId,
  preview,
  result,
  error,
  errorDetail,
  filter,
  visibleEntries,
  selectedCount,
  linkedCount,
  ignoredCount,
  unresolvedConflicts,
  canConfirm,
  isBusy,
  chooseAccount,
  selectFile,
  decide,
  actionFor,
  confirm,
  reset,
  dismissError,
} = useStatementImportWizard();

const inspected = ref<StatementEntry | null>(null);

const extensions = computed(() => [...STATEMENT_ACCEPTED_EXTENSIONS]);

/**
 * Alterna entre importar a linha e deixá-la de fora.
 *
 * Uma linha que o sistema propôs importar passa a ser ignorada; uma que ficaria
 * de fora passa a ser importada. Quem quer vincular a uma transação existente
 * usa o modal de duplicidade, onde a comparação está à vista.
 *
 * @param entry Linha alternada.
 */
const toggle = (entry: StatementEntry): void => {
  const current = actionFor(entry);
  if (current === "import") {
    decide({ lineIndex: entry.lineIndex, action: "ignore" });
    return;
  }
  decide({ lineIndex: entry.lineIndex, action: "import" });
};

/**
 * Abre a comparação de duplicidade.
 *
 * @param entry Linha inspecionada.
 */
const inspect = (entry: StatementEntry): void => {
  inspected.value = entry;
};

/**
 * Aplica a decisão tomada no modal.
 *
 * @param action Ação escolhida.
 */
const decideFromModal = (action: StatementDecisionAction): void => {
  const entry = inspected.value;
  if (entry === null) {
    return;
  }
  decide({
    lineIndex: entry.lineIndex,
    action,
    ...(action === "link_existing" && entry.matchedTransactionId
      ? { matchedTransactionId: entry.matchedTransactionId }
      : {}),
  });
  inspected.value = null;
};
</script>

<template>
  <section class="statement-panel" data-testid="statement-import-panel">
    <NAlert
      v-if="error !== 'none'"
      :type="error === 'conflicts' ? 'warning' : 'error'"
      closable
      :bordered="false"
      :data-testid="`statement-error-${error}`"
      @close="dismissError"
    >
      {{ $t(`import.statement.errors.${error}`) }}
      <template v-if="errorDetail">
        <br >
        <small>{{ errorDetail }}</small>
      </template>
    </NAlert>

    <StatementAccountPicker
      v-if="step === 'account'"
      v-model="accountId"
      :disabled="isBusy"
      @confirm="chooseAccount"
    />

    <template v-else-if="step === 'select'">
      <NButton
        text
        class="statement-panel__back"
        data-testid="statement-change-account"
        @click="step = 'account'"
      >
        {{ $t("import.statement.account.change") }}
      </NButton>
      <ImportDropzone
        :extensions="extensions"
        :title="$t('import.statement.dropzone.title')"
        :hint="$t('import.statement.dropzone.hint')"
        :invalid-type-message="$t('import.statement.dropzone.invalidType')"
        :aria-label="$t('import.statement.dropzone.title')"
        :disabled="isBusy"
        @select="selectFile"
      />
    </template>

    <template v-else-if="step === 'review' && preview">
      <NAlert
        v-if="preview.alreadyImportedFile"
        type="info"
        :bordered="false"
        data-testid="statement-already-imported"
      >
        {{ $t("import.statement.alreadyImported") }}
      </NAlert>

      <NCard :bordered="false" size="small" class="statement-panel__header">
        <div class="statement-panel__meta">
          <span data-testid="statement-bank">{{ preview.bankId }}</span>
          <span v-if="preview.periodStart">
            {{
              $t("import.statement.period", {
                start: preview.periodStart,
                end: preview.periodEnd,
              })
            }}
          </span>
          <span>
            {{ $t("import.statement.pages", { count: preview.pageCount }) }}
          </span>
        </div>
      </NCard>

      <StatementSummaryPanel
        :summary="preview.summary"
        :selected-count="selectedCount"
        :linked-count="linkedCount"
        :ignored-count="ignoredCount"
        :unresolved-conflicts="unresolvedConflicts.length"
      />

      <StatementFilters
        v-model="filter"
        :entries="preview.entries"
      />

      <StatementPreviewTable
        :entries="visibleEntries"
        :action-for="actionFor"
        :disabled="isBusy"
        @toggle="toggle"
        @inspect="inspect"
      />

      <div class="statement-panel__actions">
        <NButton
          quaternary
          :disabled="isBusy"
          data-testid="statement-restart"
          @click="reset"
        >
          {{ $t("import.statement.restart") }}
        </NButton>
        <NButton
          type="primary"
          :loading="isBusy"
          :disabled="!canConfirm"
          data-testid="statement-confirm"
          @click="confirm"
        >
          {{ $t("import.statement.confirm", { count: selectedCount }) }}
        </NButton>
      </div>
    </template>

    <template v-else-if="step === 'success' && result">
      <NCard :bordered="false" data-testid="statement-result">
        <div class="statement-panel__result">
          <NStatistic
            :label="$t('import.statement.result.imported')"
            :value="result.importedCount"
          />
          <NStatistic
            :label="$t('import.statement.result.linked')"
            :value="result.linkedCount"
          />
          <NStatistic
            :label="$t('import.statement.result.ignored')"
            :value="result.ignoredCount"
          />
        </div>
        <NAlert
          v-if="result.errors.length"
          type="warning"
          :bordered="false"
          class="statement-panel__errors"
          data-testid="statement-result-errors"
        >
          {{ $t("import.statement.result.partial", { count: result.errors.length }) }}
          <ul>
            <li v-for="failure in result.errors" :key="failure.lineIndex">
              {{ failure.reason }}
            </li>
          </ul>
        </NAlert>
        <NButton class="statement-panel__again" data-testid="statement-again" @click="reset">
          {{ $t("import.statement.result.again") }}
        </NButton>
      </NCard>
    </template>

    <StatementDuplicateModal
      :show="inspected !== null"
      :entry="inspected"
      @cancel="inspected = null"
      @decide="decideFromModal"
    />
  </section>
</template>

<style scoped>
.statement-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.statement-panel__back {
  align-self: flex-start;
}

.statement-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.statement-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.statement-panel__result {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
}

.statement-panel__errors {
  margin-top: var(--space-4);
}

.statement-panel__again {
  margin-top: var(--space-4);
}
</style>
