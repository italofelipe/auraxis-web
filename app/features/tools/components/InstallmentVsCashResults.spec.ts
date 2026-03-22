import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import InstallmentVsCashResults from "./InstallmentVsCashResults.vue";
import UiInfoTooltip from "~/shared/components/UiInfoTooltip/UiInfoTooltip.vue";
import type { InstallmentVsCashCalculation } from "~/features/tools/model/installment-vs-cash";

const calculation: InstallmentVsCashCalculation = {
  toolId: "installment_vs_cash",
  ruleVersion: "2026.1",
  input: {
    cashPrice: 900,
    installmentCount: 3,
    installmentAmount: 330,
    installmentTotal: 990,
    firstPaymentDelayDays: 30,
    opportunityRateType: "manual",
    opportunityRateAnnual: 12,
    inflationRateAnnual: 4.5,
    feesUpfront: 0,
    scenarioLabel: "Notebook",
  },
  result: {
    recommendedOption: "cash",
    recommendationReason: "À vista ficou melhor.",
    formulaExplainer: "Comparação por valor presente.",
    comparison: {
      cashOptionTotal: 900,
      installmentOptionTotal: 990,
      installmentPresentValue: 940,
      installmentRealValueToday: 930,
      presentValueDeltaVsCash: 40,
      absoluteDeltaVsCash: 90,
      relativeDeltaVsCashPercent: 4.44,
      breakEvenDiscountPercent: 9.09,
      breakEvenOpportunityRateAnnual: 18.2,
    },
    options: {
      cash: { total: 900 },
      installment: {
        count: 3,
        amounts: [330, 330, 330],
        installmentAmount: 330,
        nominalTotal: 990,
        upfrontFees: 0,
        firstPaymentDelayDays: 30,
      },
    },
    neutralityBand: {
      absoluteBrl: 10,
      relativePercent: 1,
    },
    assumptions: {
      opportunityRateType: "manual",
      opportunityRateAnnualPercent: 12,
      inflationRateAnnualPercent: 4.5,
      periodicity: "monthly",
      firstPaymentDelayDays: 30,
      upfrontFeesApplyTo: "installment",
      neutralityRule: "hybrid",
    },
    indicatorSnapshot: null,
    schedule: [
      {
        installmentNumber: 1,
        dueInDays: 30,
        amount: 330,
        presentValue: 326,
        realValueToday: 328,
        cumulativeNominal: 330,
        cumulativePresentValue: 326,
        cumulativeRealValueToday: 328,
        cashCumulative: 900,
      },
    ],
  },
};

const stubs = {
  UiGlassPanel: { template: "<div><slot /></div>" },
  UiSurfaceCard: { template: "<div><slot /></div>" },
  UiPageHeader: {
    props: ["title", "subtitle"],
    template: "<div><span>{{ title }}</span><span>{{ subtitle }}</span></div>",
  },
  UiMetricCard: {
    props: ["label", "value", "trend"],
    template: "<div class='metric'>{{ label }} {{ value }}</div>",
  },
  UiChart: {
    props: ["option", "height", "updateKey"],
    template: "<div class='chart' />",
  },
  NTag: {
    props: ["type", "size", "round"],
    template: "<span class='n-tag'><slot /></span>",
  },
  NThing: {
    props: ["title", "description"],
    template: "<div><strong>{{ title }}</strong><span>{{ description }}</span><slot /></div>",
  },
  NCollapse: { template: "<div><slot /></div>" },
  NCollapseItem: {
    props: ["title", "name"],
    template: "<section><h3>{{ title }}</h3><slot /></section>",
  },
  NDataTable: {
    props: ["columns", "data"],
    template: "<div class='table'>{{ data.length }}</div>",
  },
  NTooltip: {
    template: "<div><slot name='trigger' /><slot /></div>",
  },
  NButton: {
    props: ["text", "type", "ariaLabel"],
    template: "<button :aria-label='ariaLabel'><slot /></button>",
  },
  UiIcon: {
    template: "<svg class='ui-icon' />",
  },
};

describe("InstallmentVsCashResults", () => {
  it("renders the recommendation summary and detailed sections", () => {
    const wrapper = mount(InstallmentVsCashResults, {
      props: { calculation },
      global: { stubs },
    });

    expect(wrapper.text()).toContain("À vista é a melhor escolha");
    expect(wrapper.text()).toContain("Comparação mês a mês");
    expect(wrapper.text()).toContain("Cronograma mês a mês");
  });

  it("renders contextual tooltip copy in the result details", () => {
    const wrapper = mount(InstallmentVsCashResults, {
      props: { calculation },
      global: { stubs },
    });

    const tooltips = wrapper.findAllComponents(UiInfoTooltip);

    expect(tooltips.length).toBeGreaterThanOrEqual(1);
    expect(tooltips[0]?.props("label")).toBe("Entender valor presente");
    expect(wrapper.text()).toContain("Parcelado em valor presente");
  });
});
