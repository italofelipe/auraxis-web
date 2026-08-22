<script setup lang="ts">
/**
 * Tabela de revisão do extrato.
 *
 * Cada linha mostra o que o banco escreveu, o que o sistema concluiu, com que
 * confiança e por quê — e qual ação será executada. A ação é editável linha a
 * linha; nada é decidido em silêncio.
 *
 * A seleção não usa o `type: "selection"` do Naive, seguindo o padrão já
 * estabelecido no import de planilha: a coluna é própria porque o estado não é
 * binário (importar, vincular, ignorar) e cada linha precisa de `aria-label`
 * traduzido.
 */
import { NButton, NDataTable, NTag, NText } from "naive-ui";
import { computed, h, type VNode } from "vue";
import { useI18n } from "vue-i18n";

import type {
  StatementDecisionAction,
  StatementEntry,
} from "~/features/import/model/statement-import";

const properties = defineProps<{
  entries: readonly StatementEntry[];
  /** Resolve a ação efetiva de cada linha. */
  actionFor: (entry: StatementEntry) => StatementDecisionAction | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (event: "toggle" | "inspect", entry: StatementEntry): void;
}>();

const { t } = useI18n();

/** Cores por status de duplicidade, do mais alarmante ao neutro. */
const MATCH_TONE: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  conflict: "error",
  exact: "info",
  likely: "warning",
  possible: "warning",
  unique: "success",
};

/**
 * Rótulo da ação que será executada.
 *
 * @param entry Linha avaliada.
 * @returns O texto da ação.
 */
const actionLabel = (entry: StatementEntry): string => {
  const action = properties.actionFor(entry);
  return action === null
    ? t("import.statement.action.skip")
    : t(`import.statement.action.${action}`);
};

// eslint-disable-next-line max-lines-per-function
const columns = computed(() => [
  {
    key: "posting_date",
    title: t("import.statement.columns.date"),
    width: 110,
    /**
     * @param row Linha renderizada.
     * @returns A data de lançamento, e a da compra quando diferente.
     */
    render: (row: StatementEntry): VNode =>
      h("div", { class: "statement-table__date" }, [
        h("span", {}, row.postingDate),
        row.transactionDate && row.transactionDate !== row.postingDate
          ? h(
              NText,
              { depth: 3, class: "statement-table__subdate" },
              { default: () => t("import.statement.columns.boughtOn", { date: row.transactionDate }) },
            )
          : null,
      ]),
  },
  {
    key: "description",
    title: t("import.statement.columns.description"),
    minWidth: 240,
    /**
     * @param row Linha renderizada.
     * @returns A descrição original e a justificativa da classificação.
     */
    render: (row: StatementEntry): VNode =>
      h("div", { class: "statement-table__description" }, [
        h("span", {}, row.rawDescription),
        row.rationale
          ? h(
              NText,
              { depth: 3, class: "statement-table__rationale" },
              { default: () => row.rationale },
            )
          : null,
      ]),
  },
  {
    key: "amount",
    title: t("import.statement.columns.amount"),
    width: 130,
    align: "right" as const,
    /**
     * @param row Linha renderizada.
     * @returns O valor, com a cor da direção.
     */
    render: (row: StatementEntry): VNode =>
      h(
        NText,
        { type: row.direction === "credit" ? "success" : "error" },
        { default: () => row.amount },
      ),
  },
  {
    key: "nature",
    title: t("import.statement.columns.nature"),
    width: 190,
    /**
     * @param row Linha renderizada.
     * @returns As etiquetas de natureza, categoria e sinalizações.
     */
    render: (row: StatementEntry): VNode =>
      h("div", { class: "statement-table__tags" }, [
        row.financialNature
          ? h(
              NTag,
              { size: "small", bordered: false, type: row.isNeutralNature ? "info" : "default" },
              { default: () => t(`import.statement.nature.${row.financialNature}`) },
            )
          : null,
        row.suggestedCategory
          ? h(
              NTag,
              { size: "small", bordered: false },
              { default: () => row.suggestedCategory },
            )
          : null,
        row.recurrenceHint
          ? h(
              NTag,
              { size: "small", bordered: false, type: "info" },
              { default: () => t("import.statement.badge.recurring") },
            )
          : null,
        row.needsReview
          ? h(
              NTag,
              { size: "small", bordered: false, type: "warning" },
              { default: () => t("import.statement.badge.review") },
            )
          : null,
      ]),
  },
  {
    key: "match",
    title: t("import.statement.columns.duplicate"),
    width: 150,
    /**
     * @param row Linha renderizada.
     * @returns O status de duplicidade, clicável quando há o que comparar.
     */
    render: (row: StatementEntry): VNode => {
      const tag = h(
        NTag,
        { size: "small", bordered: false, type: MATCH_TONE[row.matchStatus] ?? "default" },
        { default: () => t(`import.statement.match.${row.matchStatus}`) },
      );
      if (row.matchStatus === "unique") {
        return tag;
      }
      return h(
        NButton,
        {
          text: true,
          "data-testid": `statement-inspect-${row.lineIndex}`,
          "aria-label": t("import.statement.duplicate.inspect", {
            description: row.rawDescription,
          }),
          onClick: () => emit("inspect", row),
        },
        { default: () => tag },
      );
    },
  },
  {
    key: "action",
    title: t("import.statement.columns.action"),
    width: 160,
    /**
     * @param row Linha renderizada.
     * @returns O botão que alterna entre importar e deixar de fora.
     */
    render: (row: StatementEntry): VNode =>
      h(
        NButton,
        {
          size: "small",
          secondary: true,
          disabled: properties.disabled || row.kind === "balance_marker",
          "data-testid": `statement-action-${row.lineIndex}`,
          "aria-label": t("import.statement.action.toggle", {
            description: row.rawDescription,
          }),
          onClick: () => emit("toggle", row),
        },
        { default: () => actionLabel(row) },
      ),
  },
]);

/**
 * Chave estável de linha.
 *
 * @param row Linha renderizada.
 * @returns O índice da linha no documento.
 */
const rowKey = (row: StatementEntry): number => row.lineIndex;
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="entries as StatementEntry[]"
    :row-key="rowKey"
    :bordered="false"
    :scroll-x="1000"
    size="small"
    data-testid="statement-preview-table"
  />
</template>

<style scoped>
.statement-table__date,
.statement-table__description {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.statement-table__subdate,
.statement-table__rationale {
  font-size: var(--font-size-xs);
}

.statement-table__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
</style>
