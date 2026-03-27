import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardTransactionsPanel from "./DashboardTransactionsPanel.vue";
import type { DashboardTransactionsPanelProps } from "./DashboardTransactionsPanel.types";
import type {
  DashboardExpenseCategory,
  DashboardUpcomingDue,
} from "~/features/dashboard/model/dashboard-overview";

// ── Stubs ────────────────────────────────────────────────────────────────────

const UiListPanelStub = defineComponent({
  props: ["title", "loading"],
  template: `
    <div class="ui-list-panel" :data-loading="loading" :data-title="title">
      <slot name="filters" />
      <slot />
    </div>
  `,
});

const UiSegmentedControlStub = defineComponent({
  props: ["modelValue", "options"],
  emits: ["update:modelValue"],
  template: "<div class=\"ui-segmented-control\"><button v-for=\"opt in options\" :key=\"opt.value\" class=\"sc-option\" :data-value=\"opt.value\" :aria-pressed=\"opt.value === modelValue\" type=\"button\" @click=\"$emit('update:modelValue', opt.value)\">{{ opt.label }}</button></div>",
});

const UiEmptyStateStub = defineComponent({
  props: ["title", "description", "compact", "icon"],
  template: "<div class=\"ui-empty-state\">{{ title }}</div>",
});

const stubs = {
  UiListPanel: UiListPanelStub,
  UiSegmentedControl: UiSegmentedControlStub,
  UiEmptyState: UiEmptyStateStub,
};

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockDues: DashboardUpcomingDue[] = [
  { id: "1", description: "Aluguel", amount: 1500, dueDate: "2026-04-05", category: "Moradia" },
  { id: "2", description: "Internet", amount: 130, dueDate: "2026-04-10", category: null },
];

const mockCategories: DashboardExpenseCategory[] = [
  { category: "Alimentação", amount: 850, percentage: 42.5 },
  { category: "Transporte", amount: 350, percentage: 17.5 },
];

/**
 * Mounts DashboardTransactionsPanel with child components stubbed for isolation.
 *
 * @param props - Component props.
 * @returns VueWrapper around the mounted component.
 */
function mountPanel(props: DashboardTransactionsPanelProps): ReturnType<typeof mount> {
  return mount(DashboardTransactionsPanel, { props, global: { stubs } });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("DashboardTransactionsPanel", () => {
  it("passes loading state to UiListPanel", () => {
    const wrapper = mountPanel({ upcomingDues: [], expensesByCategory: [], isLoading: true });
    expect(wrapper.find(".ui-list-panel").attributes("data-loading")).toBe("true");
  });

  it("renders the segmented control filter", () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: mockCategories, isLoading: false });
    expect(wrapper.find(".ui-segmented-control").exists()).toBe(true);
  });

  it("shows upcoming dues by default (activeTab = dues)", () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: mockCategories, isLoading: false });
    expect(wrapper.findAll(".transaction-row")).toHaveLength(2);
    expect(wrapper.findAll(".category-row")).toHaveLength(0);
  });

  it("shows empty state when dues list is empty", () => {
    const wrapper = mountPanel({ upcomingDues: [], expensesByCategory: mockCategories, isLoading: false });
    expect(wrapper.find(".ui-empty-state").exists()).toBe(true);
    expect(wrapper.findAll(".transaction-row")).toHaveLength(0);
  });

  it("switches to expenses view when 'expenses' tab is selected", async () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: mockCategories, isLoading: false });

    // Trigger tab switch via the stub's button click
    const expensesBtn = wrapper.findAll(".sc-option").find(
      (btn) => btn.attributes("data-value") === "expenses",
    );
    await expensesBtn?.trigger("click");

    expect(wrapper.findAll(".category-row")).toHaveLength(2);
    expect(wrapper.findAll(".transaction-row")).toHaveLength(0);
  });

  it("shows empty state when category list is empty while on expenses tab", async () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: [], isLoading: false });

    const expensesBtn = wrapper.findAll(".sc-option").find(
      (btn) => btn.attributes("data-value") === "expenses",
    );
    await expensesBtn?.trigger("click");

    expect(wrapper.find(".ui-empty-state").exists()).toBe(true);
    expect(wrapper.findAll(".category-row")).toHaveLength(0);
  });

  it("renders formatted currency amounts for dues", () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: [], isLoading: false });
    const text = wrapper.text();
    expect(text).toContain("R$");
  });

  it("renders category percentage and progress bar", async () => {
    const wrapper = mountPanel({ upcomingDues: [], expensesByCategory: mockCategories, isLoading: false });

    const expensesBtn = wrapper.findAll(".sc-option").find(
      (btn) => btn.attributes("data-value") === "expenses",
    );
    await expensesBtn?.trigger("click");

    const firstRow = wrapper.find(".category-row");
    expect(firstRow.text()).toContain("Alimentação");
    expect(firstRow.text()).toContain("42.5%");
    expect(firstRow.find(".category-row__bar-fill").exists()).toBe(true);
  });

  it("updates panel title when switching tabs", async () => {
    const wrapper = mountPanel({ upcomingDues: mockDues, expensesByCategory: mockCategories, isLoading: false });

    expect(wrapper.find(".ui-list-panel").attributes("data-title")).toContain("vencimentos");

    const expensesBtn = wrapper.findAll(".sc-option").find(
      (btn) => btn.attributes("data-value") === "expenses",
    );
    await expensesBtn?.trigger("click");

    expect(wrapper.find(".ui-list-panel").attributes("data-title")).toContain("categoria");
  });
});
