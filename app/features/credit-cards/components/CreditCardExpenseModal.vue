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
  tagId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  status: TransactionStatusDto;
  isRecurring: boolean;
  description: string;
}

const formRef = ref<FormInst | null>(null);
const form = reactive<ExpenseFormState>({
  title: "",
  amount: null,
  dueDate: null,
  tagId: null,
  accountId: null,
  creditCardId: null,
  status: "pending",
  isRecurring: false,
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
 * Today's local midnight timestamp for new expenses.
 *
 * @returns Timestamp in milliseconds.
 */
const todayTs = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

/** Resets the form to the "new card expense" defaults. */
const populateNewForm = (): void => {
  form.title = "";
  form.amount = null;
  form.dueDate = todayTs();
  form.tagId = null;
  form.accountId = null;
  form.creditCardId = props.presetCreditCardId;
  form.status = "pending";
  form.isRecurring = false;
  form.description = "";
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
  form.tagId = transaction.tag_id;
  form.accountId = transaction.account_id;
  form.creditCardId = transaction.credit_card_id ?? props.presetCreditCardId;
  form.status = transaction.status;
  form.isRecurring = transaction.is_recurring;
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

/** Closes the modal without persisting changes. */
const close = (): void => {
  emit("update:visible", false);
};

/**
 * Builds the canonical transaction payload for a card expense.
 *
 * @returns Payload for POST/PATCH /transactions.
 */
const buildPayload = (): CreateTransactionPayload => ({
  title: form.title.trim(),
  amount: serializeCurrencyAmount(form.amount),
  type: "expense",
  due_date: form.dueDate ? tsToDate(form.dueDate) : "",
  status: form.status,
  tag_id: form.tagId,
  account_id: form.accountId,
  credit_card_id: form.creditCardId,
  is_recurring: form.isRecurring,
  ...(form.description.trim() ? { description: form.description.trim() } : {}),
});

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

        <NFormItem label="Data*" path="dueDate">
          <NDatePicker
            v-model:value="form.dueDate"
            type="date"
            format="dd/MM/yyyy"
            style="width: 100%"
          />
        </NFormItem>
      </div>

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

      <NFormItem label="Recorrente?" path="isRecurring">
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
