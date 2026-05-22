import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import TransactionPaymentModal from "../TransactionPaymentModal.vue";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

vi.mock("naive-ui", async (importOriginal) => {
  const { NModalStub } = await import("~/test-utils/stubs");
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    NModal: NModalStub,
    NButton: {
      props: ["disabled", "loading", "type"],
      emits: ["click"],
      template: "<button :disabled=\"disabled\" @click=\"$emit('click')\"><slot /></button>",
    },
    NDatePicker: {
      props: ["value", "isDateDisabled"],
      emits: ["update:value"],
      template: "<button data-testid=\"transaction-payment-date\" @click=\"$emit('update:value', new Date(2026, 4, 10).getTime())\">date-picker</button>",
    },
  };
});

/**
 * Creates a payment-modal transaction fixture.
 *
 * @param overrides Partial transaction fields to override.
 * @returns Complete transaction DTO for component tests.
 */
const makeTransaction = (overrides: Partial<TransactionDto> = {}): TransactionDto => ({
  id: "txn-payment-1",
  title: "IPTU 2026",
  amount: "2580.00",
  type: "expense",
  due_date: "2026-05-11",
  description: null,
  observation: null,
  is_recurring: false,
  is_installment: false,
  installment_count: null,
  currency: "BRL",
  status: "pending",
  start_date: null,
  end_date: null,
  tag_id: null,
  account_id: null,
  credit_card_id: null,
  installment_group_id: null,
  paid_at: null,
  created_at: null,
  updated_at: null,
  ...overrides,
});

describe("TransactionPaymentModal", () => {
  it("renders payment copy and requires an effective date for expenses", () => {
    const wrapper = mount(TransactionPaymentModal, {
      props: { visible: true, transaction: makeTransaction(), loading: false },
    });

    expect(wrapper.text()).toContain("Confirmar pagamento");
    expect(wrapper.text()).toContain("Data efetiva do pagamento");
    expect(wrapper.text()).toContain("IPTU 2026");
    expect(wrapper.get("[data-testid='transaction-payment-confirm']").attributes("disabled")).toBeDefined();
  });

  it("renders formatted BRL string amounts without falling back to zero", () => {
    const wrapper = mount(TransactionPaymentModal, {
      props: { visible: true, transaction: makeTransaction({ amount: "R$ 2.580,00" }), loading: false },
    });

    expect(wrapper.text()).toContain("R$ 2.580,00");
    expect(wrapper.text()).not.toContain("R$ 0,00");
  });

  it("renders receipt copy for income transactions", () => {
    const wrapper = mount(TransactionPaymentModal, {
      props: { visible: true, transaction: makeTransaction({ type: "income", title: "Venda" }), loading: false },
    });

    expect(wrapper.text()).toContain("Confirmar recebimento");
    expect(wrapper.text()).toContain("Data efetiva do recebimento");
  });

  it("emits confirm with an ISO datetime after the date is selected", async () => {
    const wrapper = mount(TransactionPaymentModal, {
      props: { visible: true, transaction: makeTransaction(), loading: false },
    });

    await wrapper.get("[data-testid='transaction-payment-date']").trigger("click");
    await wrapper.get("[data-testid='transaction-payment-confirm']").trigger("click");

    expect(wrapper.emitted("confirm")?.[0]).toEqual([new Date(2026, 4, 10).toISOString()]);
  });
});
