import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardInvestmentsPanel from "../DashboardInvestmentsPanel.vue";
import type { WalletEntryDto } from "~/features/portfolio/contracts/portfolio.dto";

const UiSurfaceCardStub = defineComponent({
  name: "UiSurfaceCard",
  template: "<div class=\"ui-surface-card-stub\"><slot /></div>",
});

const UiTrendBadgeStub = defineComponent({
  name: "UiTrendBadge",
  props: ["value", "decimals"],
  template: "<span class=\"trend-badge-stub\" :data-value=\"value\" />",
});

const UiChartStub = defineComponent({
  name: "UiChart",
  props: ["option", "updateKey", "height"],
  template: "<div class=\"ui-chart-stub\" />",
});

const ClientOnlyStub = defineComponent({
  name: "ClientOnly",
  template: "<div><slot /></div>",
});

const IconStub = { template: "<span />" };

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  UiTrendBadge: UiTrendBadgeStub,
  UiChart: UiChartStub,
  ClientOnly: ClientOnlyStub,
  Briefcase: IconStub,
};

/**
 * Builds a wallet entry fixture with common defaults.
 *
 * @param overrides Partial fields to override on the default fixture.
 * @returns A fully-typed WalletEntryDto for test input.
 */
function entry(overrides: Partial<WalletEntryDto>): WalletEntryDto {
  return {
    id: "e1",
    name: "Asset",
    ticker: null,
    quantity: null,
    current_value: 100,
    cost_basis: 80,
    register_date: "2026-01-01",
    change_percent: null,
    asset_type: "stock",
    ...overrides,
  };
}

describe("DashboardInvestmentsPanel", () => {
  it("renders loading skeleton when loading", () => {
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries: [], loading: true },
      global: { stubs },
    });
    expect(wrapper.find(".investments-panel__skeleton").exists()).toBe(true);
  });

  it("renders empty state when no entries and not loading", () => {
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries: [], loading: false },
      global: { stubs },
    });
    expect(wrapper.find(".investments-panel__empty").exists()).toBe(true);
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(false);
  });

  it("renders chart and legend when entries are provided", () => {
    const entries = [
      entry({ id: "1", asset_type: "stock", current_value: 500, cost_basis: 400 }),
      entry({ id: "2", asset_type: "fii", current_value: 300, cost_basis: 280 }),
    ];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    expect(wrapper.find(".ui-chart-stub").exists()).toBe(true);
    expect(wrapper.findAll(".investments-panel__legend li")).toHaveLength(2);
  });

  it("aggregates entries by asset_type in the legend", () => {
    const entries = [
      entry({ id: "1", asset_type: "stock", current_value: 200, cost_basis: 150 }),
      entry({ id: "2", asset_type: "stock", current_value: 300, cost_basis: 250 }),
      entry({ id: "3", asset_type: "crypto", current_value: 100, cost_basis: 50 }),
    ];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    expect(wrapper.findAll(".investments-panel__legend li")).toHaveLength(2);
  });

  it("renders profit trend badge when cost basis is known", () => {
    const entries = [
      entry({ id: "1", asset_type: "stock", current_value: 200, cost_basis: 100 }),
    ];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    const badge = wrapper.find(".trend-badge-stub");
    expect(badge.exists()).toBe(true);
    expect(badge.attributes("data-value")).toBe("100");
  });

  it("applies positive class to profit metric when gain is positive", () => {
    const entries = [entry({ current_value: 200, cost_basis: 100 })];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    expect(wrapper.find(".investments-panel__metric-value strong").classes()).toContain(
      "positive",
    );
  });

  it("applies negative class to profit metric when loss is present", () => {
    const entries = [entry({ current_value: 80, cost_basis: 100 })];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    expect(wrapper.find(".investments-panel__metric-value strong").classes()).toContain(
      "negative",
    );
  });

  it("falls back to current_value when cost_basis is null", () => {
    const entries = [
      entry({ id: "1", current_value: 100, cost_basis: null }),
    ];
    const wrapper = mount(DashboardInvestmentsPanel, {
      props: { entries, loading: false },
      global: { stubs },
    });
    // profit = 100 - 100 = 0 → no trend badge when invested is zero? invested=100 → profitPercent=0
    const badge = wrapper.find(".trend-badge-stub");
    expect(badge.exists()).toBe(true);
    expect(badge.attributes("data-value")).toBe("0");
  });
});
