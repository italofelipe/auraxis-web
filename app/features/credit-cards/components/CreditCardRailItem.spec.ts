import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CreditCardRailItem from "./CreditCardRailItem.vue";

const base = {
  label: "Nubank",
  subtitle: "Mastercard",
  amount: 1234,
  selected: false,
  color: "#820AD1",
};

describe("CreditCardRailItem", () => {
  it("renders label and subtitle", () => {
    const wrapper = mount(CreditCardRailItem, { props: base });
    expect(wrapper.text()).toContain("Nubank");
    expect(wrapper.text()).toContain("Mastercard");
  });

  it("emits select on click", async () => {
    const wrapper = mount(CreditCardRailItem, { props: base });
    await wrapper.get("[data-testid='cc-rail-item']").trigger("click");
    expect(wrapper.emitted("select")).toHaveLength(1);
  });

  it("marks the selected state", () => {
    const wrapper = mount(CreditCardRailItem, { props: { ...base, selected: true } });
    expect(wrapper.get("[data-testid='cc-rail-item']").classes()).toContain("cc-rail-item--selected");
  });

  it("shows the utilization meter only when a percentage is provided", () => {
    expect(mount(CreditCardRailItem, { props: base }).find(".cc-rail-item__meter").exists()).toBe(false);
    expect(
      mount(CreditCardRailItem, { props: { ...base, utilizationPct: 40 } })
        .find(".cc-rail-item__meter")
        .exists(),
    ).toBe(true);
  });

  it("renders the 'all cards' icon variant without a brand logo", () => {
    const wrapper = mount(CreditCardRailItem, { props: { ...base, isAll: true } });
    expect(wrapper.find(".cc-rail-item__all").exists()).toBe(true);
    expect(wrapper.find("[data-testid='cc-brand-logo']").exists()).toBe(false);
  });
});
