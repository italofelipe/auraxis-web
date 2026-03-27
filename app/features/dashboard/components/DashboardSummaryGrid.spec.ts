import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardSummaryGrid from "./DashboardSummaryGrid.vue";
import type { DashboardSummaryGridProps } from "./DashboardSummaryGrid.types";
import type {
  DashboardComparison,
  DashboardPortfolio,
  DashboardSummary,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

// Stub UiMetricCard so tests remain isolated from shared component internals.
// Renders label, value, and a data-loading attribute so assertions stay simple.
const UiMetricCardStub = defineComponent({
  name: "UiMetricCard",
  props: ["label", "value", "trend", "icon", "loading"],
  template: `
    <div
      class="ui-metric-card"
      :data-loading="loading"
      :data-trend="trend"
    >
      <span class="mc-label">{{ label }}</span>
      <span class="mc-value">{{ value }}</span>
    </div>
  `,
});

// Stub Lucide icons — pure decorative, no functional assertions needed.
const IconStub = { template: "<span />" };

const stubs = {
  UiMetricCard: UiMetricCardStub,
  Wallet: IconStub,
  ArrowUpCircle: IconStub,
  ArrowDownCircle: IconStub,
  AlertCircle: IconStub,
  TrendingUp: IconStub,
};

const mockSummary: DashboardSummary = {
  income: 2000,
  expense: 1200,
  balance: 800,
  upcomingDueTotal: 400,
  netWorth: 15000,
};

const mockComparison: DashboardComparison = {
  incomeVsPreviousMonthPercent: 5.5,
  expenseVsPreviousMonthPercent: -3.2,
  balanceVsPreviousMonthPercent: 12.1,
};

const mockPortfolio: DashboardPortfolio = {
  currentValue: 15000,
  changePercent: 2.3,
};

const mockDues: DashboardUpcomingDue[] = [
  {
    id: "1",
    description: "Aluguel",
    amount: 1500,
    dueDate: "2026-03-20",
    category: "Moradia",
  },
];

/**
 * Mounts DashboardSummaryGrid with stubbed child components for isolation.
 *
 * @param props - Component props to pass during mount.
 * @returns VueWrapper with the mounted component.
 */
function mountGrid(props: DashboardSummaryGridProps): ReturnType<typeof mount> {
  return mount(DashboardSummaryGrid, { props, global: { stubs } });
}

describe("DashboardSummaryGrid", () => {
  it("renders 5 metric cards", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: mockDues,
      isLoading: false,
    });

    expect(wrapper.findAll(".ui-metric-card")).toHaveLength(5);
  });

  it("passes loading=true to all cards when isLoading is true", () => {
    const wrapper = mountGrid({
      summary: null,
      comparison: null,
      portfolio: null,
      upcomingDues: [],
      isLoading: true,
    });

    const cards = wrapper.findAll(".ui-metric-card");
    expect(cards).toHaveLength(5);
    cards.forEach((card) => {
      expect(card.attributes("data-loading")).toBe("true");
    });
  });

  it("passes loading=false to all cards when data is loaded", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: mockDues,
      isLoading: false,
    });

    wrapper.findAll(".ui-metric-card").forEach((card) => {
      expect(card.attributes("data-loading")).toBe("false");
    });
  });

  it("renders formatted currency values for all metrics", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: mockDues,
      isLoading: false,
    });

    const text = wrapper.text();
    expect(text).toContain("R$");
  });

  it("renders zero-formatted values when summary is null", () => {
    const wrapper = mountGrid({
      summary: null,
      comparison: null,
      portfolio: null,
      upcomingDues: [],
      isLoading: false,
    });

    // All 5 cards should show R$ 0,00
    const values = wrapper.findAll(".mc-value");
    expect(values.length).toBe(5);
    values.forEach((v) => {
      expect(v.text()).toContain("R$");
    });
  });

  it("passes comparison trend for balance card", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: [],
      isLoading: false,
    });

    // First card is "Saldo do período" — trend = 12.1
    const balanceCard = wrapper.find(".ui-metric-card");
    expect(balanceCard.attributes("data-trend")).toBe("12.1");
  });

  it("renders the summary-grid section with aria-label", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: [],
      isLoading: false,
    });

    const section = wrapper.find("section");
    expect(section.exists()).toBe(true);
    expect(section.attributes("aria-label")).toBeTruthy();
  });

  it("renders correct labels for each metric card", () => {
    const wrapper = mountGrid({
      summary: mockSummary,
      comparison: mockComparison,
      portfolio: mockPortfolio,
      upcomingDues: mockDues,
      isLoading: false,
    });

    const labels = wrapper.findAll(".mc-label").map((el) => el.text());
    expect(labels).toContain("Saldo do período");
    expect(labels).toContain("Receitas");
    expect(labels).toContain("Despesas");
    expect(labels).toContain("Contas a vencer");
    expect(labels).toContain("Patrimônio total");
  });
});
