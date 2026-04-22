import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import SurvivalIndexCard from "../SurvivalIndexCard.vue";
import type { DashboardSurvivalIndex } from "~/features/dashboard/model/dashboard-survival-index";

const UiSurfaceCardStub = defineComponent({
  template: "<div class=\"ui-surface-card-stub\"><slot /></div>",
});

const UiEmptyStateStub = defineComponent({
  props: ["title", "description", "compact"],
  template: "<div class=\"ui-empty-state-stub\" :data-title=\"title\" />",
});

const stubs = {
  UiSurfaceCard: UiSurfaceCardStub,
  UiEmptyState: UiEmptyStateStub,
};

/**
 * Mounts SurvivalIndexCard with stubbed surface + empty-state children.
 *
 * @param data - Survival-index domain model (or null for empty state).
 * @param loading - Whether the card should render the loading skeleton.
 * @returns VueWrapper around the mounted card.
 */
function mountCard(
  data: DashboardSurvivalIndex | null,
  loading = false,
): ReturnType<typeof mount> {
  return mount(SurvivalIndexCard, {
    props: { data, loading },
    global: { stubs },
  });
}

const baseData: DashboardSurvivalIndex = {
  months: 8.4,
  totalAssets: 120_000,
  avgMonthlyExpense: 14_200,
  classification: "ok",
};

describe("SurvivalIndexCard", () => {
  it("renders skeleton when loading", () => {
    const wrapper = mountCard(baseData, true);
    expect(wrapper.find(".survival-index-card__skeleton").exists()).toBe(true);
    expect(wrapper.find(".survival-index-card__value").exists()).toBe(false);
  });

  it("renders empty state when data is null", () => {
    const wrapper = mountCard(null);
    expect(wrapper.find(".ui-empty-state-stub").exists()).toBe(true);
    expect(wrapper.find(".survival-index-card__value").exists()).toBe(false);
  });

  it("renders empty state when months is null", () => {
    const wrapper = mountCard({ ...baseData, months: null });
    expect(wrapper.find(".ui-empty-state-stub").exists()).toBe(true);
  });

  it("classifies <3 months as critical", () => {
    const wrapper = mountCard({ ...baseData, months: 2.1 });
    expect(wrapper.classes()).toContain("survival-index-card--critical");
    expect(wrapper.find(".survival-index-card__badge").text()).toContain("crítica");
  });

  it("classifies 3–5.9 months as low", () => {
    const wrapper = mountCard({ ...baseData, months: 5.5 });
    expect(wrapper.classes()).toContain("survival-index-card--low");
    expect(wrapper.find(".survival-index-card__badge").text()).toContain("baixa");
  });

  it("classifies 6–11.9 months as ok", () => {
    const wrapper = mountCard({ ...baseData, months: 8.4 });
    expect(wrapper.classes()).toContain("survival-index-card--ok");
  });

  it("classifies ≥12 months as comfortable", () => {
    const wrapper = mountCard({ ...baseData, months: 18 });
    expect(wrapper.classes()).toContain("survival-index-card--comfortable");
  });

  it("caps display at 24+ when months ≥ 24", () => {
    const wrapper = mountCard({ ...baseData, months: 36 });
    expect(wrapper.find(".survival-index-card__value strong").text()).toBe("24+");
  });

  it("formats months with 1 decimal", () => {
    const wrapper = mountCard({ ...baseData, months: 8.4 });
    expect(wrapper.find(".survival-index-card__value strong").text()).toBe("8.4");
  });

  it("renders tooltip with formatted currency", () => {
    const wrapper = mountCard(baseData);
    const tooltip = wrapper.find(".survival-index-card__tooltip").text();
    expect(tooltip).toContain("patrimônio");
    expect(tooltip).toContain("despesas médias");
  });
});
