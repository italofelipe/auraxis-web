import { describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DashboardQuickAdd from "../DashboardQuickAdd.vue";

vi.mock(
  "~/components/transactions/QuickTransactionForm/QuickTransactionForm.vue",
  () => ({
    default: {
      name: "QuickTransactionForm",
      props: ["visible", "type"],
      emits: ["update:visible", "success"],
      template: "<div class=\"stub-form\" :data-type=\"type\" :data-visible=\"visible\" />",
    },
  }),
);

describe("DashboardQuickAdd", () => {
  it("renders income and expense buttons", () => {
    const wrapper = mount(DashboardQuickAdd);
    expect(wrapper.text()).toContain("Nova Receita");
    expect(wrapper.text()).toContain("Nova Despesa");
  });

  it("opens income modal when income button is clicked", async () => {
    const wrapper = mount(DashboardQuickAdd);
    const incomeBtn = wrapper.findAll("button").find((b) => b.text().includes("Nova Receita"));
    await incomeBtn?.trigger("click");
    const form = wrapper.findAll(".stub-form").find(
      (el) => el.attributes("data-type") === "income",
    );
    expect(form?.attributes("data-visible")).toBe("true");
  });

  it("opens expense modal when expense button is clicked", async () => {
    const wrapper = mount(DashboardQuickAdd);
    const expenseBtn = wrapper.findAll("button").find((b) => b.text().includes("Nova Despesa"));
    await expenseBtn?.trigger("click");
    const form = wrapper.findAll(".stub-form").find(
      (el) => el.attributes("data-type") === "expense",
    );
    expect(form?.attributes("data-visible")).toBe("true");
  });

  it("both modals start as not visible", () => {
    const wrapper = mount(DashboardQuickAdd);
    const forms = wrapper.findAll(".stub-form");
    forms.forEach((f) => {
      expect(f.attributes("data-visible")).toBe("false");
    });
  });
});
