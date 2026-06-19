import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CreditCardExpenseDrawer from "./CreditCardExpenseDrawer.vue";

const mutateAsync = vi.hoisted(() => vi.fn());

vi.mock("naive-ui", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = await importOriginal<any>();
  return {
    ...actual,
    NDrawer: {
      name: "NDrawer",
      props: ["show"],
      template: "<section v-if='show' data-testid='drawer'><slot /></section>",
    },
    NDrawerContent: {
      name: "NDrawerContent",
      template: "<div><slot /><footer><slot name='footer' /></footer></div>",
    },
    NForm: {
      name: "NForm",
      template: "<form><slot /></form>",
      methods: { validate: (): Promise<void> => Promise.resolve() },
    },
    NDatePicker: {
      name: "NDatePicker",
      props: ["value"],
      emits: ["update:value"],
      template: "<button class='date' @click=\"$emit('update:value', new Date(2026, 5, 6).getTime())\">date</button>",
    },
    NInput: {
      name: "NInput",
      props: ["value"],
      emits: ["update:value"],
      template: "<input class='input' :value='value' @input=\"$emit('update:value', $event.target.value)\" />",
    },
    NInputNumber: {
      name: "NInputNumber",
      props: ["value"],
      emits: ["update:value"],
      template: "<input class='number' :value='value' @input=\"$emit('update:value', Number($event.target.value))\" />",
    },
    NSelect: {
      name: "NSelect",
      props: ["value"],
      emits: ["update:value"],
      template: "<select class='select' :value='value' @change=\"$emit('update:value', $event.target.value)\"><slot /></select>",
    },
  };
});

vi.mock("~/features/credit-cards/queries/use-credit-cards-query", () => ({
  useCreditCardsQuery: (): object => ({
    data: {
      value: [
        {
          id: "card-1",
          name: "Unique",
          bank: "Santander",
          brand: "visa",
          limit_amount: 10000,
          closing_day: 5,
          due_day: 10,
          last_four_digits: "1234",
          description: null,
          benefits: [],
          validity_date: null,
          created_at: null,
          updated_at: null,
        },
      ],
    },
  }),
}));

vi.mock("~/features/tags/queries/use-tags-query", () => ({
  useTagsQuery: (): object => ({ data: { value: [] } }),
}));

vi.mock("~/features/accounts/queries/use-accounts-query", () => ({
  useAccountsQuery: (): object => ({ data: { value: [] } }),
}));

vi.mock("~/features/transactions/queries/use-create-transaction-mutation", () => ({
  useCreateTransactionMutation: (): object => ({
    mutateAsync,
    isPending: { value: false },
    isError: { value: false },
    error: { value: null },
  }),
}));

vi.mock("~/utils/currency", () => ({
  formatCurrency: (value: number): string => `R$ ${value.toFixed(2)}`,
}));

const UiMoneyInputStub = {
  name: "UiMoneyInput",
  props: ["value"],
  emits: ["update:value"],
  template: "<input class='money' :value='value' @input=\"$emit('update:value', Number($event.target.value))\" />",
};

describe("CreditCardExpenseDrawer", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    mutateAsync.mockResolvedValue([]);
  });

  it("renders purchase-date wording and bill preview", async () => {
    const wrapper = mount(CreditCardExpenseDrawer, {
      props: { visible: true, presetCreditCardId: "card-1" },
      global: { stubs: { UiMoneyInput: UiMoneyInputStub } },
    });

    await wrapper.find(".date").trigger("click");

    expect(wrapper.text()).toContain("Data da compra");
    expect(wrapper.text()).toContain("Cai na fatura de julho de 2026");
    expect(wrapper.text()).toContain("Vence dia");
  });

  it("submits an expense payload with impact policy and selected card", async () => {
    const wrapper = mount(CreditCardExpenseDrawer, {
      props: { visible: true, presetCreditCardId: "card-1" },
      global: { stubs: { UiMoneyInput: UiMoneyInputStub } },
    });

    await wrapper.find(".input").setValue("Mercado");
    await wrapper.find(".money").setValue("123.45");
    await wrapper.find(".date").trigger("click");
    await wrapper.findAll("button").find((button) => button.text() === "Lançar despesa")?.trigger("click");
    await flushPromises();

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Mercado",
        amount: "123.45",
        due_date: "2026-06-06",
        credit_card_id: "card-1",
        impact_policy: "full",
      }),
    );
  });
});
