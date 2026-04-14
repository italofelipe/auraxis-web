import { describe, expect, it } from "vitest";
import {
  createDefaultInstallmentVsCashFormState,
  getRecommendationLabel,
  isInstallmentVsCashCalculation,
  isInstallmentVsCashPendingPayload,
  resolveFirstPaymentDelayDays,
  toInstallmentVsCashCalculationRequest,
  validateInstallmentVsCashForm,
  type InstallmentVsCashFormState,
} from "../useInstallmentVsCashCalculator";

describe("useInstallmentVsCashCalculator — validateInstallmentVsCashForm", () => {
  /**
   * Returns a fully valid form state for testing.
   *
   * @returns Valid InstallmentVsCashFormState.
   */
  function validForm(): InstallmentVsCashFormState {
    return {
      scenarioLabel: "Test",
      cashPrice: 1_000,
      installmentCount: 6,
      installmentInputMode: "total",
      installmentAmount: null,
      installmentTotal: 1_100,
      firstPaymentDelayPreset: "30_days",
      customFirstPaymentDelayDays: null,
      opportunityRateType: "manual",
      opportunityRateAnnual: 12,
      inflationRateAnnual: 4.5,
      feesEnabled: false,
      feesUpfront: null,
    };
  }

  it("returns no errors for a complete valid form", () => {
    expect(validateInstallmentVsCashForm(validForm())).toHaveLength(0);
  });

  it("requires cashPrice > 0", () => {
    const form = { ...validForm(), cashPrice: null };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "cashPrice")).toBe(true);
  });

  it("requires installmentCount >= 1", () => {
    const form = { ...validForm(), installmentCount: 0 };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "installmentCount")).toBe(true);
  });

  it("requires installmentAmount when mode = amount", () => {
    const form: InstallmentVsCashFormState = {
      ...validForm(),
      installmentInputMode: "amount",
      installmentAmount: null,
    };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "installmentAmount")).toBe(true);
  });

  it("requires installmentTotal when mode = total", () => {
    const form: InstallmentVsCashFormState = {
      ...validForm(),
      installmentInputMode: "total",
      installmentTotal: null,
    };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "installmentTotal")).toBe(true);
  });

  it("requires customFirstPaymentDelayDays when preset = custom", () => {
    const form: InstallmentVsCashFormState = {
      ...validForm(),
      firstPaymentDelayPreset: "custom",
      customFirstPaymentDelayDays: null,
    };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "customFirstPaymentDelayDays")).toBe(true);
  });

  it("requires opportunityRateAnnual when type = manual", () => {
    const form: InstallmentVsCashFormState = {
      ...validForm(),
      opportunityRateType: "manual",
      opportunityRateAnnual: null,
    };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "opportunityRateAnnual")).toBe(true);
  });

  it("requires feesUpfront when feesEnabled = true", () => {
    const form: InstallmentVsCashFormState = {
      ...validForm(),
      feesEnabled: true,
      feesUpfront: null,
    };
    expect(validateInstallmentVsCashForm(form).some((e) => e.field === "feesUpfront")).toBe(true);
  });
});

describe("useInstallmentVsCashCalculator — resolveFirstPaymentDelayDays", () => {
  it("returns 0 for preset \"today\"", () => {
    const form = {
      ...createDefaultInstallmentVsCashFormState(),
      firstPaymentDelayPreset: "today" as const,
    };
    expect(resolveFirstPaymentDelayDays(form)).toBe(0);
  });

  it("returns 30 for preset \"30_days\"", () => {
    const form = {
      ...createDefaultInstallmentVsCashFormState(),
      firstPaymentDelayPreset: "30_days" as const,
    };
    expect(resolveFirstPaymentDelayDays(form)).toBe(30);
  });

  it("returns 45 for preset \"45_days\"", () => {
    const form = {
      ...createDefaultInstallmentVsCashFormState(),
      firstPaymentDelayPreset: "45_days" as const,
    };
    expect(resolveFirstPaymentDelayDays(form)).toBe(45);
  });

  it("returns the custom value for preset \"custom\"", () => {
    const form = {
      ...createDefaultInstallmentVsCashFormState(),
      firstPaymentDelayPreset: "custom" as const,
      customFirstPaymentDelayDays: 60,
    };
    expect(resolveFirstPaymentDelayDays(form)).toBe(60);
  });

  it("returns 0 when custom preset has null delay", () => {
    const form = {
      ...createDefaultInstallmentVsCashFormState(),
      firstPaymentDelayPreset: "custom" as const,
      customFirstPaymentDelayDays: null,
    };
    expect(resolveFirstPaymentDelayDays(form)).toBe(0);
  });
});

describe("useInstallmentVsCashCalculator — getRecommendationLabel", () => {
  it("returns cash label for \"cash\"", () => {
    expect(getRecommendationLabel("cash")).toContain("vista");
  });

  it("returns installment label for \"installment\"", () => {
    expect(getRecommendationLabel("installment")).toContain("Parcelado");
  });

  it("returns equivalent label for \"equivalent\"", () => {
    expect(getRecommendationLabel("equivalent")).toContain("empatadas");
  });
});

describe("useInstallmentVsCashCalculator — toInstallmentVsCashCalculationRequest", () => {
  it("includes installment_amount when mode = amount", () => {
    const form: InstallmentVsCashFormState = {
      ...createDefaultInstallmentVsCashFormState(),
      cashPrice: 1_000,
      installmentCount: 6,
      installmentInputMode: "amount",
      installmentAmount: 200,
      installmentTotal: null,
      opportunityRateType: "manual",
      opportunityRateAnnual: 12,
      inflationRateAnnual: 4.5,
    };
    const req = toInstallmentVsCashCalculationRequest(form);
    expect(req.installment_amount).toBe("200.00");
    expect(req.installment_total).toBeUndefined();
  });

  it("includes installment_total when mode = total", () => {
    const form: InstallmentVsCashFormState = {
      ...createDefaultInstallmentVsCashFormState(),
      cashPrice: 1_000,
      installmentCount: 6,
      installmentInputMode: "total",
      installmentAmount: null,
      installmentTotal: 1_100,
      opportunityRateType: "manual",
      opportunityRateAnnual: 12,
      inflationRateAnnual: 4.5,
    };
    const req = toInstallmentVsCashCalculationRequest(form);
    expect(req.installment_total).toBe("1100.00");
    expect(req.installment_amount).toBeUndefined();
  });

  it("omits opportunity_rate_annual when type != manual", () => {
    const form: InstallmentVsCashFormState = {
      ...createDefaultInstallmentVsCashFormState(),
      cashPrice: 1_000,
      installmentCount: 6,
      installmentInputMode: "total",
      installmentTotal: 1_100,
      opportunityRateType: "product_default",
      opportunityRateAnnual: null,
      inflationRateAnnual: 4.5,
    };
    const req = toInstallmentVsCashCalculationRequest(form);
    expect(req.opportunity_rate_annual).toBeUndefined();
  });
});

describe("useInstallmentVsCashCalculator — type guards", () => {
  it("isInstallmentVsCashPendingPayload detects valid payload shape", () => {
    const payload = {
      form: {
        scenarioLabel: "",
        installmentInputMode: "total",
        firstPaymentDelayPreset: "30_days",
        opportunityRateType: "manual",
        feesEnabled: false,
      },
    };
    expect(isInstallmentVsCashPendingPayload(payload)).toBe(true);
  });

  it("isInstallmentVsCashPendingPayload rejects null", () => {
    expect(isInstallmentVsCashPendingPayload(null)).toBe(false);
  });

  it("isInstallmentVsCashCalculation detects valid calculation shape", () => {
    const calculation = {
      toolId: "installment_vs_cash",
      ruleVersion: "1.0",
      input: {},
      result: {
        recommendedOption: "cash",
      },
    };
    expect(isInstallmentVsCashCalculation(calculation)).toBe(true);
  });

  it("isInstallmentVsCashCalculation rejects malformed objects", () => {
    expect(isInstallmentVsCashCalculation({ toolId: "foo" })).toBe(false);
  });
});
