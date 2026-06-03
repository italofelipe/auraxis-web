import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardMarketPulseWorkspace from "../DashboardMarketPulseWorkspace.vue";
import type {
  DashboardComparison,
  DashboardExpenseCategory,
  DashboardSummary,
  DashboardTimeseriesPoint,
  DashboardTrendsMonthEntry,
} from "~/features/dashboard/model/dashboard-overview";

const UiChartStub = defineComponent({
  name: "UiChart",
  props: ["option", "height", "updateKey"],
  template: "<div class=\"ui-chart-stub\" :data-height=\"height\">chart</div>",
});

const UiTrendBadgeStub = defineComponent({
  name: "UiTrendBadge",
  props: ["value", "decimals"],
  template: "<span class=\"trend-badge-stub\" :data-value=\"value\" />",
});

const IconStub = defineComponent({
  name: "IconStub",
  template: "<span class=\"icon-stub\" />",
});

const stubs = {
  UiChart: UiChartStub,
  UiTrendBadge: UiTrendBadgeStub,
  ArrowDownCircle: IconStub,
  ArrowDownRight: IconStub,
  ArrowUpCircle: IconStub,
  ArrowUpRight: IconStub,
  CalendarClock: IconStub,
  ChevronLeft: IconStub,
  Download: IconStub,
  LineChart: IconStub,
  PieChart: IconStub,
  Scale: IconStub,
  Sparkles: IconStub,
  Wallet: IconStub,
};

const summary: DashboardSummary = {
  income: 124_500,
  expense: 82_340.5,
  balance: 42_159.5,
  upcomingDueTotal: 15_000,
  netWorth: 220_000,
};

const comparison: DashboardComparison = {
  incomeVsPreviousMonthPercent: 12.5,
  expenseVsPreviousMonthPercent: -4.2,
  balanceVsPreviousMonthPercent: 28.4,
};

const categories: DashboardExpenseCategory[] = [
  { category: "Tecnologia & SaaS", amount: 12_450, percentage: 15 },
  { category: "Infraestrutura", amount: 8_230, percentage: 10 },
];

const trends: DashboardTrendsMonthEntry[] = [
  { month: "2026-03", income: 96_000, expenses: 70_000, balance: 26_000 },
  { month: "2026-04", income: 112_000, expenses: 78_000, balance: 34_000 },
  { month: "2026-05", income: 124_500, expenses: 82_340.5, balance: 42_159.5 },
];

const emptyTimeseries: DashboardTimeseriesPoint[] = [];

/**
 * Mounts the Market Pulse workspace with realistic dashboard data.
 *
 * @param overrides Partial prop overrides for scenario-specific tests.
 * @returns Mounted Vue wrapper.
 */
function mountWorkspace(overrides: Record<string, unknown> = {}): ReturnType<typeof mount> {
  return mount(DashboardMarketPulseWorkspace, {
    props: {
      summary,
      comparison,
      timeseries: emptyTimeseries,
      expensesByCategory: categories,
      trends,
      loading: false,
      ...overrides,
    },
    global: { stubs },
  });
}

describe("DashboardMarketPulseWorkspace", () => {
  it("renders the prototype dashboard anatomy", () => {
    const wrapper = mountWorkspace();

    expect(wrapper.text()).toContain("Receitas (Mês)");
    expect(wrapper.text()).toContain("Despesas (Mês)");
    expect(wrapper.text()).toContain("Saldo Líquido");
    expect(wrapper.text()).toContain("Taxa de poupança");
    expect(wrapper.text()).toContain("Fluxo de Caixa Acumulado");
    expect(wrapper.text()).toContain("Gastos por Categoria");
  });

  it("no longer renders the low-value operational panels", () => {
    const wrapper = mountWorkspace();

    expect(wrapper.text()).not.toContain("Transações Recentes");
    expect(wrapper.text()).not.toContain("Anomalias Detectadas");
  });

  it("renders the month-over-month comparatives strip from real comparison data", () => {
    const wrapper = mountWorkspace();

    expect(wrapper.text()).toContain("Comparativo com o mês anterior");

    const badges = wrapper.findAll(".trend-badge-stub");
    expect(badges).toHaveLength(3);
    // income +12.5%, expense -4.2% inverted to +4.2, balance +28.4%
    expect(badges[0]?.attributes("data-value")).toBe("12.5");
    expect(badges[1]?.attributes("data-value")).toBe("4.2");
    expect(badges[2]?.attributes("data-value")).toBe("28.4");
  });

  it("uses trend data instead of a blank empty state when daily timeseries is empty", () => {
    const wrapper = mountWorkspace();

    expect(wrapper.find(".ui-chart-stub").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Ainda não há movimentações");
  });

  it("surfaces category drilldown from dashboard data", () => {
    const wrapper = mountWorkspace();

    expect(wrapper.text()).toContain("Tecnologia & SaaS");
    expect(wrapper.text()).toContain("15% do total");
    expect(wrapper.text()).toContain("Infraestrutura");
  });

  it("renders a concise loading skeleton without data rows", () => {
    const wrapper = mountWorkspace({
      loading: true,
      summary: null,
      expensesByCategory: [],
      trends: [],
    });

    expect(wrapper.find(".market-pulse__skeleton").exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Tecnologia & SaaS");
  });
});
