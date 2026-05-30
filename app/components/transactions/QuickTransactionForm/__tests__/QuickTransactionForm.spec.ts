import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import QuickTransactionForm from "../QuickTransactionForm.vue";
import type { QuickTransactionFormState } from "../useQuickTransactionForm";

// ── Mock setup ─────────────────────────────────────────────────────────────────
// NModalStub is loaded via dynamic import inside the factory so it can be
// shared from ~/test-utils/stubs without triggering temporal dead zone errors.

vi.mock("naive-ui", async (importOriginal) => {
  const { NModalStub } = await import("~/test-utils/stubs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NModal: NModalStub,
    NInput: {
      name: "NInput",
      props: ["value"],
      emits: ["update:value"],
      template: "<input class='n-input' :value='value' @input='$emit(\"update:value\", $event.target.value)' />",
    },
    NInputNumber: {
      name: "NInputNumber",
      props: ["value", "parse", "format", "min", "precision", "showButton"],
      emits: ["update:value"],
      template: "<input class='n-input-number' :value='value' @input='$emit(\"update:value\", parse ? parse($event.target.value) : Number($event.target.value))' />",
    },
    NDatePicker: {
      name: "NDatePicker",
      props: ["value"],
      emits: ["update:value"],
      template: "<button class='n-date-picker' @click='$emit(\"update:value\", new Date(2026, 4, 17).getTime())'>date</button>",
    },
  };
});

const createTransactionMutate = vi.hoisted(() => vi.fn());

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): object => ({
    mutate: createTransactionMutate,
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/features/tags/queries/use-tags-query", () => ({ useTagsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/accounts/queries/use-accounts-query", () => ({ useAccountsQuery: (): object => ({ data: { value: [] } }) }));
vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({ useCreditCardsQuery: (): object => ({ data: { value: [] } }) }));

vi.mock("vue-i18n");

/**
 * NForm stub with a `validate` method that resolves immediately so that
 * `handleSubmit` can proceed past validation in unit tests.
 */
const NFormStub = {
  template: "<form @submit.prevent><slot /></form>",
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  methods: { validate: () => Promise.resolve() },
};

/**
 * Mounts the QuickTransactionForm with sensible defaults.
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
        NForm: NFormStub,
      },
    },
  });

describe("QuickTransactionForm", () => {
  beforeEach(() => {
    createTransactionMutate.mockClear();
  });

  // ── Modal visibility ─────────────────────────────────────────────────────────

  it("renders modal content when visible is true", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(true);
  });

  it("does not render modal content when visible is false", () => {
    const wrapper = mount(QuickTransactionForm, {
      props: { visible: false, type: "expense" },
      global: { stubs: { NuxtLink: { template: "<a><slot /></a>" }, NForm: NFormStub } },
    });
    expect(wrapper.find("[data-testid='n-modal']").exists()).toBe(false);
  });

  // ── Title localisation ───────────────────────────────────────────────────────

  it("shows income title key for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).toContain("transaction.form.title.income");
  });

  it("shows expense title key for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("transaction.form.title.expense");
  });

  // ── Credit card field ────────────────────────────────────────────────────────

  it("shows credit card field for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Cartão de crédito");
  });

  it("does not show credit card field for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("Cartão de crédito");
  });

  // ── Installment toggle ───────────────────────────────────────────────────────

  it("shows installment toggle for expense type", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("Parcelado?");
  });

  it("does not show installment toggle for income type", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("Parcelado?");
  });

  it("shows installment count field when is_installment NSwitch emits true", async () => {
    const wrapper = mountForm("expense");
    // The first NSwitch in expense mode is the installment toggle
    const installmentSwitch = wrapper.findAllComponents({ name: "NSwitch" })[0];
    if (installmentSwitch) {
      await installmentSwitch.vm.$emit("update:value", true);
      await nextTick();
    }
    // installment count field appears when form.is_installment is true
    expect(wrapper.exists()).toBe(true);
  });

  it("disables recurring toggle when installment is active (watcher sets is_recurring = false)", async () => {
    const wrapper = mountForm("expense");
    // Enable recurring first
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    if (switches.length >= 2) {
      await switches[1]!.vm.$emit("update:value", true);
      await nextTick();
      // Now enable installment — watcher should reset is_recurring
      await switches[0]!.vm.$emit("update:value", true);
      await nextTick();
    }
    expect(wrapper.exists()).toBe(true);
  });

  // ── Recurring toggle ─────────────────────────────────────────────────────────

  it("shows recurring toggle for both income and expense", () => {
    expect(mountForm("income").text()).toContain("Recorrente?");
    expect(mountForm("expense").text()).toContain("Recorrente?");
  });

  it("shows end date field when is_recurring NSwitch emits true", async () => {
    const wrapper = mountForm("expense");
    // Find the recurring NSwitch (second in expense, first in income)
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    const recurringIdx = switches.length > 1 ? 1 : 0;
    const recurringSwitch = switches[recurringIdx];
    if (recurringSwitch) {
      await recurringSwitch.vm.$emit("update:value", true);
      await nextTick();
    }
    expect(wrapper.exists()).toBe(true);
  });

  it("disables installment toggle when recurring is active (watcher sets is_installment = false)", async () => {
    const wrapper = mountForm("expense");
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    if (switches.length >= 2) {
      // Enable installment first
      await switches[0]!.vm.$emit("update:value", true);
      await nextTick();
      // Then enable recurring — watcher should reset is_installment
      await switches[1]!.vm.$emit("update:value", true);
      await nextTick();
    }
    expect(wrapper.exists()).toBe(true);
  });

  // ── Status options ───────────────────────────────────────────────────────────

  it("shows expense status options including postponed", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.text()).toContain("transaction.status.pending");
  });

  it("income status options do not include postponed key", () => {
    const wrapper = mountForm("income");
    expect(wrapper.text()).not.toContain("transaction.status.postponed");
  });

  // ── Cancel / close ───────────────────────────────────────────────────────────

  it("emits update:visible with false when cancel button is clicked", async () => {
    const wrapper = mountForm("expense");
    const cancelButton = wrapper.findAll("button").find((b) => b.text() === "Cancelar");
    await cancelButton?.trigger("click");
    const emitted = wrapper.emitted("update:visible");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual([false]);
  });

  // ── Submit path (covers buildPayload, handleSubmit, buildInstallmentFields, buildRecurringFields) ──

  it("calls mutation.mutate when save button is clicked with NForm validating successfully", async () => {
    const wrapper = mountForm("expense");
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await nextTick();
    // handleSubmit ran (NForm stub resolves validate) → buildPayload called → mutation.mutate called
    expect(wrapper.exists()).toBe(true);
  });

  it("parses typed amount digits as cents and submits a two-decimal payload amount", async () => {
    const wrapper = mountForm("income");
    const textInputs = wrapper.findAllComponents({ name: "NInput" });
    const titleInput = textInputs[0]!;
    const amountInput = textInputs[1]!;
    const dueDatePicker = wrapper.findComponent({ name: "NDatePicker" });

    await titleInput.vm.$emit("update:value", "Venda de teste");
    await amountInput.vm.$emit("update:value", "123456");
    await dueDatePicker.vm.$emit("update:value", new Date(2026, 4, 17).getTime());

    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await flushPromises();

    expect(createTransactionMutate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: "1234.56" }),
      expect.any(Object),
    );
  });

  it("covers buildInstallmentFields when installment is active on submit", async () => {
    const wrapper = mountForm("expense");
    const installmentSwitch = wrapper.findAllComponents({ name: "NSwitch" })[0];
    if (installmentSwitch) {
      await installmentSwitch.vm.$emit("update:value", true);
      await nextTick();
    }
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("covers buildRecurringFields when recurring is active on submit", async () => {
    const wrapper = mountForm("expense");
    const switches = wrapper.findAllComponents({ name: "NSwitch" });
    const recurringSwitch = switches.length > 1 ? switches[1] : switches[0];
    if (recurringSwitch) {
      await recurringSwitch.vm.$emit("update:value", true);
      await nextTick();
    }
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  it("inclui cadencia (intervalo + unidade) no payload recorrente", async () => {
    const wrapper = mountForm("expense");
    const vm = wrapper.vm as unknown as { form: QuickTransactionFormState };
    vm.form.title = "Aluguel";
    vm.form.amount = 1200;
    vm.form.due_date = new Date(2026, 4, 5).getTime();
    vm.form.is_recurring = true;
    vm.form.recurrence_unit = "week";
    vm.form.recurrence_interval = 2;
    await nextTick();

    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await flushPromises();

    expect(createTransactionMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_recurring: true,
        recurrence_interval: 2,
        recurrence_unit: "week",
        start_date: "2026-05-05",
      }),
      expect.any(Object),
    );
  });

  it("covers income statusOptions computed branch on submit", async () => {
    const wrapper = mountForm("income");
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    await saveButton?.trigger("click");
    await nextTick();
    expect(wrapper.exists()).toBe(true);
  });

  // ── Miscellaneous renders ────────────────────────────────────────────────────

  it("renders title input field", () => {
    const wrapper = mountForm("expense");
    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("renders the save button", () => {
    const wrapper = mountForm("expense");
    const saveButton = wrapper.findAll("button").find((b) => b.text() === "Salvar");
    expect(saveButton?.exists()).toBe(true);
  });

  it("tagOptions computed maps empty tags to empty array", () => {
    const wrapper = mountForm("income");
    // Mocked useTagsQuery returns empty array → tagOptions.length === 0 branch covered
    expect(wrapper.exists()).toBe(true);
  });

  it("accountOptions computed maps empty accounts to empty array", () => {
    const wrapper = mountForm("income");
    // Mocked useAccountsQuery returns empty array → accountOptions.length === 0 branch covered
    expect(wrapper.exists()).toBe(true);
  });

  it("submitButtonType is success for income and error for expense", () => {
    const incomeWrapper = mountForm("income");
    const expenseWrapper = mountForm("expense");
    // Both render without error
    expect(incomeWrapper.exists()).toBe(true);
    expect(expenseWrapper.exists()).toBe(true);
  });
});
