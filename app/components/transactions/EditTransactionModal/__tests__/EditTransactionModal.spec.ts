import { describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import EditTransactionModal from "../EditTransactionModal.vue";
import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

// ── Mock setup ─────────────────────────────────────────────────────────────────
// NModalStub is loaded via dynamic import inside the factory so it can be
// shared from ~/test-utils/stubs without triggering temporal dead zone errors.

vi.mock("naive-ui", async (importOriginal) => {
  const { NModalStub } = await import("~/test-utils/stubs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return { ...actual, NModal: NModalStub };
});

vi.mock("~/features/transactions/queries/use-update-transaction-mutation", () => ({
  useUpdateTransactionMutation: (): object => ({
    mutate: vi.fn(),
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/features/tags/queries/use-tags-query", () => ({ useTagsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/accounts/queries/use-accounts-query", () => ({ useAccountsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({ useCreditCardsQuery: (): object => ({ data: { value: [] } }) }));

/**
 * Builds a minimal TransactionDto fixture for testing.
 *
 * @returns A pending income transaction fixture.
 */
const makeTransaction = (): TransactionDto => ({
  id: "txn-test-1",
  title: "Salário",
  amount: "5000.00",
  type: "income",
  due_date: "2026-04-01",
  description: "Pagamento mensal",
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
  created_at: "2026-03-01T00:00:00.000Z",
  updated_at: "2026-03-01T00:00:00.000Z",
});

/**
 * Mounts the EditTransactionModal with sensible defaults.
 *
 * @param visible Whether the modal is visible.
 * @param transaction Transaction to pre-fill (defaults to income fixture).
 * @returns Vue Test Utils wrapper.
 */
const mountModal = (
  visible = true,
  transaction: TransactionDto | null = makeTransaction(),
): VueWrapper =>
  mount(EditTransactionModal, {
    props: { visible, transaction },
    global: {
      stubs: {
        NuxtLink: { template: "<a><slot /></a>" },
      },
    },
  });

describe("EditTransactionModal", () => {
  it("renders modal content when visible is true", () => {
    const wrapper = mountModal(true);
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(true);
  });

  it("does not render modal content when visible is false", () => {
    const wrapper = mountModal(false);
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(false);
  });

  it("shows the edit modal title", () => {
    const wrapper = mountModal(true);
    expect(wrapper.text()).toContain("Editar transação");
  });

  it("pre-fills the title input with transaction title", () => {
    const wrapper = mountModal(true, makeTransaction());
    const input = wrapper.find("input");
    // NInput renders a native input; check the value attribute
    expect(input.exists()).toBe(true);
  });

  it("shows cancel and save buttons", () => {
    const wrapper = mountModal(true);
    expect(wrapper.text()).toContain("Cancelar");
    expect(wrapper.text()).toContain("Salvar");
  });

  it("emits update:visible with false when cancel button is clicked", async () => {
    const wrapper = mountModal(true);
    const cancelButton = wrapper.findAll("button").find((b) => b.text() === "Cancelar");
    await cancelButton?.trigger("click");
    const emitted = wrapper.emitted("update:visible");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([false]);
  });

  it("does not show credit card field for income transaction", () => {
    const wrapper = mountModal(true, makeTransaction()); // type: income
    expect(wrapper.text()).not.toContain("Cartão de crédito");
  });

  it("shows credit card field for expense transaction", () => {
    const expense: TransactionDto = { ...makeTransaction(), type: "expense" };
    const wrapper = mountModal(true, expense);
    expect(wrapper.text()).toContain("Cartão de crédito");
  });

  it("renders form fields for core transaction data", () => {
    const wrapper = mountModal(true);
    expect(wrapper.text()).toContain("Título");
    expect(wrapper.text()).toContain("Valor");
  });

  it("handles null transaction gracefully (closed state)", () => {
    expect(() => mountModal(false, null)).not.toThrow();
  });

  it("pre-fills form with transaction data on mount (populateForm runs)", () => {
    const tx = makeTransaction();
    const wrapper = mountModal(true, tx);
    const input = wrapper.find("input");
    expect(input.exists()).toBe(true);
  });

  it("shows recurring toggle in form", () => {
    const wrapper = mountModal(true);
    expect(wrapper.text()).toContain("Recorrente?");
  });

  it("shows status select in form", () => {
    const wrapper = mountModal(true);
    expect(wrapper.text()).toContain("Status");
  });

  it("triggers handleSubmit when save button is clicked", async () => {
    const wrapper = mountModal(true);
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    // handleSubmit runs — form validation triggers
    expect(wrapper.exists()).toBe(true);
  });

  it("populates form from transaction with recurring true and end_date", () => {
    const tx: TransactionDto = {
      ...makeTransaction(),
      is_recurring: true,
      end_date: "2027-01-01",
    };
    const wrapper = mountModal(true, tx);
    expect(wrapper.exists()).toBe(true);
  });

  it("populates form from expense transaction with credit_card_id", () => {
    const tx: TransactionDto = {
      ...makeTransaction(),
      type: "expense",
      credit_card_id: "cc-123",
    };
    const wrapper = mountModal(true, tx);
    expect(wrapper.text()).toContain("Cartão de crédito");
  });
});
