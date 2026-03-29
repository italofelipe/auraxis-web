import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { NTag } from "naive-ui";
import CalculatorResultSummary from "../CalculatorResultSummary.vue";

describe("CalculatorResultSummary", () => {
  it("renders label", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado" },
    });
    expect(wrapper.text()).toContain("Recomendação");
  });

  it("renders value", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado" },
    });
    expect(wrapper.find(".calculator-result-summary__value").text()).toBe("Parcelado");
  });

  it("renders reason when provided", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: {
        label: "Recomendação",
        value: "À Vista",
        reason: "O desconto compensa o custo de oportunidade.",
      },
    });
    expect(wrapper.find(".calculator-result-summary__reason").text()).toContain(
      "O desconto compensa o custo de oportunidade.",
    );
  });

  it("does not render reason element when reason is not provided", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado" },
    });
    expect(wrapper.find(".calculator-result-summary__reason").exists()).toBe(false);
  });

  it("renders NTag badge when badge prop is provided", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado", badge: "success" },
      global: { components: { NTag } },
    });
    expect(wrapper.findComponent(NTag).exists()).toBe(true);
  });

  it("does not render NTag badge when badge prop is absent", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado" },
      global: { components: { NTag } },
    });
    expect(wrapper.findComponent(NTag).exists()).toBe(false);
  });

  it("passes the correct type to NTag for success badge", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado", badge: "success" },
      global: { components: { NTag } },
    });
    expect(wrapper.findComponent(NTag).props("type")).toBe("success");
  });

  it("passes the correct type to NTag for warning badge", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "À Vista", badge: "warning" },
      global: { components: { NTag } },
    });
    expect(wrapper.findComponent(NTag).props("type")).toBe("warning");
  });

  it("renders metrics when provided", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: {
        label: "Recomendação",
        value: "Parcelado",
        metrics: [
          { label: "Preço à vista", value: "R$ 900,00" },
          { label: "Parcelado nominal", value: "R$ 990,00" },
        ],
      },
    });
    expect(wrapper.find(".calculator-result-summary__metrics").exists()).toBe(true);
    expect(wrapper.text()).toContain("Preço à vista");
    expect(wrapper.text()).toContain("R$ 900,00");
  });

  it("does not render metrics grid when metrics is empty", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: { label: "Recomendação", value: "Parcelado", metrics: [] },
    });
    expect(wrapper.find(".calculator-result-summary__metrics").exists()).toBe(false);
  });

  it("renders metrics grid with correct item count", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: {
        label: "Recomendação",
        value: "Parcelado",
        metrics: [
          { label: "A", value: "1" },
          { label: "B", value: "2" },
          { label: "C", value: "3" },
        ],
      },
    });
    expect(wrapper.findAll(".ui-metric-card").length).toBe(3);
  });

  it("matches snapshot with all props", () => {
    const wrapper = mount(CalculatorResultSummary, {
      props: {
        label: "Recomendação",
        value: "Parcelado",
        reason: "Parcelado é melhor neste cenário.",
        badge: "success",
        metrics: [{ label: "Valor", value: "R$ 100,00" }],
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
