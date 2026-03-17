import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import DashboardPeriodSelector from "./DashboardPeriodSelector.vue";
import type { DashboardPeriod } from "~/features/dashboard/model/dashboard-period";

describe("DashboardPeriodSelector", () => {
  it("renders all four period options", () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: "1m" as DashboardPeriod },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(4);
  });

  it("marks the active period button with the active class", () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: "3m" as DashboardPeriod },
    });

    const activeButtons = wrapper
      .findAll("button")
      .filter((b) => b.classes("period-selector__btn--active"));

    expect(activeButtons).toHaveLength(1);
    expect(activeButtons[0]?.text()).toContain("3 meses");
  });

  it("emits update:modelValue and period-change when a button is clicked", async () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: "1m" as DashboardPeriod },
    });

    const sixMonthButton = wrapper
      .findAll("button")
      .find((b) => b.text().includes("6 meses"));

    await sixMonthButton?.trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["6m"]);
    expect(wrapper.emitted("period-change")?.[0]).toEqual(["6m"]);
  });

  it("sets aria-pressed true only on the active button", () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: "12m" as DashboardPeriod },
    });

    const pressedButtons = wrapper
      .findAll("button")
      .filter((b) => b.attributes("aria-pressed") === "true");


    expect(pressedButtons).toHaveLength(1);
    expect(pressedButtons[0]?.text()).toContain("12 meses");
  });

  it("has a role=group wrapper with an accessible label", () => {
    const wrapper = mount(DashboardPeriodSelector, {
      props: { modelValue: "1m" as DashboardPeriod },
    });

    const group = wrapper.find("[role='group']");
    expect(group.exists()).toBe(true);
    expect(group.attributes("aria-label")).toBeTruthy();
  });
});
