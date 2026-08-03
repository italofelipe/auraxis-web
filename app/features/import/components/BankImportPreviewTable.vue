<script setup lang="ts">
import { h, computed, type VNode } from "vue";
import { NCheckbox, NDataTable, NTag, type DataTableColumns } from "naive-ui";

import type { BankTransactionDraft } from "~/features/import/model/bank-import";
import { formatCurrency } from "~/utils/currency";

const props = defineProps<{
  rows: readonly BankTransactionDraft[];
  selectedIds: ReadonlySet<string>;
}>();

const emit = defineEmits<{ toggle: [draftId: string] }>();

const { t } = useI18n();

/**
 * Formata o valor da linha, recolocando o sinal que o mapper tirou.
 *
 * @param draft Linha do extrato.
 * @returns Valor em moeda, negativo quando é saída.
 */
const formatAmount = (draft: BankTransactionDraft): string => {
  const parsed = Number(draft.amount);
  const value = Number.isFinite(parsed) ? parsed : 0;
  return formatCurrency(draft.type === "income" ? value : -value);
};

const columns = computed((): DataTableColumns<BankTransactionDraft> => [
  {
    title: t("import.preview.columns.include"),
    key: "include",
    width: 72,
    render: (row) =>
      h(NCheckbox, {
        checked: props.selectedIds.has(row.id),
        "aria-label": t("import.preview.toggleRow", { description: row.description }),
        "data-testid": `bank-import-row-toggle-${row.id}`,
        onUpdateChecked: () => emit("toggle", row.id),
      }),
  },
  { title: t("import.preview.columns.date"), key: "date", width: 120 },
  { title: t("import.preview.columns.description"), key: "description" },
  {
    title: t("import.preview.columns.amount"),
    key: "amount",
    align: "right",
    render: (row) => formatAmount(row),
  },
  {
    title: t("import.preview.columns.status"),
    key: "status",
    width: 180,
    // Só a duplicata aparece: o extrato não tem linha incompleta (o parser lê
    // o arquivo inteiro ou falha) e "conciliação" não existe no v2.
    render: (row): VNode | string =>
      row.isDuplicate
        ? h(NTag, { size: "small", type: "warning", bordered: false }, () =>
            t("import.preview.duplicate"),
          )
        : "",
  },
]);

/**
 * Chave estável de linha para a tabela.
 *
 * @param row Linha do extrato.
 * @returns Id do draft.
 */
const rowKey = (row: BankTransactionDraft): string => row.id;
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="[...props.rows]"
    :row-key="rowKey"
    :bordered="false"
    size="small"
    :scroll-x="720"
    data-testid="bank-import-preview-table"
  />
</template>
