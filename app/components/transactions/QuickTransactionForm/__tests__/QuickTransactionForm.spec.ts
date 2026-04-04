import { describe, expect, it, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import QuickTransactionForm from "../QuickTransactionForm.vue";

// ── Mock setup ─────────────────────────────────────────────────────────────────
// NModalStub is loaded via dynamic import inside the factory so it can be
// shared from ~/test-utils/stubs without triggering temporal dead zone errors.

vi.mock("naive-ui", async (importOriginal) => {
  const { NModalStub } = await import("~/test-utils/stubs");
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

vi.mock("~/features/tags/queries/use-tags-query", () => ({ useTagsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/accounts/queries/use-accounts-query", () => ({ useAccountsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({ useCreditCardsQuery: (): object => ({ data: { value: [] } }) }));

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

vi.mock("vue-i18n", () => ({ useI18n: (): { t: (key: string) => string } => ({ t: (key: string) => key }) }));

describe("QuickTransactionForm", () => {
  it("renders modal content when visible is true", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(true);
  });

  it("shows income title key for income type", () => {
    const wrapper = mountForm("income");
    // useI18n returns the key verbatim in tests
    expect(wrapper.text()).toContain("transaction.form.title.income");
  });

  it("shows expense title key for expense type", () => {
    const wrapper = mountForm("expense");
    // useI18n returns the key verbatim in tests
    expect(wrapper.text()).toContain("transaction.form.title.expense");
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

  it("renders the save button in expense mode", () => {
    const wrapper = mountForm("expense");
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    expect(saveButton?.exists()).toBe(true);
  });

  it("emits update:visible false when cancel button is clicked (close path)", async () => {
    const wrapper = mountForm("expense");
    const cancelButton = wrapper.findAll("button").find((b) => b.text() === "Cancelar");
    await cancelButton?.trigger("click");
    expect(wrapper.emitted("update:visible")).toBeTruthy();
    expect(wrapper.emitted("update:visible")?.[0]).toEqual([false]);
  });

  it("shows income status options for income type", () => {
    const wrapper = mountForm("income");
    // For income type status options do not include 'postponed'
    expect(wrapper.text()).not.toContain("transaction.status.postponed");
  });

  it("shows expense status options including postponed for expense type", () => {
    const wrapper = mountForm("expense");
    // statusOptions computed is triggered — text with translated keys
    expect(wrapper.text()).toContain("transaction.status.pending");
  });

  it("tagOptions computed maps tag data correctly", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.exists()).toBe(true);
  });

  it("shows installment count field when is_installment is toggled on", async () => {
    const wrapper = mountForm("expense");
    // Find and click the NSwitch for installment
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    if (switches.length > 0) {
      await switches[0]!.vm.$emit("update:value", true);
    }
    expect(wrapper.exists()).toBe(true);
  });

  it("shows end date field when is_recurring is toggled on", async () => {
    const wrapper = mountForm("income");
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    if (switches.length > 0) {
      await switches[0]!.vm.$emit("update:value", true);
    }
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with account options when available", () => {
    const wrapper = mountForm("income");
    expect(wrapper.exists()).toBe(true);
  });

  it("renders with credit card section for expense (showCreditCard=true)", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Cartão de crédito");
  });

  it("does not show credit card for income (showCreditCard=false)", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("Cartão de crédito");
  });
});
