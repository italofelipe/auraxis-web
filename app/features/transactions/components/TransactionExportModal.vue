<script setup lang="ts">
import { ref, computed } from "vue";
import { NModal, NButton, NSelect, NDatePicker, NAlert } from "naive-ui";
import { Download, Lock, Sparkles } from "lucide-vue-next";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";
import {
  useTransactionsExportClient,
  type TransactionExportFormat,
} from "~/features/transactions/services/transactions-export.client";

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

type PeriodKey = "current_month" | "last_3_months" | "custom";

const format = ref<TransactionExportFormat>("csv");
const period = ref<PeriodKey>("current_month");
const customStartTs = ref<number | null>(null);
const customEndTs = ref<number | null>(null);
const isExporting = ref(false);
const errorMessage = ref<string | null>(null);

const formatOptions = [
  { label: "CSV (planilha)", value: "csv" },
  { label: "PDF (relatório)", value: "pdf" },
];

const periodOptions = [
  { label: "Mês atual", value: "current_month" },
  { label: "Últimos 3 meses", value: "last_3_months" },
  { label: "Personalizado", value: "custom" },
];

const { isLoading: isEntitlementLoading, data: hasExportAccess } =
  useEntitlementQuery("export_pdf");

const isLocked = computed(() => hasExportAccess.value !== true);

/**
 * Converts a Naive UI date picker timestamp into an ISO date string.
 *
 * @param ts - Timestamp in milliseconds (or null).
 * @returns `YYYY-MM-DD` string, or undefined when the timestamp is empty.
 */
const toIso = (ts: number | null): string | undefined => {
  if (!ts) { return undefined; }
  return new Date(ts).toISOString().slice(0, 10);
};

const resolvedRange = computed<{ start?: string; end?: string }>(() => {
  const today = new Date();
  /**
   * Formats a Date as `YYYY-MM-DD`.
   *
   * @param d - Date instance.
   * @returns ISO date string.
   */
  const iso = (d: Date): string => d.toISOString().slice(0, 10);
  if (period.value === "current_month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: iso(first), end: iso(today) };
  }
  if (period.value === "last_3_months") {
    const first = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    return { start: iso(first), end: iso(today) };
  }
  return { start: toIso(customStartTs.value), end: toIso(customEndTs.value) };
});

const isCustomIncomplete = computed<boolean>(() =>
  period.value === "custom" && (!customStartTs.value || !customEndTs.value),
);

const canExport = computed<boolean>(
  () => !isLocked.value && !isCustomIncomplete.value && !isExporting.value,
);

/**
 *
 */
const handleClose = (): void => {
  if (isExporting.value) { return; }
  emit("update:visible", false);
  errorMessage.value = null;
};

/**
 *
 * @param blob
 * @param filename
 */
const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

/**
 *
 */
const handleExport = async (): Promise<void> => {
  if (!canExport.value) { return; }
  errorMessage.value = null;
  isExporting.value = true;
  try {
    const client = useTransactionsExportClient();
    const range = resolvedRange.value;
    const result = await client.exportTransactions({
      format: format.value,
      start_date: range.start,
      end_date: range.end,
    });
    triggerDownload(result.blob, result.filename);
    emit("update:visible", false);
  }
  catch (err) {
    errorMessage.value = err instanceof Error ? err.message : "Falha ao exportar.";
  }
  finally {
    isExporting.value = false;
  }
};

/**
 *
 */
const handleUpgradeClick = (): void => {
  emit("update:visible", false);
  void navigateTo("/plans");
};
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="isLocked ? 'Exportação Premium' : 'Exportar transações'"
    style="max-width: 520px;"
    :mask-closable="!isExporting"
    @close="handleClose"
  >
    <div v-if="isEntitlementLoading" class="tx-export__loading" aria-busy="true" />
    <template v-else-if="isLocked">
      <div class="tx-export__locked">
        <Lock :size="32" class="tx-export__lock-icon" />
        <h3 class="tx-export__locked-title">Exportação é um recurso Premium</h3>
        <p class="tx-export__locked-description">
          Baixe suas transações em CSV ou PDF para análise offline, backup ou
          compartilhamento com seu contador. Disponível nos planos pagos.
        </p>
        <div class="tx-export__preview" aria-hidden="true">
          <div class="tx-export__preview-row" />
          <div class="tx-export__preview-row" />
          <div class="tx-export__preview-row" />
        </div>
        <NButton type="primary" block @click="handleUpgradeClick">
          <template #icon><Sparkles :size="16" /></template>
          Faça upgrade para exportar seus dados
        </NButton>
      </div>
    </template>
    <template v-else>
      <form class="tx-export__form" @submit.prevent="handleExport">
        <label class="tx-export__field">
          <span>Formato</span>
          <NSelect v-model:value="format" :options="formatOptions" />
        </label>
        <label class="tx-export__field">
          <span>Período</span>
          <NSelect v-model:value="period" :options="periodOptions" />
        </label>
        <template v-if="period === 'custom'">
          <label class="tx-export__field">
            <span>Início</span>
            <NDatePicker v-model:value="customStartTs" type="date" clearable />
          </label>
          <label class="tx-export__field">
            <span>Fim</span>
            <NDatePicker v-model:value="customEndTs" type="date" clearable />
          </label>
        </template>
        <NAlert
          v-if="errorMessage"
          type="error"
          :title="errorMessage"
          class="tx-export__error"
        />
        <div class="tx-export__actions">
          <NButton secondary :disabled="isExporting" @click="handleClose">
            Cancelar
          </NButton>
          <NButton
            type="primary"
            :loading="isExporting"
            :disabled="!canExport"
            attr-type="submit"
          >
            <template #icon><Download :size="16" /></template>
            {{ isExporting ? "Gerando..." : "Baixar" }}
          </NButton>
        </div>
      </form>
    </template>
  </NModal>
</template>

<style scoped>
.tx-export__loading {
  height: 80px;
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
}

.tx-export__form {
  display: grid;
  gap: var(--space-3);
}

.tx-export__field {
  display: grid;
  gap: var(--space-1);
}

.tx-export__field span {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.tx-export__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.tx-export__error {
  margin-top: var(--space-1);
}

.tx-export__locked {
  display: grid;
  gap: var(--space-2);
  justify-items: center;
  text-align: center;
  padding: var(--space-3);
}

.tx-export__lock-icon {
  color: var(--color-brand);
}

.tx-export__locked-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.tx-export__locked-description {
  margin: 0;
  color: var(--color-text-muted);
}

.tx-export__preview {
  width: 100%;
  display: grid;
  gap: var(--space-1);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
  filter: blur(2px);
  opacity: 0.7;
}

.tx-export__preview-row {
  height: 12px;
  border-radius: var(--radius-xs);
  background: linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-raised) 100%);
}
</style>
