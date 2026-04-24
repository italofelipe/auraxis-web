import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardPeriodComparisonStrip from "../DashboardPeriodComparisonStrip.vue";
import type { DashboardComparison } from "~/features/dashboard/model/dashboard-overview";

const UiSurfaceCardStub = defineComponent({
  name: "UiSurfaceCard",
  template: "<div class=\"ui-surface-card-stub\"><slot /></div>",
});

const UiTrendBadgeStub = defineComponent({
  name: "UiTrendBadge",
  props: ["value", "decimals"],
  template: "<span class=\"trend-badge-stub\" :data-value=\"value\" />",
});

const IconStub = { template: "<span />" };

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  UiTrendBadge: UiTrendBadgeStub,
  ArrowUpCircle: IconStub,
  ArrowDownCircle: IconStub,
  Scale: IconStub,
};

const fullComparison: DashboardComparison = {
  incomeVsPreviousMonthPercent: 10,
  expenseVsPreviousMonthPercent: -5,
  balanceVsPreviousMonthPercent: 20,
};

describe("DashboardPeriodComparisonStrip", () => {
  it("renders a skeleton when loading", () => {
    const wrapper = mount(DashboardPeriodComparisonStrip, {
      props: { comparison: null, loading: true },
      global: { stubs },
    });
    expect(wrapper.find(".comparison-strip__skeleton").exists()).toBe(true);
    expect(wrapper.findAll(".trend-badge-stub")).toHaveLength(0);
  });

  it("renders one badge per metric when comparison is complete", () => {
    const wrapper = mount(DashboardPeriodComparisonStrip, {
      props: { comparison: fullComparison, loading: false },
      global: { stubs },
    });
    expect(wrapper.findAll(".trend-badge-stub")).toHaveLength(3);
  });

  it("inverts sign for expenses so higher spending renders as negative", () => {
    const wrapper = mount(DashboardPeriodComparisonStrip, {
      props: {
        comparison: {
          incomeVsPreviousMonthPercent: 0,
          expenseVsPreviousMonthPercent: 12,
          balanceVsPreviousMonthPercent: 0,
        },
        loading: false,
      },
      global: { stubs },
    });
    const expenseBadge = wrapper.findAll(".trend-badge-stub")[1];
    expect(expenseBadge?.attributes("data-value")).toBe("-12");
  });

  it("shows placeholder for metrics with null percent", () => {
    const wrapper = mount(DashboardPeriodComparisonStrip, {
      props: {
        comparison: {
          incomeVsPreviousMonthPercent: null,
          expenseVsPreviousMonthPercent: null,
          balanceVsPreviousMonthPercent: null,
        },
        loading: false,
      },
      global: { stubs },
    });
    expect(wrapper.findAll(".trend-badge-stub")).toHaveLength(0);
    expect(wrapper.findAll(".comparison-strip__empty")).toHaveLength(3);
  });
});
