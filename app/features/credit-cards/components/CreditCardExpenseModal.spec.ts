import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

import CreditCardExpenseModal from "./CreditCardExpenseModal.vue";

const createMutate = vi.hoisted(() => vi.fn());
const updateMutate = vi.hoisted(() => vi.fn());

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", (): {
  useCreateTransactionMutation: () => {
    mutate: typeof createMutate;
    isPending: { value: boolean };
    isError: { value: boolean };
    error: { value: null };
  };
} => ({
  useCreateTransactionMutation: () => ({
    mutate: createMutate,
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/features/transactions/queries/use-update-transaction-mutation", (): {
  useUpdateTransactionMutation: () => {
    mutate: typeof updateMutate;
    isPending: { value: boolean };
    isError: { value: boolean };
    error: { value: null };
  };
} => ({
  useUpdateTransactionMutation: () => ({
    mutate: updateMutate,
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/features/tags/queries/use-tags-query", (): {
  useTagsQuery: () => { data: { value: Array<{ id: string; name: string }> } };
} => ({
  useTagsQuery: () => ({ data: { value: [{ id: "tag-1", name: "Eletrônicos" }] } }),
}));

vi.mock("~/features/accounts/queries/use-accounts-query", (): {
  useAccountsQuery: () => { data: { value: Array<{ id: string; name: string }> } };
} => ({
  useAccountsQuery: () => ({ data: { value: [{ id: "acc-1", name: "Conta Inter" }] } }),
}));

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", (): {
  useCreditCardsQuery: () => { data: { value: Array<{ id: string; name: string }> } };
} => ({
  useCreditCardsQuery: () => ({ data: { value: [{ id: "cc-1", name: "Cartão Inter" }] } }),
}));

vi.mock("~/features/budgets/queries/use-budgets-query", (): {
  useBudgetsQuery: () => { data: { value: [] } };
} => ({
  useBudgetsQuery: () => ({ data: { value: [] } }),
}));

vi.mock("~/components/ui/UiIcon/UiIcon.vue", () => ({
  default: { props: ["name", "size"], template: "<span data-testid='ui-icon' />" },
}));

vi.mock("~/components/ui/UiMoneyInput/UiMoneyInput.vue", () => ({
  default: {
    props: ["value"],
    emits: ["update:value"],
    setup(_props: unknown, { emit }: { emit: (event: "update:value", value: number) => void }): {
      onInput: (event: Event) => void;
    } {
      return {
        onInput(event: Event): void {
          emit("update:value", Number((event.target as HTMLInputElement).value));
        },
      };
    },
    template: "<input data-testid='money-input' :value='value' @input='onInput' />",
  },
}));

vi.mock("naive-ui", () => ({
  NAlert: { props: ["type", "title"], template: "<div><slot />{{ title }}</div>" },
  NButton: {
    props: ["loading", "disabled", "type"],
    emits: ["click"],
    template: "<button :disabled='disabled || loading' @click='$emit(\"click\", $event)'><slot name='icon' /><slot /></button>",
  },
  NDatePicker: {
    props: ["value"],
    emits: ["update:value"],
    setup(_props: unknown, { emit }: { emit: (event: "update:value", value: number) => void }): {
      onInput: (event: Event) => void;
    } {
      return {
        onInput(event: Event): void {
          emit("update:value", Number((event.target as HTMLInputElement).value));
        },
      };
    },
    template: "<input data-testid='date-input' :value='value' @input='onInput' />",
  },
  NForm: { template: "<form><slot /></form>" },
  NFormItem: { props: ["label"], template: "<label><span>{{ label }}</span><slot /></label>" },
  NInput: {
    props: ["value"],
    emits: ["update:value"],
    setup(_props: unknown, { emit }: { emit: (event: "update:value", value: string) => void }): {
      onInput: (event: Event) => void;
    } {
      return {
        onInput(event: Event): void {
          emit("update:value", (event.target as HTMLInputElement).value);
        },
      };
    },
    template: "<input :value='value' @input='onInput' />",
  },
  NModal: {
    props: ["show", "title"],
    emits: ["update:show"],
    template: `
      <section v-if="show" data-testid="cc-expense-modal">
        <h2>{{ title }}</h2>
        <slot />
        <footer><slot name="footer" /></footer>
      </section>
    `,
  },
  NSelect: {
    props: ["value", "options"],
    emits: ["update:value"],
    setup(_props: unknown, { emit }: { emit: (event: "update:value", value: string | null) => void }): {
      onChange: (event: Event) => void;
    } {
      return {
        onChange(event: Event): void {
          emit("update:value", (event.target as HTMLSelectElement).value || null);
        },
      };
    },
    template: "<select :value='value ?? \"\"' @change='onChange'><option v-for='option in options' :key='option.value' :value='option.value'>{{ option.label }}</option></select>",
  },
  NSpace: { template: "<div><slot /></div>" },
  NSwitch: {
    props: ["value"],
    emits: ["update:value"],
    setup(_props: unknown, { emit }: { emit: (event: "update:value", value: boolean) => void }): {
      onChange: (event: Event) => void;
    } {
      return {
        onChange(event: Event): void {
          emit("update:value", (event.target as HTMLInputElement).checked);
        },
      };
    },
    template: "<input type='checkbox' :checked='value' @change='onChange' />",
  },
}));

/**
 * Builds a transaction fixture for the expense modal.
 *
 * @param overrides Fields to override.
 * @returns Transaction fixture.
 */
const transactionFixture = (overrides: Partial<TransactionDto> = {}): TransactionDto => ({
  id: "tx-1",
  title: "Notebook Dell Inspiron",
  amount: "899.90",
  type: "expense",
  due_date: "2026-06-13",
  description: "Garantia estendida",
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  recurrence_interval: 1,
  recurrence_unit: "month",
  currency: "BRL",
  status: "pending",
  start_date: null,
  end_date: null,
  tag_id: "tag-1",
  account_id: "acc-1",
  credit_card_id: "cc-1",
  impact_policy: "full",
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("CreditCardExpenseModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the linked-transactions banner in edit mode", () => {
    const wrapper = mount(CreditCardExpenseModal, {
      props: {
        visible: true,
        transaction: transactionFixture(),
        presetCreditCardId: "cc-1",
      },
    });

    expect(wrapper.text()).toContain("Detalhes da despesa");
    expect(wrapper.text()).toContain("Vinculada às Transações");
    expect(wrapper.text()).toContain("Cartão Inter");
  });

  it("updates the source transaction when saving an existing card expense", async () => {
    const wrapper = mount(CreditCardExpenseModal, {
      props: {
        visible: true,
        transaction: transactionFixture(),
        presetCreditCardId: "cc-1",
      },
    });

    await wrapper.get("[data-testid='cc-expense-modal-submit']").trigger("click");

    expect(updateMutate).toHaveBeenCalledWith(
      {
        id: "tx-1",
        payload: expect.objectContaining({
          title: "Notebook Dell Inspiron",
          amount: "899.90",
          type: "expense",
          due_date: "2026-06-13",
          credit_card_id: "cc-1",
        }),
      },
      expect.any(Object),
    );
  });

  it("creates a new expense transaction with the preset credit card", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T09:00:00"));

    const wrapper = mount(CreditCardExpenseModal, {
      props: {
        visible: true,
        transaction: null,
        presetCreditCardId: "cc-1",
      },
    });

    await wrapper.get("[data-testid='cc-expense-title']").setValue("Nova compra");
    await wrapper.get("[data-testid='money-input']").setValue("55.5");
    await wrapper.get("[data-testid='cc-expense-modal-submit']").trigger("click");

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Nova compra",
        amount: "55.50",
        type: "expense",
        due_date: "2026-06-15",
        credit_card_id: "cc-1",
      }),
      expect.any(Object),
    );
  });

  it("exposes duplicate and remove actions for existing expenses", async () => {
    const transaction = transactionFixture();
    const wrapper = mount(CreditCardExpenseModal, {
      props: {
        visible: true,
        transaction,
        presetCreditCardId: "cc-1",
      },
    });

    await wrapper.get("[data-testid='cc-expense-modal-duplicate']").trigger("click");
    await wrapper.get("[data-testid='cc-expense-modal-remove']").trigger("click");

    expect(wrapper.emitted("duplicate")?.[0]).toEqual([transaction]);
    expect(wrapper.emitted("remove")?.[0]).toEqual([transaction]);
  });
});
