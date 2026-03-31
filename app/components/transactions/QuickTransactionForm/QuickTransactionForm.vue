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
import type { QuickTransactionFormProps } from "./QuickTransactionForm.types";
import type {
  CreateTransactionPayload,
  TransactionStatusDto,
} from "~/features/transactions/contracts/transaction.dto";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";

const { t } = useI18n();

const props = defineProps<QuickTransactionFormProps>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// ── External data ──────────────────────────────────────────────────────────────

const { data: tags } = useTagsQuery();
const { data: accounts } = useAccountsQuery();
const { data: creditCards } = useCreditCardsQuery();

const tagOptions = computed((): SelectOption[] =>
  (tags.value ?? []).map((t) => ({ label: t.name, value: t.id })),
);

const accountOptions = computed((): SelectOption[] =>
  (accounts.value ?? []).map((a) => ({ label: a.name, value: a.id })),
);

const creditCardOptions = computed((): SelectOption[] =>
  (creditCards.value ?? []).map((c) => ({ label: c.name, value: c.id })),
);

// ── Form state ─────────────────────────────────────────────────────────────────

const formRef = ref<FormInst | null>(null);

const form = reactive({
  title: "",
  amount: null as number | null,
  due_date: null as number | null,   // NDatePicker timestamp (ms)
  tag_id: null as string | null,
  account_id: null as string | null,
  credit_card_id: null as string | null,
  status: "pending" as TransactionStatusDto,
  description: "",
  is_installment: false,
  installment_count: null as number | null,
  is_recurring: false,
  end_date: null as number | null,
});

// ── Computed field visibility ──────────────────────────────────────────────────

/** Credit card field is only shown for expense forms. */
const showCreditCard = computed((): boolean => props.type === "expense");

/** Installment toggle is only for expense. Income has no installment concept. */
const showInstallment = computed((): boolean => props.type === "expense");

/** Recurring toggle is always shown, but disabled while installment is active. */
const recurringDisabled = computed((): boolean => form.is_installment);

/** Installment count field only shown when the toggle is on. */
const showInstallmentCount = computed((): boolean => form.is_installment);

/** End date only shown when recurring is on. */
const showEndDate = computed((): boolean => form.is_recurring);

// ── Status options ─────────────────────────────────────────────────────────────

const statusOptions = computed((): SelectOption[] => {
  if (props.type === "income") {
    return [
      { label: t("transaction.status.pending"), value: "pending" },
      { label: t("transaction.status.paid"), value: "paid" },
    ];
  }
  return [
    { label: t("transaction.status.pending"), value: "pending" },
    { label: t("transaction.status.paid"), value: "paid" },
    { label: t("transaction.status.postponed"), value: "postponed" },
  ];
});

// ── Watchers ───────────────────────────────────────────────────────────────────

/** When installment is toggled on, disable recurring and vice-versa. */
watch(
  () => form.is_installment,
  (on) => {
    if (on) { form.is_recurring = false; }
  },
);

watch(
  () => form.is_recurring,
  (on) => {
    if (on) { form.is_installment = false; }
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
  installment_count: showInstallmentCount.value
    ? [
        {
          required: true,
          type: "number",
          message: t("transaction.form.required.installmentCount"),
          trigger: ["blur", "change"],
        },
      ]
    : [],
}));

// ── Mutation ───────────────────────────────────────────────────────────────────

const mutation = useCreateTransactionMutation();

/**
 * Converts a Unix timestamp (ms) produced by NDatePicker to a YYYY-MM-DD string.
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
 * Builds the optional installment fields when the toggle is active.
 *
 * @returns Partial payload fields for installment mode, or empty object.
 */
const buildInstallmentFields = (): Partial<CreateTransactionPayload> => {
  if (!showInstallment.value || !form.is_installment) { return {}; }
  return { is_installment: true, installment_count: form.installment_count ?? 2 };
};

/**
 * Builds the optional recurrence fields when the toggle is active.
 *
 * The backend requires both `start_date` and `end_date` (YYYY-MM-DD) when
 * `is_recurring` is true. `start_date` defaults to the transaction's due_date.
 *
 * @returns Partial payload fields for recurring mode, or empty object.
 */
const buildRecurringFields = (): Partial<CreateTransactionPayload> => {
  if (!form.is_recurring) { return {}; }
  return {
    is_recurring: true,
    start_date: form.due_date ? tsToDate(form.due_date) : undefined,
    ...(form.end_date ? { end_date: tsToDate(form.end_date) } : {}),
  };
};

/**
 * Assembles the full CreateTransactionPayload from the current form state.
 *
 * @returns Typed payload ready for the mutation.
 */
const buildPayload = (): CreateTransactionPayload => ({
  title: form.title,
  amount: String(form.amount ?? 0),
  type: props.type,
  due_date: form.due_date ? tsToDate(form.due_date) : "",
  status: form.status,
  tag_id: form.tag_id ?? null,
  account_id: form.account_id ?? null,
  ...(form.description.trim() ? { description: form.description } : {}),
  ...buildInstallmentFields(),
  ...buildRecurringFields(),
  ...(showCreditCard.value && form.credit_card_id
    ? { credit_card_id: form.credit_card_id }
    : {}),
});

/**
 * Validates and submits the form.
 * Delegates payload building to {@link buildPayload}.
 */
const handleSubmit = async (): Promise<void> => {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  mutation.mutate(buildPayload(), {
    onSuccess: () => {
      emit("success");
      emit("update:visible", false);
      resetForm();
    },
  });
};

/** Resets all form fields to their default values. */
const resetForm = (): void => {
  form.title = "";
  form.amount = null;
  form.due_date = null;
  form.tag_id = null;
  form.account_id = null;
  form.credit_card_id = null;
  form.status = "pending" as TransactionStatusDto;
  form.description = "";
  form.is_installment = false;
  form.installment_count = null;
  form.is_recurring = false;
  form.end_date = null;
};

/** Closes the modal without submitting. */
const handleClose = (): void => {
  emit("update:visible", false);
  resetForm();
};

// ── Computed title / colour ────────────────────────────────────────────────────

const modalTitle = computed((): string =>
  props.type === "income"
    ? t("transaction.form.title.income")
    : t("transaction.form.title.expense"),
);

const submitButtonType = computed(() =>
  props.type === "income" ? "success" : "error",
);
</script>

<template>
  <NModal
    :show="props.visible"
    preset="card"
    :title="modalTitle"
    class="quick-transaction-form-modal"
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
        <template v-if="tagOptions.length === 0">
          <NuxtLink
            to="/settings/tags"
            class="quick-transaction-form__settings-link"
          >
            {{ $t('transaction.form.tag.createHint') }}
          </NuxtLink>
        </template>
      </NFormItem>

      <!-- Account -->
      <NFormItem :label="$t('transaction.form.account.label')" path="account_id">
        <NSelect
          v-model:value="form.account_id"
          :options="accountOptions"
          :placeholder="$t('transaction.form.account.placeholder')"
          clearable
        />
        <template v-if="accountOptions.length === 0">
          <NuxtLink
            to="/settings/accounts"
            class="quick-transaction-form__settings-link"
          >
            {{ $t('transaction.form.account.createHint') }}
          </NuxtLink>
        </template>
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
        <NSelect
          v-model:value="form.status"
          :options="statusOptions"
        />
      </NFormItem>

      <!-- Installment toggle (expense only) -->
      <NFormItem v-if="showInstallment" :label="$t('transaction.form.installment.label')" path="is_installment">
        <NSwitch v-model:value="form.is_installment" />
      </NFormItem>

      <!-- Installment count -->
      <NFormItem
        v-if="showInstallmentCount"
        :label="$t('transaction.form.installmentCount.label')"
        path="installment_count"
      >
        <NInputNumber
          v-model:value="form.installment_count"
          :placeholder="$t('transaction.form.installmentCount.placeholder')"
          :min="2"
          :max="60"
          style="width: 100%"
        />
      </NFormItem>

      <!-- Recurring toggle -->
      <NFormItem :label="$t('transaction.form.recurring.label')" path="is_recurring">
        <NSwitch
          v-model:value="form.is_recurring"
          :disabled="recurringDisabled"
        />
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
          :type="submitButtonType"
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
.quick-transaction-form-modal {
  color: var(--color-text-primary);
}

.quick-transaction-form__settings-link {
  display: inline-block;
  margin-top: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-brand-500);
  text-decoration: none;
}

.quick-transaction-form__settings-link:hover {
  text-decoration: underline;
}
</style>
