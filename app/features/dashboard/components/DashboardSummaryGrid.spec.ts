import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardSummaryGrid from "./DashboardSummaryGrid.vue";
import type {
  DashboardComparison,
  DashboardPortfolio,
  DashboardSummary,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

const stubs = {
  BaseSkeleton: {
    template: "<div class='base-skeleton' />",
  },
  "Wallet": true,
  "ArrowUpCircle": true,
  "ArrowDownCircle": true,
  "TrendingUp": true,
  "TrendingDown": true,
  "AlertCircle": true,
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

describe("DashboardSummaryGrid", () => {
  it("renders skeleton elements when isLoading is true", () => {
    const wrapper = mount(DashboardSummaryGrid, {
      props: {
        summary: null,
        comparison: null,
        portfolio: null,
        upcomingDues: [],
        isLoading: true,
      },
      global: { stubs },
    });

    const skeletons = wrapper.findAll(".base-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders summary values when data is loaded", () => {
    const wrapper = mount(DashboardSummaryGrid, {
      props: {
        summary: mockSummary,
        comparison: mockComparison,
        portfolio: mockPortfolio,
        upcomingDues: mockDues,
        isLoading: false,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("R$");
    expect(wrapper.text()).toContain("1 compromisso(s) no período");
  });

  it("shows zero values when summary is null and not loading", () => {
    const wrapper = mount(DashboardSummaryGrid, {
      props: {
        summary: null,
        comparison: null,
        portfolio: null,
        upcomingDues: [],
        isLoading: false,
      },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("R$");
    expect(wrapper.text()).toContain("0 compromisso(s) no período");
  });

  it("renders the summary-grid section with aria-label", () => {
    const wrapper = mount(DashboardSummaryGrid, {
      props: {
        summary: mockSummary,
        comparison: mockComparison,
        portfolio: mockPortfolio,
        upcomingDues: [],
        isLoading: false,
      },
      global: { stubs },
    });

    const section = wrapper.find("section");
    expect(section.exists()).toBe(true);
    expect(section.attributes("aria-label")).toBeTruthy();
  });

  it("does not render skeleton when isLoading is false", () => {
    const wrapper = mount(DashboardSummaryGrid, {
      props: {
        summary: mockSummary,
        comparison: mockComparison,
        portfolio: mockPortfolio,
        upcomingDues: [],
        isLoading: false,
      },
      global: { stubs },
    });

    const skeletons = wrapper.findAll(".base-skeleton");
    expect(skeletons).toHaveLength(0);
  });
});
