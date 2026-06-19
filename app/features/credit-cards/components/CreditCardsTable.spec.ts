import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type { CreditCardDto } from "~/features/credit-cards/contracts/credit-card.dto";

import CreditCardsTable from "./CreditCardsTable.vue";

vi.mock("~/utils/currency", () => ({
  formatCurrency: (value: number): string => `R$ ${value.toFixed(2)}`,
}));

const CARD: CreditCardDto = {
  id: "card-1",
  name: "Santander Unique",
  brand: "visa",
  limit_amount: 18320,
  closing_day: 5,
  due_day: 10,
  last_four_digits: "1234",
  bank: "Santander",
  description: null,
  benefits: ["Pontos"],
  validity_date: null,
  created_at: null,
  updated_at: null,
};

const stubs = {
  NButton: {
    template: "<button v-bind='$attrs' @click='$emit(\"click\", $event)'><slot /></button>",
  },
  NTag: { template: "<span><slot /></span>" },
};

describe("CreditCardsTable", () => {
  it("renders the operational columns", () => {
    const wrapper = mount(CreditCardsTable, {
      props: { cards: [CARD] },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Cartão");
    expect(wrapper.text()).toContain("Santander Unique");
    expect(wrapper.text()).toContain("Fecha dia 5 · vence dia 10");
    expect(wrapper.text()).toContain("1 benefício");
  });

  it("emits select from row and addExpense from action", async () => {
    const wrapper = mount(CreditCardsTable, {
      props: { cards: [CARD] },
      global: { stubs },
    });

    await wrapper.find("tbody tr").trigger("click");
    expect(wrapper.emitted("select")?.[0]?.[0]).toEqual(CARD);

    const addButton = wrapper.findAll("button").find(
      (button) => button.attributes("title") === "Lançar despesa",
    );
    await addButton?.trigger("click");
    expect(wrapper.emitted("addExpense")?.[0]?.[0]).toEqual(CARD);
  });
});
