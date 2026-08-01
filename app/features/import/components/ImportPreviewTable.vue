<script setup lang="ts">
import { h, computed, type VNode } from "vue";
import { NCheckbox, NDataTable, NTag, NText, type DataTableColumns } from "naive-ui";

import type { ImportTransactionDraft } from "~/features/import/model/import";
import { formatCurrency } from "~/utils/currency";

const props = defineProps<{
  rows: readonly ImportTransactionDraft[];
  selectedIds: ReadonlySet<string>;
}>();

const emit = defineEmits<{ toggle: [draftId: string] }>();

const { t } = useI18n();

/**
 * Formata o valor do draft, que chega como string decimal do backend.
 *
 * @param draft Linha do preview.
 * @returns Valor em moeda, com sinal conforme o tipo.
 */
const formatAmount = (draft: ImportTransactionDraft): string => {
  const parsed = Number(draft.amount);
  const value = Number.isFinite(parsed) ? parsed : 0;
  return formatCurrency(draft.type === "income" ? value : -value);
};

const columns = computed((): DataTableColumns<ImportTransactionDraft> => [
  {
    title: t("import.preview.columns.include"),
    key: "include",
    width: 72,
    render: (row) =>
      h(NCheckbox, {
        checked: props.selectedIds.has(row.id),
        "aria-label": t("import.preview.toggleRow", { description: row.description }),
        "data-testid": `import-row-toggle-${row.id}`,
        onUpdateChecked: () => emit("toggle", row.id),
      }),
  },
  { title: t("import.preview.columns.date"), key: "date", width: 120 },
  {
    title: t("import.preview.columns.description"),
    key: "description",
    render: (row) =>
      row.missingFields.includes("description")
        ? h(NText, { depth: 3, italic: true }, () => t("import.preview.missingValue"))
        : row.description,
  },
  {
    title: t("import.preview.columns.amount"),
    key: "amount",
    align: "right",
    render: (row) =>
      row.missingFields.includes("amount")
        ? h(NText, { depth: 3, italic: true }, () => t("import.preview.missingValue"))
        : formatAmount(row),
  },
  {
    title: t("import.preview.columns.status"),
    key: "status",
    width: 200,
    render: (row): VNode => {
      const tags: VNode[] = [];

      if (row.isDuplicate) {
        tags.push(
          h(NTag, { size: "small", type: "warning", bordered: false }, () =>
            t("import.preview.duplicate"),
          ),
        );
      }

      if (row.missingFields.length > 0) {
        tags.push(
          h(NTag, { size: "small", type: "error", bordered: false }, () =>
            t("import.preview.incomplete"),
          ),
        );
      }

      if (row.category) {
        tags.push(h(NTag, { size: "small", bordered: false }, () => row.category));
      }

      return h("div", { class: "import-preview__tags" }, tags);
    },
  },
]);

/**
 * Chave estável de linha para a tabela.
 *
 * @param row Linha do preview.
 * @returns Id do draft.
 */
const rowKey = (row: ImportTransactionDraft): string => row.id;
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="[...props.rows]"
    :row-key="rowKey"
    :bordered="false"
    size="small"
    :scroll-x="720"
    data-testid="import-preview-table"
  />
</template>

<style scoped>
.import-preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
</style>
