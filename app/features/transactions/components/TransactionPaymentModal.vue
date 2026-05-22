<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NDatePicker, NModal } from "naive-ui";
import { CheckCircle2, X } from "lucide-vue-next";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import { formatCurrency } from "~/utils/currency";
import { parseCurrencyAmount } from "~/utils/currencyInput";

const props = defineProps<{
  visible: boolean;
  transaction: TransactionDto | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  confirm: [paidAt: string];
}>();

const selectedDate = ref<number | null>(null);
const showValidation = ref(false);

const isIncome = computed(() => props.transaction?.type === "income");
const modalTitle = computed(() => isIncome.value ? "Confirmar recebimento" : "Confirmar pagamento");
const actionLabel = computed(() => isIncome.value ? "Confirmar recebimento" : "Confirmar pagamento");
const dateLabel = computed(() => isIncome.value ? "Data efetiva do recebimento" : "Data efetiva do pagamento");
const helperText = computed(() =>
  isIncome.value
    ? "Informe a data efetiva em que o recebimento aconteceu."
    : "Informe a data efetiva em que o pagamento aconteceu.",
);

const formattedAmount = computed(() => {
  if (!props.transaction) { return ""; }
  return formatCurrency(parseCurrencyAmount(props.transaction.amount));
});

const formattedDueDate = computed(() => {
  if (!props.transaction?.due_date) { return "—"; }
  const [year, month, day] = props.transaction.due_date.split("-");
  return `${day}/${month}/${year}`;
});

const canConfirm = computed(() => Boolean(selectedDate.value) && !props.loading);

watch(
  () => [props.visible, props.transaction?.id],
  () => {
    selectedDate.value = null;
    showValidation.value = false;
  },
);

/**
 * Blocks future effective payment dates.
 *
 * @param timestamp Candidate date timestamp from the picker.
 * @returns True when the date should be disabled.
 */
function isDateDisabled(timestamp: number): boolean {
  const selected = new Date(timestamp);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  return selected.getTime() > todayEnd.getTime();
}

/**
 * Closes the modal through the v-model contract.
 */
function close(): void {
  emit("update:visible", false);
}

/**
 * Converts a selected calendar date into an ISO datetime at local midnight.
 *
 * @param timestamp Date picker timestamp.
 * @returns ISO datetime string accepted by the API.
 */
function dateToIso(timestamp: number): string {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();
}

/**
 * Emits the confirmed effective date when the form is valid.
 */
function handleConfirm(): void {
  if (!selectedDate.value) {
    showValidation.value = true;
    return;
  }
  emit("confirm", dateToIso(selectedDate.value));
}
</script>

<template>
  <NModal
    :show="visible"
    :mask-closable="false"
    preset="card"
    class="transaction-payment-modal"
    @update:show="emit('update:visible', $event)"
    @close="close"
  >
    <section v-if="transaction" class="transaction-payment">
      <header class="transaction-payment__header">
        <div class="transaction-payment__title">
          <span class="transaction-payment__icon" aria-hidden="true">
            <CheckCircle2 :size="20" />
          </span>
          <h3>{{ modalTitle }}</h3>
        </div>
        <NButton quaternary circle size="small" aria-label="Fechar" @click="close">
          <template #icon><X :size="18" /></template>
        </NButton>
      </header>

      <div class="transaction-payment__preview">
        <strong>{{ transaction.title }}</strong>
        <span>{{ formattedAmount }} · Vencimento: {{ formattedDueDate }}</span>
      </div>

      <p class="transaction-payment__helper">
        {{ helperText }} Esse campo é obrigatório para atualizar a transação como paga.
      </p>

      <label class="transaction-payment__field">
        <span>{{ dateLabel }}</span>
        <NDatePicker
          v-model:value="selectedDate"
          data-testid="transaction-payment-date"
          type="date"
          format="dd/MM/yyyy"
          :placeholder="dateLabel"
          :is-date-disabled="isDateDisabled"
          :disabled="loading"
          @update:value="showValidation = false"
        />
      </label>

      <p v-if="showValidation" class="transaction-payment__validation">
        Selecione a data antes de confirmar.
      </p>

      <footer class="transaction-payment__actions">
        <NButton :disabled="loading" @click="close">Cancelar</NButton>
        <NButton
          type="primary"
          :disabled="!canConfirm"
          :loading="loading"
          data-testid="transaction-payment-confirm"
          @click="handleConfirm"
        >
          {{ actionLabel }}
        </NButton>
      </footer>
    </section>
  </NModal>
</template>

<style scoped>
.transaction-payment {
  display: grid;
  gap: var(--space-3);
  width: min(100%, 520px);
}

.transaction-payment__header,
.transaction-payment__title,
.transaction-payment__actions {
  display: flex;
  align-items: center;
}

.transaction-payment__header {
  justify-content: space-between;
  gap: var(--space-2);
}

.transaction-payment__title {
  gap: var(--space-2);
}

.transaction-payment__title h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
}

.transaction-payment__icon {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full, 999px);
  color: var(--color-positive);
  background: color-mix(in srgb, var(--color-positive) 14%, transparent);
}

.transaction-payment__preview {
  display: grid;
  gap: 4px;
  padding: var(--space-3);
  border: 1px solid var(--color-outline-soft);
  border-radius: var(--radius-md);
  background: var(--color-bg-elevated);
}

.transaction-payment__preview strong {
  color: var(--color-text-primary);
}

.transaction-payment__preview span,
.transaction-payment__helper {
  color: var(--color-text-muted);
}

.transaction-payment__helper {
  margin: 0;
  line-height: 1.5;
}

.transaction-payment__field {
  display: grid;
  gap: var(--space-1);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}

.transaction-payment__validation {
  margin: calc(var(--space-2) * -1) 0 0;
  color: var(--color-negative);
  font-size: var(--font-size-xs);
}

.transaction-payment__actions {
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

:global(.transaction-payment-modal.n-card) {
  max-width: 560px;
  border-radius: var(--radius-lg);
}
</style>
