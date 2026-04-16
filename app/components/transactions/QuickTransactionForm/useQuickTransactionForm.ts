import {
  computed,
  provide,
  reactive,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type Ref,
} from "vue";
import type { FormInst, FormRules, SelectOption } from "naive-ui";

import type {
  CreateTransactionPayload,
  TransactionStatusDto,
  TransactionTypeDto,
} from "~/features/transactions/contracts/transaction.dto";
import { useAccountsQuery } from "~/features/accounts/queries/use-accounts-query";
import { useCreditCardsQuery } from "~/features/credit-cards/queries/use-credit-cards-query";
import { useCreateTransactionMutation } from "~/features/transactions/queries/use-create-transaction-mutation";
import { useTagsQuery } from "~/features/tags/queries/use-tags-query";

export const QUICK_TRANSACTION_FORM_KEY: InjectionKey<QuickTransactionFormState> =
  Symbol("QuickTransactionForm");

export interface QuickTransactionFormState {
  title: string;
  amount: number | null;
  due_date: number | null;
  tag_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  status: TransactionStatusDto;
  description: string;
  is_installment: boolean;
  installment_count: number | null;
  is_recurring: boolean;
  end_date: number | null;
}

/**
 * Converts a millisecond timestamp from NDatePicker to a YYYY-MM-DD string.
 *
 * @param ts Unix timestamp in milliseconds.
 * @returns ISO 8601 date (YYYY-MM-DD).
 */
function tsToDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Produces a fresh QuickTransactionFormState populated with defaults.
 *
 * @returns A plain object that can seed a reactive form.
 */
function createDefaultFormState(): QuickTransactionFormState {
  return {
    title: "",
    amount: null,
    due_date: null,
    tag_id: null,
    account_id: null,
    credit_card_id: null,
    status: "pending" as TransactionStatusDto,
    description: "",
    is_installment: false,
    installment_count: null,
    is_recurring: false,
    end_date: null,
  };
}

export interface UseQuickTransactionFormOptions {
  type: Ref<TransactionTypeDto> | ComputedRef<TransactionTypeDto>;
  t: (key: string) => string;
  onSuccess: () => void;
}

/* eslint-disable max-lines-per-function, max-statements, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- return type is inferred from composable shape */
/**
 * Encapsulates form state, validation rules, visibility flags and the
 * submit/reset lifecycle for the QuickTransactionForm modal.
 *
 * @param opts Reactive type ref, translator, and success callback from the host.
 * @returns Reactive form bindings, computed options, rules and submit/reset handlers.
 */
export function useQuickTransactionForm(opts: UseQuickTransactionFormOptions) {
  const { type, t, onSuccess } = opts;
  const formRef = ref<FormInst | null>(null);
  const form = reactive<QuickTransactionFormState>(createDefaultFormState());
  provide(QUICK_TRANSACTION_FORM_KEY, form);

  const { data: tags } = useTagsQuery();
  const { data: accounts } = useAccountsQuery();
  const { data: creditCards } = useCreditCardsQuery();
  const mutation = useCreateTransactionMutation();

  const tagOptions = computed((): SelectOption[] =>
    (tags.value ?? []).map((tag) => ({ label: tag.name, value: tag.id })));
  const accountOptions = computed((): SelectOption[] =>
    (accounts.value ?? []).map((a) => ({ label: a.name, value: a.id })));
  const creditCardOptions = computed((): SelectOption[] =>
    (creditCards.value ?? []).map((c) => ({ label: c.name, value: c.id })));

  const showCreditCard = computed((): boolean => type.value === "expense");
  const showInstallment = computed((): boolean => type.value === "expense");
  const recurringDisabled = computed((): boolean => form.is_installment);
  const showInstallmentCount = computed((): boolean => form.is_installment);
  const showEndDate = computed((): boolean => form.is_recurring);

  const statusOptions = computed((): SelectOption[] => {
    if (type.value === "income") {
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

  watch(() => form.is_installment, (on) => { if (on) { form.is_recurring = false; } });
  watch(() => form.is_recurring, (on) => { if (on) { form.is_installment = false; } });

  const rules = computed((): FormRules => ({
    title: [{ required: true, message: t("transaction.form.required.title"), trigger: "blur" }],
    amount: [{ required: true, type: "number", message: t("transaction.form.required.amount"), trigger: ["blur", "change"] }],
    due_date: [{ required: true, type: "number", message: t("transaction.form.required.dueDate"), trigger: "change" }],
    installment_count: showInstallmentCount.value
      ? [{ required: true, type: "number", message: t("transaction.form.required.installmentCount"), trigger: ["blur", "change"] }]
      : [],
  }));

  /**
   * Builds installment-only payload fields when the toggle is active.
   *
   * @returns Partial payload, or empty object when installment is off.
   */
  function buildInstallmentFields(): Partial<CreateTransactionPayload> {
    if (!showInstallment.value || !form.is_installment) { return {}; }
    return { is_installment: true, installment_count: form.installment_count ?? 2 };
  }

  /**
   * Builds recurring-only payload fields when the toggle is active.
   *
   * @returns Partial payload, or empty object when recurring is off.
   */
  function buildRecurringFields(): Partial<CreateTransactionPayload> {
    if (!form.is_recurring) { return {}; }
    return {
      is_recurring: true,
      start_date: form.due_date ? tsToDate(form.due_date) : undefined,
      ...(form.end_date ? { end_date: tsToDate(form.end_date) } : {}),
    };
  }

  /**
   * Assembles the typed payload expected by the create-transaction mutation.
   *
   * @returns Fully populated payload ready to be sent to the API.
   */
  function buildPayload(): CreateTransactionPayload {
    return {
      title: form.title,
      amount: String(form.amount ?? 0),
      type: type.value,
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
    };
  }

  /** Restores every field in the reactive form back to its default value. */
  function resetForm(): void {
    Object.assign(form, createDefaultFormState());
  }

  /** Validates the form and submits via the create-transaction mutation. */
  async function submit(): Promise<void> {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    mutation.mutate(buildPayload(), {
      /* v8 ignore start */
      onSuccess: () => {
        onSuccess();
        resetForm();
      },
      /* v8 ignore stop */
    });
  }

  return {
    formRef,
    form,
    mutation,
    tagOptions,
    accountOptions,
    creditCardOptions,
    statusOptions,
    showCreditCard,
    showInstallment,
    showInstallmentCount,
    showEndDate,
    recurringDisabled,
    rules,
    submit,
    resetForm,
  };
}
