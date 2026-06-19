import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import type {
  CreditCardBill,
  CreditCardDto,
  CreditCardUtilization,
} from "~/features/credit-cards/contracts/credit-card.dto";

import CreditCardDashboard from "./CreditCardDashboard.vue";

vi.mock("~/utils/currency", () => ({
  formatCurrency: (value: number): string => `R$ ${value.toFixed(2)}`,
}));

const card: CreditCardDto = {
  id: "card-1",
  name: "Santander Unique",
  brand: "visa",
  limit_amount: 18320,
  closing_day: 5,
  due_day: 10,
  last_four_digits: "1234",
  bank: "Santander",
  description: null,
  benefits: ["Sala VIP", "Pontos"],
  validity_date: null,
  created_at: null,
  updated_at: null,
};

const bill: CreditCardBill = {
  cycle: {
    startDate: "2026-05-06",
    endDate: "2026-06-05",
    dueDate: "2026-06-10",
    status: "open",
  },
  totalAmount: 1200,
  paidAmount: 300,
  pendingAmount: 900,
  transactions: [
    {
      id: "tx-1",
      title: "Mercado",
      amount: 700,
      dueDate: "2026-06-03",
      status: "pending",
      type: "expense",
      impactPolicy: "full",
    },
    {
      id: "tx-2",
      title: "Viagem",
      amount: 500,
      dueDate: "2026-06-04",
      status: "pending",
      type: "expense",
      impactPolicy: "cards_only",
    },
  ],
};

const utilization: CreditCardUtilization = {
  cycle: bill.cycle,
  committedAmount: 1200,
  availableAmount: 17120,
  limitAmount: 18320,
  utilizationPct: 7,
};

const stubs = {
  UiChart: { template: "<div data-testid='chart' />" },
  NTabs: { template: "<section><slot /></section>" },
  NTabPane: {
    props: ["tab"],
    template: "<article><h3>{{ tab }}</h3><slot /></article>",
  },
  NButton: { template: "<button @click='$emit(\"click\")'><slot /></button>" },
  NStatistic: { props: ["label"], template: "<div><span>{{ label }}</span><slot /></div>" },
  NTag: { template: "<span><slot /></span>" },
  NAlert: { template: "<div><slot /></div>" },
  NEmpty: { template: "<div />" },
  NSpin: { template: "<div />" },
};

describe("CreditCardDashboard", () => {
  it("renders the less-dense dashboard tabs and overview charts", () => {
    const wrapper = mount(CreditCardDashboard, {
      props: { card, bill, utilization, month: "2026-06" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Visão geral");
    expect(wrapper.text()).toContain("Fatura");
    expect(wrapper.text()).toContain("Categorias");
    expect(wrapper.text()).toContain("Parcelamentos");
    expect(wrapper.text()).toContain("Benefícios");
    expect(wrapper.text()).toContain("Analítico");
    expect(wrapper.text()).toContain("Limite livre real");
    expect(wrapper.findAll("[data-testid='chart']")).toHaveLength(2);
  });

  it("renders the analytical mode blocks", () => {
    const wrapper = mount(CreditCardDashboard, {
      props: { card, bill, utilization, month: "2026-06", initialTab: "analytics" },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("Limite livre real");
    expect(wrapper.text()).toContain("Compras após fechamento");
    expect(wrapper.text()).toContain("Risco de orçamento");
  });

  it("emits addExpense from the primary action", async () => {
    const wrapper = mount(CreditCardDashboard, {
      props: { card, bill, utilization, month: "2026-06" },
      global: { stubs },
    });

    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("addExpense")).toHaveLength(1);
  });
});
