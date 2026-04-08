import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardTopCategoriesChart from "../DashboardTopCategoriesChart.vue";
import type { DashboardExpenseCategory } from "~/features/dashboard/model/dashboard-overview";

// ── Stubs ─────────────────────────────────────────────────────────────────────

/** Stub for UiChart — canvas not available in JSDOM. */
const UiChartStub = defineComponent({
	props: ["option", "updateKey", "height"],
	template: "<div class=\"ui-chart-stub\" :data-update-key=\"updateKey\" />",
});

/** Stub for UiChartPanel to expose slot content. */
const UiChartPanelStub = defineComponent({
	props: ["title", "subtitle", "loading", "chartHeight"],
	template: `
		<div class="ui-chart-panel-stub" :data-loading="loading" :data-title="title">
			<slot v-if="!loading" />
		</div>
	`,
});

/** Stub for BaseSkeleton. */
const BaseSkeletonStub = defineComponent({
	template: "<div class=\"base-skeleton-stub\" />",
});

const stubs = {
	UiChart: UiChartStub,
	UiChartPanel: UiChartPanelStub,
	BaseSkeleton: BaseSkeletonStub,
};

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockCategories: DashboardExpenseCategory[] = [
	{ category: "Alimentação", amount: 850, percentage: 42.5 },
	{ category: "Transporte", amount: 350, percentage: 17.5 },
	{ category: "Saúde", amount: 280, percentage: 14.0 },
	{ category: "Moradia", amount: 220, percentage: 11.0 },
	{ category: "Lazer", amount: 180, percentage: 9.0 },
	{ category: "Outros", amount: 120, percentage: 6.0 },
];

/**
 * Mounts DashboardTopCategoriesChart with stubbed child components.
 *
 * @param categories - Array of expense categories to pass as prop.
 * @param loading - Whether the loading state is active.
 * @returns VueWrapper around the mounted component.
 */
function mountChart(
	categories: DashboardExpenseCategory[],
	loading = false,
): ReturnType<typeof mount> {
	return mount(DashboardTopCategoriesChart, {
		props: { categories, loading },
		global: { stubs },
	});
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DashboardTopCategoriesChart", () => {
	it("passes loading=true to UiChartPanel", () => {
		const wrapper = mountChart([], true);
		expect(wrapper.find(".ui-chart-panel-stub").attributes("data-loading")).toBe("true");
	});

	it("does not render UiChart when loading", () => {
		const wrapper = mountChart(mockCategories, true);
		expect(wrapper.find(".ui-chart-stub").exists()).toBe(false);
	});

	it("renders UiChart when categories are provided and not loading", () => {
		const wrapper = mountChart(mockCategories);
		expect(wrapper.find(".ui-chart-stub").exists()).toBe(true);
	});

	it("shows empty state message when categories are empty and not loading", () => {
		const wrapper = mountChart([]);
		expect(wrapper.find(".categories-empty").exists()).toBe(true);
		expect(wrapper.find(".categories-empty").text()).toContain("Sem dados de categorias");
	});

	it("does not show empty state when categories are provided", () => {
		const wrapper = mountChart(mockCategories);
		expect(wrapper.find(".categories-empty").exists()).toBe(false);
	});

	it("renders at most top 5 categories (slices correctly)", () => {
		const wrapper = mountChart(mockCategories);
		const chart = wrapper.find(".ui-chart-stub");
		// UiChart should be rendered (confirming data was passed) — 6 categories → only top 5 used
		expect(chart.exists()).toBe(true);
		// The updateKey equals the top5 length which is 5 (sliced from 6)
		expect(chart.attributes("data-update-key")).toBe("5");
	});

	it("renders UiChart with correct updateKey when exactly 5 categories are given", () => {
		const five = mockCategories.slice(0, 5);
		const wrapper = mountChart(five);
		expect(wrapper.find(".ui-chart-stub").attributes("data-update-key")).toBe("5");
	});
});
