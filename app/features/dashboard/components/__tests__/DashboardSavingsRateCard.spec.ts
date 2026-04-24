import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardSavingsRateCard from "../DashboardSavingsRateCard.vue";
import type { DashboardSummary } from "~/features/dashboard/model/dashboard-overview";

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
  template: "<div class=\"client-only-stub\"><slot /></div>",
});

const IconStub = { template: "<span />" };

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  UiTrendBadge: UiTrendBadgeStub,
  UiChart: UiChartStub,
  ClientOnly: ClientOnlyStub,
  PiggyBank: IconStub,
};

/**
 * Builds a dashboard summary fixture.
 *
 * @param income Period income total.
 * @param balance Period balance (income - expense).
 * @returns DashboardSummary fixture with expense derived from income and balance.
 */
function makeSummary(income: number, balance: number): DashboardSummary {
  return {
    income,
    expense: income - balance,
    balance,
    upcomingDueTotal: 0,
    netWorth: 0,
  };
}

describe("DashboardSavingsRateCard", () => {
  it("shows em-dash when summary is null", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: null },
      global: { stubs },
    });
    expect(wrapper.find(".savings-rate-card__value").text()).toContain("—");
  });

  it("shows em-dash when income is zero", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: makeSummary(0, 0) },
      global: { stubs },
    });
    expect(wrapper.find(".savings-rate-card__value").text()).toContain("—");
  });

  it("renders positive tone when saving >= 20% of income", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: makeSummary(1000, 300) },
      global: { stubs },
    });
    const value = wrapper.find(".savings-rate-card__value");
    expect(value.classes()).toContain("savings-rate-card__value--positive");
    expect(value.text()).toContain("+30,0%");
  });

  it("renders warning tone when saving between 10% and 20%", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: makeSummary(1000, 150) },
      global: { stubs },
    });
    expect(wrapper.find(".savings-rate-card__value").classes()).toContain(
      "savings-rate-card__value--warning",
    );
  });

  it("renders negative tone on deficit", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: makeSummary(1000, -200) },
      global: { stubs },
    });
    expect(wrapper.find(".savings-rate-card__value").classes()).toContain(
      "savings-rate-card__value--negative",
    );
  });

  it("computes delta from previous summary when provided", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: {
        summary: makeSummary(1000, 300),
        previousSummary: makeSummary(1000, 200),
      },
      global: { stubs },
    });
    const badge = wrapper.find(".trend-badge-stub");
    expect(badge.exists()).toBe(true);
    expect(badge.attributes("data-value")).toBe("10");
  });

  it("hides delta badge when previous summary is absent", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: makeSummary(1000, 300) },
      global: { stubs },
    });
    expect(wrapper.find(".trend-badge-stub").exists()).toBe(false);
  });

  it("shows loading skeleton when loading", () => {
    const wrapper = mount(DashboardSavingsRateCard, {
      props: { summary: null, loading: true },
      global: { stubs },
    });
    expect(wrapper.find(".savings-rate-card__skeleton").exists()).toBe(true);
    expect(wrapper.find(".savings-rate-card__value").exists()).toBe(false);
  });
});
