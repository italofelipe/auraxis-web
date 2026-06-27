<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  NAlert,
  NButton,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  type FormInst,
  type FormRules,
  type SelectOption,
} from "naive-ui";

import UiIcon from "~/components/ui/UiIcon/UiIcon.vue";
import UiMoneyInput from "~/components/ui/UiMoneyInput/UiMoneyInput.vue";
import type {
  CreateTransactionPayload,
  TransactionDto,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useUpdateTransactionMutation } from "~/features/transactions/queries/use-update-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";
import { dueDateForBillMonth } from "~/features/credit-cards/model/bill-competence";
import {
  type DistributionChip,
  buildDistribution,
} from "~/features/credit-cards/model/installment-plan";
import { currentMonthKey } from "~/features/credit-cards/composables/useCreditCardsViewState";
import { monthKeyLabel } from "~/features/credit-cards/utils/transaction-billing";
import { resolveCardTheme } from "~/features/credit-cards/utils/card-brand-theme";
import {
  parseCurrencyAmount,
  serializeCurrencyAmount,
} from "~/utils/currencyInput";

const props = defineProps<{
  /** Controls the central card-expense modal. */
  readonly visible: boolean;
  /** Existing transaction in edit mode; null means "Nova despesa". */
  readonly transaction: TransactionDto | null;
  /** Credit card selected in the invoice, preselected for new expenses. */
  readonly presetCreditCardId: string | null;
  /** Navigated bill month (YYYY-MM); anchors new expenses. Defaults to current month. */
  readonly month?: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [mode: "created" | "updated"];
  duplicate: [transaction: TransactionDto];
  remove: [transaction: TransactionDto];
}>();

interface ExpenseFormState {
  title: string;
  amount: number | null;
  dueDate: number | null;
  /** Bill competence month (timestamp of month start) — drives `dueDate` on create. */
  billMonthTs: number | null;
  tagId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  status: TransactionStatusDto;
  isRecurring: boolean;
  isInstallment: boolean;
  installments: number;
  description: string;
}

const formRef = ref<FormInst | null>(null);
const form = reactive<ExpenseFormState>({
  title: "",
  amount: null,
  dueDate: null,
  billMonthTs: null,
  tagId: null,
  accountId: null,
  creditCardId: null,
  status: "pending",
  isRecurring: false,
  isInstallment: false,
  installments: 2,
  description: "",
});

const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();
const { data: creditCards } = useCreditCardsQuery();
const createMutation = useCreateTransactionMutation();
const updateMutation = useUpdateTransactionMutation();

const tagOptions = computed<SelectOption[]>(() =>
  (tags.value ?? []).map((tag) => ({ label: tag.name, value: tag.id })),
);

const accountOptions = computed<SelectOption[]>(() =>
  (accounts.value ?? []).map((account) => ({ label: account.name, value: account.id })),
);

const creditCardOptions = computed<SelectOption[]>(() =>
  (creditCards.value ?? []).map((card) => ({ label: card.name, value: card.id })),
);

const statusOptions: SelectOption[] = [
  { label: "Pendente", value: "pending" },
  { label: "Pago", value: "paid" },
  { label: "Cancelado", value: "cancelled" },
  { label: "Postergado", value: "postponed" },
  { label: "Vencido", value: "overdue" },
];

/** Opções de número de parcelas (2x a 24x). */
const installmentOptions: SelectOption[] = Array.from({ length: 23 }, (_unused, index) => ({
  label: `${index + 2}x`,
  value: index + 2,
}));

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formata um valor numérico como moeda BRL.
 *
 * @param value Valor a formatar.
 * @returns String formatada (ex.: "R$ 1.234,56").
 */
const formatCurrency = (value: number): string => currencyFormatter.format(value);

const rules: FormRules = {
  title: [{ required: true, message: "Informe o título da despesa.", trigger: "blur" }],
  amount: [
    {
      required: true,
      type: "number",
      message: "Informe o valor da despesa.",
      trigger: ["blur", "change"],
    },
  ],
  dueDate: [
    {
      required: true,
      type: "number",
      message: "Informe a data da despesa.",
      trigger: "change",
    },
  ],
};

const selectedCard = computed<CreditCardDto | null>(
  () => (creditCards.value ?? []).find((entry) => entry.id === form.creditCardId) ?? null,
);

const selectedCardName = computed<string>(() => {
  const card = selectedCard.value;
  return card?.name ?? "Cartão";
});

const selectedCardColor = computed<string>(() =>
  selectedCard.value ? resolveCardTheme(selectedCard.value).color : "var(--color-brand-500)",
);

/** Mês de competência (YYYY-MM) selecionado no modo criação. */
const billMonthKey = computed<string>(() =>
  form.billMonthTs !== null ? tsToMonthKey(form.billMonthTs) : props.month ?? currentMonthKey(),
);

/** Rótulo extenso da fatura de competência ("maio de 2026"). */
const billMonthLabel = computed<string>(() => monthKeyLabel(billMonthKey.value));

/** Distribuição da despesa nas faturas (à vista ou parcelas), para preview. */
const distributionChips = computed<DistributionChip[]>(() =>
  buildDistribution({
    mode: form.isInstallment ? "parcelado" : "avista",
    total: form.amount ?? 0,
    downPayment: 0,
    hasDownPayment: false,
    installments: form.installments,
    startBillMonth: billMonthKey.value,
  }),
);

const modalTitle = computed<string>(() =>
  props.transaction ? "Detalhes da despesa" : "Nova despesa",
);

const subtitle = computed<string>(() =>
  props.transaction
    ? selectedCardName.value
    : `Lançar no ${selectedCardName.value}`,
);

const primaryLabel = computed<string>(() =>
  props.transaction ? "Salvar alterações" : "Lançar despesa",
);

const isSubmitting = computed<boolean>(() =>
  createMutation.isPending.value || updateMutation.isPending.value,
);

/**
 * Converts a YYYY-MM-DD string to a local DatePicker timestamp.
 *
 * @param isoDate Date-only ISO string.
 * @returns Timestamp in milliseconds.
 */
const dateToTs = (isoDate: string | null | undefined): number | null => {
  if (!isoDate) {
    return null;
  }
  const timestamp = new Date(`${isoDate}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

/**
 * Converts a local DatePicker timestamp to YYYY-MM-DD.
 *
 * @param timestamp Milliseconds timestamp.
 * @returns Date-only ISO string.
 */
const tsToDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

/**
 * Converts a YYYY-MM key to the local timestamp of the month's first day.
 *
 * @param monthKey Month key (YYYY-MM).
 * @returns Timestamp in milliseconds.
 */
const monthKeyToTs = (monthKey: string): number => {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1).getTime();
};

/**
 * Converts a timestamp to its YYYY-MM month key (local).
 *
 * @param timestamp Milliseconds timestamp.
 * @returns Month key (YYYY-MM).
 */
const tsToMonthKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Derives `form.dueDate` from the selected competence month + card cycle, so the
 * new expense lands in the navigated month's bill (and installments cascade from
 * there). No-op when no competence month is set.
 */
const deriveCreateDueDate = (): void => {
  if (form.billMonthTs === null) {
    return;
  }
  const monthKey = tsToMonthKey(form.billMonthTs);
  form.dueDate = dateToTs(dueDateForBillMonth(selectedCard.value, monthKey));
};

/** Resets the form to the "new card expense" defaults. */
const populateNewForm = (): void => {
  form.title = "";
  form.amount = null;
  form.billMonthTs = monthKeyToTs(props.month ?? currentMonthKey());
  form.tagId = null;
  form.accountId = null;
  form.creditCardId = props.presetCreditCardId;
  form.status = "pending";
  form.isRecurring = false;
  form.isInstallment = false;
  form.installments = 2;
  form.description = "";
  deriveCreateDueDate();
};

/**
 * Populates the form from an existing transaction.
 *
 * @param transaction Source transaction.
 */
const populateEditForm = (transaction: TransactionDto): void => {
  form.title = transaction.title;
  form.amount = parseCurrencyAmount(transaction.amount);
  form.dueDate = dateToTs(transaction.due_date);
  form.billMonthTs = null;
  form.tagId = transaction.tag_id;
  form.accountId = transaction.account_id;
  form.creditCardId = transaction.credit_card_id ?? props.presetCreditCardId;
  form.status = transaction.status;
  form.isRecurring = transaction.is_recurring;
  form.isInstallment = false;
  form.installments = 2;
  form.description = transaction.description ?? "";
};

watch(
  () => [props.visible, props.transaction, props.presetCreditCardId] as const,
  ([visible, transaction]) => {
    if (!visible) {
      return;
    }
    if (transaction) {
      populateEditForm(transaction);
      return;
    }
    populateNewForm();
  },
  { immediate: true },
);

// No modo criação, re-deriva a data sempre que a competência ou o cartão mudam,
// mantendo a despesa ancorada à fatura do mês escolhido.
watch(
  () => [form.billMonthTs, form.creditCardId] as const,
  () => {
    if (props.visible && !props.transaction) {
      deriveCreateDueDate();
    }
  },
);

/** Closes the modal without persisting changes. */
const close = (): void => {
  emit("update:visible", false);
};

/**
 * Builds the canonical transaction payload for a card expense.
 *
 * @returns Payload for POST/PATCH /transactions.
 */
const buildPayload = (): CreateTransactionPayload => {
  const base = {
    title: form.title.trim(),
    amount: serializeCurrencyAmount(form.amount),
    type: "expense" as const,
    due_date: form.dueDate ? tsToDate(form.dueDate) : "",
    status: form.status,
    tag_id: form.tagId,
    account_id: form.accountId,
    credit_card_id: form.creditCardId,
    ...(form.description.trim() ? { description: form.description.trim() } : {}),
  };

  // Criação parcelada: o backend gera N transações (+1 mês cada, valor dividido,
  // mesmo installment_group_id) a partir da due_date da fatura de competência.
  // Parcelado e recorrente são mutuamente exclusivos no backend.
  if (!props.transaction && form.isInstallment && form.installments >= 2) {
    return {
      ...base,
      is_installment: true,
      installment_count: Math.floor(form.installments),
    };
  }

  return { ...base, is_recurring: form.isRecurring };
};

/**
 * Validates the required fields before delegating to the API mutation.
 */
const submit = async (): Promise<void> => {
  try {
    await formRef.value?.validate?.();
  } catch {
    return;
  }

  if (!form.title.trim() || form.amount === null || form.amount <= 0 || !form.dueDate) {
    return;
  }

  if (props.transaction) {
    updateMutation.mutate(
      {
        id: props.transaction.id,
        payload: buildPayload(),
      },
      {
        onSuccess: () => {
          emit("saved", "updated");
          close();
        },
      },
    );
    return;
  }

  createMutation.mutate(buildPayload(), {
    onSuccess: () => {
      emit("saved", "created");
      close();
    },
  });
};
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="modalTitle"
    class="cc-expense-modal"
    :style="{ maxWidth: '560px', width: '100%' }"
    @update:show="(value) => { if (!value) close(); }"
  >
    <div class="cc-expense-modal__subtitle">
      <span class="cc-expense-modal__swatch" :style="{ background: selectedCardColor }" />
      {{ subtitle }}
    </div>

    <NAlert
      v-if="createMutation.isError.value || updateMutation.isError.value"
      type="error"
      title="Não foi possível salvar a despesa."
      class="cc-expense-modal__alert"
    />

    <div class="cc-expense-modal__sync-banner">
      <UiIcon name="transactions" :size="16" />
      <p>
        <strong>Vinculada às Transações.</strong>
        Esta despesa também aparece em Transações, atrelada ao {{ selectedCardName }}.
        Qualquer alteração aqui é refletida nos dois lugares.
      </p>
    </div>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="Título*" path="title">
        <NInput
          v-model:value="form.title"
          placeholder="Ex: Notebook Dell"
          data-testid="cc-expense-title"
        />
      </NFormItem>

      <div class="cc-expense-modal__row">
        <NFormItem label="Valor*" path="amount">
          <UiMoneyInput
            v-model:value="form.amount"
            placeholder="0,00"
            :min="0.01"
          />
        </NFormItem>

        <NFormItem v-if="props.transaction" label="Data*" path="dueDate">
          <NDatePicker
            v-model:value="form.dueDate"
            type="date"
            format="dd/MM/yyyy"
            style="width: 100%"
          />
        </NFormItem>
        <NFormItem v-else label="Mês da fatura*" path="dueDate">
          <NDatePicker
            v-model:value="form.billMonthTs"
            type="month"
            format="MMM/yyyy"
            style="width: 100%"
            data-testid="cc-expense-bill-month"
          />
        </NFormItem>
      </div>

      <p v-if="!props.transaction" class="cc-expense-modal__hint">
        Entra na fatura de <strong>{{ billMonthLabel }}</strong>.
      </p>

      <div class="cc-expense-modal__row">
        <NFormItem label="Categoria" path="tagId">
          <NSelect v-model:value="form.tagId" :options="tagOptions" clearable />
        </NFormItem>

        <NFormItem label="Status" path="status">
          <NSelect v-model:value="form.status" :options="statusOptions" />
        </NFormItem>
      </div>

      <NFormItem label="Conta" path="accountId">
        <NSelect v-model:value="form.accountId" :options="accountOptions" clearable />
      </NFormItem>

      <NFormItem label="Cartão de crédito" path="creditCardId">
        <NSelect v-model:value="form.creditCardId" :options="creditCardOptions" clearable />
      </NFormItem>

      <template v-if="!props.transaction">
        <NFormItem label="Parcelar?" path="isInstallment">
          <div class="cc-expense-modal__switch-row">
            <div>
              <strong>Dividir em parcelas</strong>
              <span>Distribui o total nas próximas faturas, a partir do mês da fatura</span>
            </div>
            <NSwitch
              v-model:value="form.isInstallment"
              data-testid="cc-expense-installment-toggle"
            />
          </div>
        </NFormItem>

        <NFormItem v-if="form.isInstallment" label="Parcelas" path="installments">
          <NSelect
            v-model:value="form.installments"
            :options="installmentOptions"
            data-testid="cc-expense-installments"
          />
        </NFormItem>

        <div v-if="form.isInstallment" class="cc-expense-modal__distribution">
          <span class="cc-expense-modal__distribution-label">Distribuição nas faturas</span>
          <div class="cc-expense-modal__chips">
            <span
              v-for="chip in distributionChips"
              :key="chip.key"
              class="cc-expense-modal__chip"
            >
              <span class="cc-expense-modal__chip-label">{{ chip.label }}</span>
              <span class="cc-expense-modal__chip-sub">{{ chip.sub }}</span>
              <span class="cc-expense-modal__chip-value">{{ formatCurrency(chip.value) }}</span>
            </span>
          </div>
        </div>
      </template>

      <NFormItem
        v-if="props.transaction || !form.isInstallment"
        label="Recorrente?"
        path="isRecurring"
      >
        <div class="cc-expense-modal__switch-row">
          <div>
            <strong>Repete esta despesa</strong>
            <span>Repete esta despesa nas próximas faturas</span>
          </div>
          <NSwitch v-model:value="form.isRecurring" />
        </div>
      </NFormItem>

      <NFormItem label="Observações" path="description">
        <NInput
          v-model:value="form.description"
          type="textarea"
          placeholder="Notas sobre esta despesa"
          :rows="3"
        />
      </NFormItem>
    </NForm>

    <template #footer>
      <div class="cc-expense-modal__footer">
        <div class="cc-expense-modal__footer-left">
          <NButton
            v-if="props.transaction"
            :disabled="isSubmitting"
            data-testid="cc-expense-modal-duplicate"
            @click="emit('duplicate', props.transaction)"
          >
            <template #icon><UiIcon name="copy" :size="15" /></template>
            Duplicar
          </NButton>
          <NButton
            v-if="props.transaction"
            type="error"
            :disabled="isSubmitting"
            data-testid="cc-expense-modal-remove"
            @click="emit('remove', props.transaction)"
          >
            <template #icon><UiIcon name="trash" :size="15" /></template>
            Remover
          </NButton>
        </div>
        <NSpace>
          <NButton :disabled="isSubmitting" @click="close">Cancelar</NButton>
          <NButton
            type="primary"
            :loading="isSubmitting"
            data-testid="cc-expense-modal-submit"
            @click="submit"
          >
            {{ primaryLabel }}
          </NButton>
        </NSpace>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.cc-expense-modal {
  color: var(--color-text-primary);
}
.cc-expense-modal__subtitle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: -8px 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.cc-expense-modal__swatch {
  width: 20px;
  height: 14px;
  border-radius: var(--radius-xs);
}
.cc-expense-modal__alert {
  margin-bottom: var(--space-2);
}
.cc-expense-modal__sync-banner {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-2);
  margin-bottom: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-brand-500) 24%, white);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-brand-500) 10%, white);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
.cc-expense-modal__sync-banner p {
  margin: 0;
}
.cc-expense-modal__sync-banner strong {
  color: var(--color-text-primary);
}
.cc-expense-modal__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
}
.cc-expense-modal__hint {
  margin: calc(-1 * var(--space-1)) 0 var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.cc-expense-modal__hint strong {
  color: var(--color-text-primary);
}
.cc-expense-modal__distribution {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}
.cc-expense-modal__distribution-label {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.cc-expense-modal__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}
.cc-expense-modal__chip {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-2, color-mix(in srgb, var(--color-brand-500) 6%, white));
  min-width: 72px;
}
.cc-expense-modal__chip-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}
.cc-expense-modal__chip-sub {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
.cc-expense-modal__chip-value {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
.cc-expense-modal__switch-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.cc-expense-modal__switch-row strong,
.cc-expense-modal__switch-row span {
  display: block;
}
.cc-expense-modal__switch-row span {
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}
.cc-expense-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.cc-expense-modal__footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
@media (max-width: 640px) {
  .cc-expense-modal__row,
  .cc-expense-modal__footer {
    grid-template-columns: 1fr;
    display: grid;
  }
  .cc-expense-modal__footer-left {
    justify-content: stretch;
  }
}
</style>
