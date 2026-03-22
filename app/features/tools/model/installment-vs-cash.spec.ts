import { describe, expect, it } from "vitest";

import {
  buildInstallmentVsCashChartOption,
  createDefaultInstallmentVsCashFormState,
  isInstallmentVsCashCalculation,
  isInstallmentVsCashPendingPayload,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashForm,
  type InstallmentVsCashCalculation,
} from "./installment-vs-cash";

/**
 * Builds a minimal valid calculation fixture.
 *
 * @returns Calculation fixture used in model tests.
 */
const makeCalculation = (): InstallmentVsCashCalculation => ({
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
        installmentNumber: 0,
        dueInDays: 0,
        amount: 0,
        presentValue: 0,
        realValueToday: 0,
        cumulativeNominal: 0,
        cumulativePresentValue: 0,
        cumulativeRealValueToday: 0,
        cashCumulative: 900,
      },
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
});

describe("installment-vs-cash model helpers", () => {
  it("creates a request dto from a valid form state", () => {
    const form = createDefaultInstallmentVsCashFormState();
    form.scenarioLabel = "Notebook";
    form.cashPrice = 900;
    form.installmentCount = 3;
    form.installmentTotal = 990;

    const payload = toInstallmentVsCashCalculationRequest(form);

    expect(payload.cash_price).toBe("900.00");
    expect(payload.installment_total).toBe("990.00");
    expect(payload.first_payment_delay_days).toBe(30);
    expect(payload.scenario_label).toBe("Notebook");
  });

  it("validates missing required fields", () => {
    const errors = validateInstallmentVsCashForm(
      createDefaultInstallmentVsCashFormState(),
    );

    expect(errors.map((item) => item.field)).toContain("cashPrice");
    expect(errors.map((item) => item.field)).toContain("installmentTotal");
  });

  it("builds chart option with the expected series", () => {
    const option = buildInstallmentVsCashChartOption(makeCalculation());
    const series = option.series as Array<{ name: string }>;

    expect(series).toHaveLength(3);
    expect(series.map((item) => item.name)).toEqual([
      "À vista",
      "Parcelado nominal",
      "Parcelado em valor presente",
    ]);
  });

  it("accepts a valid pending payload shape", () => {
    const payload = { form: createDefaultInstallmentVsCashFormState() };
    expect(isInstallmentVsCashPendingPayload(payload)).toBe(true);
  });

  it("accepts a valid restored calculation", () => {
    expect(isInstallmentVsCashCalculation(makeCalculation())).toBe(true);
  });
});
