<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NDatePicker,
  NSwitch,
  NButton,
  NSpace,
  NAlert,
  type FormInst,
  type FormRules,
  type SelectOption,
} from "naive-ui";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";
import {
  type UpdateTransactionArgs,
  useUpdateTransactionMutation,
} from "~/features/transactions/queries/use-update-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";

const { t } = useI18n();

// ── Props / emits ──────────────────────────────────────────────────────────────

const props = defineProps<{
  /** Whether the modal is open. */
  readonly visible: boolean;
  /** Transaction record to edit. May be null while closed. */
  readonly transaction: TransactionDto | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  /** Emitted after a successful update. */
  success: [];
}>();

// ── External data ──────────────────────────────────────────────────────────────

const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();
const { data: creditCards } = useCreditCardsQuery();

const tagOptions = computed((): SelectOption[] =>
  (tags.value ?? []).map((tg: { id: string; name: string }) => ({ label: tg.name, value: tg.id })),
);

const accountOptions = computed((): SelectOption[] =>
  (accounts.value ?? []).map((ac: { id: string; name: string }) => ({ label: ac.name, value: ac.id })),
);

const creditCardOptions = computed((): SelectOption[] =>
  (creditCards.value ?? []).map((cc: { id: string; name: string }) => ({ label: cc.name, value: cc.id })),
);

// ── Form state ─────────────────────────────────────────────────────────────────

const formRef = ref<FormInst | null>(null);

const form = reactive({
  title: "",
  amount: null as number | null,
  due_date: null as number | null,
  tag_id: null as string | null,
  account_id: null as string | null,
  credit_card_id: null as string | null,
  status: "pending" as TransactionDto["status"],
  description: "",
  is_recurring: false,
  end_date: null as number | null,
});

// ── Computed field visibility ──────────────────────────────────────────────────

/** Show credit card field only for expense transactions. */
const showCreditCard = computed(
  (): boolean => props.transaction?.type === "expense",
);

/** Show end date field only when recurring is on. */
const showEndDate = computed((): boolean => form.is_recurring);

// ── Status options ─────────────────────────────────────────────────────────────

const statusOptions = computed((): SelectOption[] => {
  const base: SelectOption[] = [
    { label: t("transaction.status.pending"), value: "pending" },
    { label: t("transaction.status.paid"), value: "paid" },
    { label: t("transaction.status.cancelled"), value: "cancelled" },
    { label: t("transaction.status.postponed"), value: "postponed" },
    { label: t("transaction.status.overdue"), value: "overdue" },
  ];
  return base;
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Converts a Unix timestamp (ms) produced by NDatePicker to YYYY-MM-DD.
 *
 * @param ts Unix timestamp in milliseconds.
 * @returns ISO 8601 date string.
 */
const tsToDate = (ts: number): string => {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Converts a YYYY-MM-DD string to a NDatePicker Unix timestamp (ms).
 *
 * @param isoDate ISO 8601 date string.
 * @returns Unix timestamp in milliseconds, or null if the date is invalid.
 */
const dateToTs = (isoDate: string | null | undefined): number | null => {
  if (!isoDate) { return null; }
  const ts = new Date(`${isoDate}T00:00:00`).getTime();
  return Number.isNaN(ts) ? null : ts;
};

// ── Populate form from transaction ─────────────────────────────────────────────

/**
 * Populates the form fields from the given TransactionDto.
 *
 * @param tx Source transaction record.
 */
const populateForm = (tx: TransactionDto): void => {
  form.title = tx.title;
  form.amount = parseFloat(tx.amount);
  form.due_date = dateToTs(tx.due_date);
  form.tag_id = tx.tag_id;
  form.account_id = tx.account_id;
  form.credit_card_id = tx.credit_card_id;
  form.status = tx.status;
  form.description = tx.description ?? "";
  form.is_recurring = tx.is_recurring;
  form.end_date = dateToTs(tx.end_date);
};

// Re-populate whenever the modal opens with a new transaction.
watch(
  () => props.transaction,
  (tx) => {
    if (tx) { populateForm(tx); }
  },
  { immediate: true },
);

// ── Watchers ───────────────────────────────────────────────────────────────────

/** Ensure end_date is cleared when recurring is toggled off. */
watch(
  () => form.is_recurring,
  (on) => {
    if (!on) { form.end_date = null; }
  },
);

// ── Validation rules ───────────────────────────────────────────────────────────

const rules = computed((): FormRules => ({
  title: [
    {
      required: true,
      message: t("transaction.form.required.title"),
      trigger: "blur",
    },
  ],
  amount: [
    {
      required: true,
      type: "number",
      message: t("transaction.form.required.amount"),
      trigger: ["blur", "change"],
    },
  ],
  due_date: [
    {
      required: true,
      type: "number",
      message: t("transaction.form.required.dueDate"),
      trigger: "change",
    },
  ],
}));

// ── Mutation ───────────────────────────────────────────────────────────────────

const mutation = useUpdateTransactionMutation();

/**
 * Validates and submits the edited transaction.
 *
 * Builds a partial update payload containing only the fields that changed
 * from the original transaction to minimise network traffic.
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  if (!props.transaction) { return; }

  const args: UpdateTransactionArgs = {
    id: props.transaction.id,
    payload: {
      title: form.title,
      amount: String(form.amount ?? 0),
      due_date: form.due_date ? tsToDate(form.due_date) : undefined,
      status: form.status,
      tag_id: form.tag_id ?? null,
      account_id: form.account_id ?? null,
      credit_card_id: form.credit_card_id ?? null,
      description: form.description.trim() || null,
      is_recurring: form.is_recurring,
      ...(form.is_recurring && form.end_date
        ? { end_date: tsToDate(form.end_date) }
        : { end_date: null }),
    },
  };

  mutation.mutate(args, {
    onSuccess: () => {
      emit("success");
      emit("update:visible", false);
    },
  });
};

/** Closes the modal without saving. */
const handleClose = (): void => {
  emit("update:visible", false);
};
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="$t('transaction.edit.title')"
    class="edit-transaction-modal"
    :style="{ maxWidth: '520px', width: '100%' }"
    @update:show="handleClose"
  >
    <!-- Mutation error alert -->
    <NAlert
      v-if="mutation.isError.value"
      type="error"
      :title="$t('transaction.form.errorTitle')"
      style="margin-bottom: 16px;"
    >
      {{ mutation.error.value?.message ?? $t('transaction.form.errorFallback') }}
    </NAlert>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">

      <!-- Title -->
      <NFormItem :label="$t('transaction.form.title.label')" path="title">
        <NInput
          v-model:value="form.title"
          :placeholder="$t('transaction.form.title.placeholder')"
        />
      </NFormItem>

      <!-- Amount -->
      <NFormItem :label="$t('transaction.form.amount.label')" path="amount">
        <NInputNumber
          v-model:value="form.amount"
          :placeholder="$t('transaction.form.amount.placeholder')"
          :min="0.01"
          :precision="2"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Due date -->
      <NFormItem :label="$t('transaction.form.dueDate.label')" path="due_date">
        <NDatePicker
          v-model:value="form.due_date"
          type="date"
          format="dd/MM/yyyy"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Category / tag -->
      <NFormItem :label="$t('transaction.form.tag.label')" path="tag_id">
        <NSelect
          v-model:value="form.tag_id"
          :options="tagOptions"
          :placeholder="$t('transaction.form.tag.placeholder')"
          clearable
        />
      </NFormItem>

      <!-- Account -->
      <NFormItem :label="$t('transaction.form.account.label')" path="account_id">
        <NSelect
          v-model:value="form.account_id"
          :options="accountOptions"
          :placeholder="$t('transaction.form.account.placeholder')"
          clearable
        />
      </NFormItem>

      <!-- Credit card (expense only) -->
      <NFormItem
        v-if="showCreditCard"
        :label="$t('transaction.form.creditCard.label')"
        path="credit_card_id"
      >
        <NSelect
          v-model:value="form.credit_card_id"
          :options="creditCardOptions"
          :placeholder="$t('transaction.form.creditCard.placeholder')"
          clearable
        />
      </NFormItem>

      <!-- Status -->
      <NFormItem :label="$t('transaction.form.status.label')" path="status">
        <NSelect v-model:value="form.status" :options="statusOptions" />
      </NFormItem>

      <!-- Recurring toggle -->
      <NFormItem :label="$t('transaction.form.recurring.label')" path="is_recurring">
        <NSwitch v-model:value="form.is_recurring" />
      </NFormItem>

      <!-- Recurring end date -->
      <NFormItem
        v-if="showEndDate"
        :label="$t('transaction.form.endDate.label')"
        path="end_date"
      >
        <NDatePicker
          v-model:value="form.end_date"
          type="date"
          format="dd/MM/yyyy"
          style="width: 100%"
          clearable
        />
      </NFormItem>

      <!-- Description / notes -->
      <NFormItem :label="$t('transaction.form.description.label')" path="description">
        <NInput
          v-model:value="form.description"
          type="textarea"
          :placeholder="$t('transaction.form.description.placeholder')"
          :rows="2"
        />
      </NFormItem>

    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="mutation.isPending.value" @click="handleClose">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="mutation.isPending.value"
          @click="handleSubmit"
        >
          {{ $t('common.save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.edit-transaction-modal {
  color: var(--color-text-primary);
}
</style>
