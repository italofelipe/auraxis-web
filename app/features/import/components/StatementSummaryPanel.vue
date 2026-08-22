<script setup lang="ts">
/**
 * Resumo mostrado antes da confirmação.
 *
 * O total de transferências aparece separado de receitas e despesas de
 * propósito: quem moveu R$ 500 entre as próprias contas e vê isso somado aos
 * gastos para de confiar nos números — e é justamente essa dupla contagem que
 * a feature existe para evitar.
 */
import { NAlert, NStatistic, NTag } from "naive-ui";
import { computed } from "vue";

import {
  formatStatementAmount,
  type StatementSummary,
} from "~/features/import/model/statement-import";

const properties = defineProps<{
  summary: StatementSummary;
  /** Linhas que serão criadas com as decisões atuais. */
  selectedCount: number;
  /** Linhas que serão vinculadas a transações existentes. */
  linkedCount: number;
  /** Linhas que serão ignoradas. */
  ignoredCount: number;
  /** Conflitos ainda sem decisão. */
  unresolvedConflicts: number;
}>();

const hasTransfers = computed(() => properties.summary.transferTotal !== "0.00");
</script>

<template>
  <section class="statement-summary" data-testid="statement-summary">
    <div class="statement-summary__grid">
      <NStatistic
        :label="$t('import.statement.summary.extracted')"
        :value="summary.movements"
        data-testid="statement-summary-movements"
      />
      <NStatistic
        :label="$t('import.statement.summary.selected')"
        :value="selectedCount"
        data-testid="statement-summary-selected"
      />
      <NStatistic
        :label="$t('import.statement.summary.linked')"
        :value="linkedCount"
        data-testid="statement-summary-linked"
      />
      <NStatistic
        :label="$t('import.statement.summary.ignored')"
        :value="ignoredCount"
        data-testid="statement-summary-ignored"
      />
      <NStatistic
        :label="$t('import.statement.summary.needsReview')"
        :value="summary.needsReview"
        data-testid="statement-summary-review"
      />
    </div>

    <div class="statement-summary__totals">
      <NTag type="success" :bordered="false" data-testid="statement-summary-credits">
        {{ $t("import.statement.summary.credits", { value: formatStatementAmount(summary.creditTotal) }) }}
      </NTag>
      <NTag type="error" :bordered="false" data-testid="statement-summary-debits">
        {{ $t("import.statement.summary.debits", { value: formatStatementAmount(summary.debitTotal) }) }}
      </NTag>
      <NTag
        v-if="hasTransfers"
        type="info"
        :bordered="false"
        data-testid="statement-summary-transfers"
      >
        {{ $t("import.statement.summary.transfers", { value: formatStatementAmount(summary.transferTotal) }) }}
      </NTag>
    </div>

    <NAlert
      v-if="hasTransfers"
      type="info"
      :bordered="false"
      data-testid="statement-summary-transfer-notice"
    >
      {{ $t("import.statement.summary.transferNotice") }}
    </NAlert>

    <NAlert
      v-if="summary.balanceMarkers > 0"
      type="default"
      :bordered="false"
      data-testid="statement-summary-balance-notice"
    >
      {{ $t("import.statement.summary.balanceNotice", { count: summary.balanceMarkers }) }}
    </NAlert>

    <NAlert
      v-if="unresolvedConflicts > 0"
      type="warning"
      :bordered="false"
      data-testid="statement-summary-conflicts"
    >
      {{ $t("import.statement.summary.conflictNotice", { count: unresolvedConflicts }) }}
    </NAlert>

    <NAlert
      v-if="summary.rejectedLines > 0"
      type="warning"
      :bordered="false"
      data-testid="statement-summary-rejected"
    >
      {{ $t("import.statement.summary.rejectedNotice", { count: summary.rejectedLines }) }}
    </NAlert>
  </section>
</template>

<style scoped>
.statement-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.statement-summary__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-4);
}

.statement-summary__totals {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
