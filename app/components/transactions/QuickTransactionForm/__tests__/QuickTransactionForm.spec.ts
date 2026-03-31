import { describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import QuickTransactionForm from "../QuickTransactionForm.vue";

// ── Hoisted stubs ──────────────────────────────────────────────────────────────
// vi.mock factories are hoisted before module initialisation, so the stubs must
// be created with vi.hoisted() to avoid temporal dead zone errors.

const { NModalStub } = vi.hoisted(() => ({
  NModalStub: {
    name: "NModal",
    props: { show: Boolean, title: String },
    template: "<div v-if=\"show\" data-testid=\"n-modal\"><span>{{ title }}</span><slot /><slot name=\"footer\" /></div>",
  },
}));

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return { ...actual, NModal: NModalStub };
});

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): object => ({
    mutate: vi.fn(),
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/features/tags/queries/use-tags-query", () => ({
  useTagsQuery: (): object => ({ data: { value: [] } }),
}));

vi.mock("~/features/accounts/queries/use-accounts-query", () => ({
  useAccountsQuery: (): object => ({ data: { value: [] } }),
}));

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({
  useCreditCardsQuery: (): object => ({ data: { value: [] } }),
}));

/**
 * Mounts the QuickTransactionForm with sensible defaults.
 *
 * NuxtLink requires a Nuxt router context that is not available in Vitest.
 * We stub it with a plain <a> element to prevent "nuxt instance unavailable" errors.
 *
 * @param type Transaction type — "income" or "expense".
 * @returns Vue Test Utils wrapper.
 */
const mountForm = (type: "income" | "expense" = "expense"): VueWrapper =>
  mount(QuickTransactionForm, {
    props: { visible: true, type },
    global: {
      stubs: {
        NuxtLink: { template: "<a><slot /></a>" },
      },
    },
  });

describe("QuickTransactionForm", () => {
  it("renders modal content when visible is true", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(true);
  });

  it("shows 'Nova Receita' title for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).toContain("Nova Receita");
  });

  it("shows 'Nova Despesa' title for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Nova Despesa");
  });

  it("renders title input field", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("shows installment toggle for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Parcelado?");
  });

  it("does not show installment toggle for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("Parcelado?");
  });

  it("shows recurring toggle for both income and expense", () => {
    expect(mountForm("income").text()).toContain("Recorrente?");
    expect(mountForm("expense").text()).toContain("Recorrente?");
  });

  it("shows credit card field for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Cartão de crédito");
  });

  it("does not show credit card field for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("Cartão de crédito");
  });

  it("shows cancel and save buttons", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Cancelar");
    expect(wrapper.text()).toContain("Salvar");
  });

  it("emits update:visible with false when cancel button is clicked", async () => {
    const wrapper = mountForm("expense");
    const cancelButton = wrapper.findAll("button").find((b) => b.text() === "Cancelar");
    await cancelButton?.trigger("click");
    const emitted = wrapper.emitted("update:visible");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([false]);
  });

  it("does not render modal content when visible is false", () => {
    const wrapper = mount(QuickTransactionForm, {
      props: { visible: false, type: "expense" },
      global: {
        stubs: {
          NuxtLink: { template: "<a><slot /></a>" },
        },
      },
    });
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(false);
  });
});
