import type { EChartsOption } from "echarts";

import { tokens } from "~/utils/naive-theme";
import type {
  InstallmentVsCashCalculationRequestDto,
  OpportunityRateTypeDto,
  RecommendedOptionDto,
  SelectedPaymentOptionDto,
} from "~/features/tools/contracts/installment-vs-cash.dto";

/**
 * Canonical feature id used across API, persistence and tool context restore.
 */
export const INSTALLMENT_VS_CASH_TOOL_ID = "installment_vs_cash";

/**
 * Public route for the page.
 */
export const INSTALLMENT_VS_CASH_PUBLIC_PATH = "/tools/parcelado-vs-a-vista";

/**
 * Human-friendly delay presets exposed by the calculator form.
 */
export type InstallmentDelayPreset = "today" | "30_days" | "45_days" | "custom";

/**
 * Which installment input the user wants to provide.
 */
export type InstallmentInputMode = "amount" | "total";

/**
 * Domain alias for the opportunity-rate selector.
 */
export type OpportunityRateType = OpportunityRateTypeDto;

/**
 * Domain alias for the recommendation returned by the calculator.
 */
export type RecommendedOption = RecommendedOptionDto;

/**
 * Domain alias for selected payment option used in bridge actions.
 */
export type SelectedPaymentOption = SelectedPaymentOptionDto;

/**
 * UI state for the public calculator form.
 */
export interface InstallmentVsCashFormState {
  scenarioLabel: string;
  cashPrice: number | null;
  installmentCount: number | null;
  installmentInputMode: InstallmentInputMode;
  installmentAmount: number | null;
  installmentTotal: number | null;
  firstPaymentDelayPreset: InstallmentDelayPreset;
  customFirstPaymentDelayDays: number | null;
  opportunityRateType: OpportunityRateType;
  opportunityRateAnnual: number | null;
  inflationRateAnnual: number | null;
  feesEnabled: boolean;
  feesUpfront: number | null;
}

/**
 * Normalized input displayed back to the user after calculation.
 */
export interface InstallmentVsCashNormalizedInput {
  cashPrice: number;
  installmentCount: number;
  installmentAmount: number;
  installmentTotal: number;
  firstPaymentDelayDays: number;
  opportunityRateType: OpportunityRateType;
  opportunityRateAnnual: number;
  inflationRateAnnual: number;
  feesUpfront: number;
  scenarioLabel: string | null;
}

/**
 * Snapshot of preset indicators used by the calculator.
 */
export interface InstallmentVsCashIndicatorSnapshot {
  presetType: string;
  source: string;
  annualRatePercent: number;
  asOf: string;
}

/**
 * Numeric comparison output used to explain the recommendation.
 */
export interface InstallmentVsCashComparison {
  cashOptionTotal: number;
  installmentOptionTotal: number;
  installmentPresentValue: number;
  installmentRealValueToday: number;
  presentValueDeltaVsCash: number;
  absoluteDeltaVsCash: number;
  relativeDeltaVsCashPercent: number;
  breakEvenDiscountPercent: number;
  breakEvenOpportunityRateAnnual: number;
}

/**
 * Cash option block.
 */
export interface InstallmentVsCashCashOption {
  total: number;
}

/**
 * Installment option block.
 */
export interface InstallmentVsCashInstallmentOption {
  count: number;
  amounts: number[];
  installmentAmount: number;
  nominalTotal: number;
  upfrontFees: number;
  firstPaymentDelayDays: number;
}

/**
 * Both options presented in the result.
 */
export interface InstallmentVsCashOptions {
  cash: InstallmentVsCashCashOption;
  installment: InstallmentVsCashInstallmentOption;
}

/**
 * Thresholds used to classify close scenarios as equivalent.
 */
export interface InstallmentVsCashNeutralityBand {
  absoluteBrl: number;
  relativePercent: number;
}

/**
 * Assumptions block displayed to the user.
 */
export interface InstallmentVsCashAssumptions {
  opportunityRateType: OpportunityRateType;
  opportunityRateAnnualPercent: number;
  inflationRateAnnualPercent: number;
  periodicity: string;
  firstPaymentDelayDays: number;
  upfrontFeesApplyTo: string;
  neutralityRule: string;
}

/**
 * Schedule line item used for detailed explanation and charting.
 */
export interface InstallmentVsCashScheduleItem {
  installmentNumber: number;
  dueInDays: number;
  amount: number;
  presentValue: number;
  realValueToday: number;
  cumulativeNominal: number;
  cumulativePresentValue: number;
  cumulativeRealValueToday: number;
  cashCumulative: number;
}

/**
 * Full result returned by the calculator.
 */
export interface InstallmentVsCashResult {
  recommendedOption: RecommendedOption;
  recommendationReason: string;
  formulaExplainer: string;
  comparison: InstallmentVsCashComparison;
  options: InstallmentVsCashOptions;
  neutralityBand: InstallmentVsCashNeutralityBand;
  assumptions: InstallmentVsCashAssumptions;
  indicatorSnapshot: InstallmentVsCashIndicatorSnapshot | null;
  schedule: InstallmentVsCashScheduleItem[];
}

/**
 * Full calculation object used by the page.
 */
export interface InstallmentVsCashCalculation {
  toolId: string;
  ruleVersion: string;
  input: InstallmentVsCashNormalizedInput;
  result: InstallmentVsCashResult;
}

/**
 * Specialized saved simulation returned by the feature save endpoint.
 */
export interface InstallmentVsCashSavedSimulation {
  id: string;
  userId: string | null;
  toolId: string;
  ruleVersion: string;
  inputs: InstallmentVsCashNormalizedInput;
  result: InstallmentVsCashResult;
  saved: boolean;
  goalId: string | null;
  createdAt: string;
}

/**
 * Combined response returned by the save endpoint.
 */
export interface InstallmentVsCashSavedCalculation {
  simulation: InstallmentVsCashSavedSimulation;
  calculation: InstallmentVsCashCalculation;
}

/**
 * Goal created from a saved simulation.
 */
export interface InstallmentVsCashGoal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  targetAmount: number;
  currentAmount: number;
  priority: number;
  targetDate: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Response returned by the goal bridge.
 */
export interface InstallmentVsCashGoalBridgeResponse {
  goal: InstallmentVsCashGoal;
  simulation: InstallmentVsCashSavedSimulation;
}

/**
 * Planned transaction generated from the premium expense bridge.
 */
export interface InstallmentVsCashPlannedTransaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  dueDate: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  observation: string | null;
  isRecurring: boolean;
  isInstallment: boolean;
  installmentCount: number | null;
  tagId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  status: string;
  currency: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Response returned by the planned-expense bridge.
 */
export interface InstallmentVsCashPlannedExpenseBridgeResponse {
  transactions: InstallmentVsCashPlannedTransaction[];
  simulation: InstallmentVsCashSavedSimulation;
}

/**
 * Payload used to create a goal from a saved simulation.
 */
export interface CreateInstallmentVsCashGoalPayload {
  title: string;
  selectedOption: SelectedPaymentOption;
  description?: string;
  category?: string;
  targetDate?: string;
  priority?: number;
  currentAmount?: number;
}

/**
 * Payload used to create a planned expense from a saved simulation.
 */
export interface CreateInstallmentVsCashPlannedExpensePayload {
  title: string;
  selectedOption: SelectedPaymentOption;
  description?: string;
  observation?: string;
  dueDate?: string;
  firstDueDate?: string;
  upfrontDueDate?: string;
  tagId?: string;
  accountId?: string;
  creditCardId?: string;
  currency?: "BRL";
  status?: "pending" | "paid" | "cancelled" | "postponed" | "overdue";
}

/**
 * Shape persisted in the tool-context store so the page can survive login
 * redirects without losing the latest form state.
 */
export interface InstallmentVsCashPendingPayload {
  form: InstallmentVsCashFormState;
}

/**
 * User-facing validation error for the calculator form.
 */
export interface InstallmentVsCashValidationError {
  field: keyof InstallmentVsCashFormState | "general";
  message: string;
}

/**
 * Appends an error to the accumulator when the predicate fails.
 *
 * @param errors Current validation accumulator.
 * @param validation Validation envelope with field, message and predicate result.
 */
const pushValidationError = (
  errors: InstallmentVsCashValidationError[],
  validation: InstallmentVsCashValidationError & { valid: boolean },
): void => {
  if (!validation.valid) {
    errors.push({
      field: validation.field,
      message: validation.message,
    });
  }
};

/**
 * Validates the installment value/total block.
 *
 * @param form Current form state.
 * @returns Validation errors related to the payment amount block.
 */
const validateInstallmentInput = (
  form: InstallmentVsCashFormState,
): InstallmentVsCashValidationError[] => {
  const errors: InstallmentVsCashValidationError[] = [];

  if (form.installmentInputMode === "amount") {
    pushValidationError(
      errors,
      {
        valid: form.installmentAmount !== null && form.installmentAmount > 0,
        field: "installmentAmount",
        message: "Informe o valor de cada parcela.",
      },
    );
    return errors;
  }

  pushValidationError(
    errors,
    {
      valid: form.installmentTotal !== null && form.installmentTotal > 0,
      field: "installmentTotal",
      message: "Informe o valor total do parcelamento.",
    },
  );
  return errors;
};

/**
 * Validates the optional custom-delay block.
 *
 * @param form Current form state.
 * @returns Validation errors related to the first-installment timing.
 */
const validateDelayInput = (
  form: InstallmentVsCashFormState,
): InstallmentVsCashValidationError[] => {
  if (form.firstPaymentDelayPreset !== "custom") {
    return [];
  }

  const errors: InstallmentVsCashValidationError[] = [];
  pushValidationError(
    errors,
    {
      valid: form.customFirstPaymentDelayDays !== null
        && form.customFirstPaymentDelayDays >= 0,
      field: "customFirstPaymentDelayDays",
      message: "Informe em quantos dias a primeira parcela vence.",
    },
  );
  return errors;
};

/**
 * Validates the rate assumptions block.
 *
 * @param form Current form state.
 * @returns Validation errors related to rates and fees.
 */
const validateRateInputs = (
  form: InstallmentVsCashFormState,
): InstallmentVsCashValidationError[] => {
  const errors: InstallmentVsCashValidationError[] = [];

  pushValidationError(
    errors,
    {
      valid: form.inflationRateAnnual !== null && form.inflationRateAnnual >= 0,
      field: "inflationRateAnnual",
      message: "Informe a inflação anual usada como premissa.",
    },
  );

  if (form.opportunityRateType === "manual") {
    pushValidationError(
      errors,
      {
        valid: form.opportunityRateAnnual !== null
          && form.opportunityRateAnnual >= 0,
        field: "opportunityRateAnnual",
        message: "Informe a taxa de oportunidade anual.",
      },
    );
  }

  if (form.feesEnabled) {
    pushValidationError(
      errors,
      {
        valid: form.feesUpfront !== null && form.feesUpfront >= 0,
        field: "feesUpfront",
        message: "Informe os custos extras iniciais.",
      },
    );
  }

  return errors;
};

/**
 * Default UI state for the calculator.
 *
 * @returns Fresh form state instance.
 */
export const createDefaultInstallmentVsCashFormState =
(): InstallmentVsCashFormState => ({
  scenarioLabel: "",
  cashPrice: null,
  installmentCount: 6,
  installmentInputMode: "total",
  installmentAmount: null,
  installmentTotal: null,
  firstPaymentDelayPreset: "30_days",
  customFirstPaymentDelayDays: null,
  opportunityRateType: "manual",
  opportunityRateAnnual: 12,
  inflationRateAnnual: 4.5,
  feesEnabled: false,
  feesUpfront: null,
});

/**
 * Validates the current form state before calling the API.
 *
 * @param form Current form state.
 * @returns Flat list of user-facing validation errors.
 */
export const validateInstallmentVsCashForm = (
  form: InstallmentVsCashFormState,
): InstallmentVsCashValidationError[] => {
  const errors: InstallmentVsCashValidationError[] = [];

  pushValidationError(
    errors,
    {
      valid: form.cashPrice !== null && form.cashPrice > 0,
      field: "cashPrice",
      message: "Informe um preço à vista maior que zero.",
    },
  );
  pushValidationError(
    errors,
    {
      valid: form.installmentCount !== null && form.installmentCount >= 1,
      field: "installmentCount",
      message: "Informe uma quantidade válida de parcelas.",
    },
  );
  errors.push(...validateInstallmentInput(form));
  errors.push(...validateDelayInput(form));
  errors.push(...validateRateInputs(form));

  return errors;
};

/**
 * Resolves the actual delay in days from the UI preset state.
 *
 * @param form The current form state.
 * @returns Delay in days sent to the API.
 */
export const resolveFirstPaymentDelayDays = (
  form: InstallmentVsCashFormState,
): number => {
  if (form.firstPaymentDelayPreset === "today") {
    return 0;
  }
  if (form.firstPaymentDelayPreset === "30_days") {
    return 30;
  }
  if (form.firstPaymentDelayPreset === "45_days") {
    return 45;
  }
  return Math.max(0, Math.trunc(form.customFirstPaymentDelayDays ?? 0));
};

/**
 * Converts a numeric value into the decimal-string format expected by the API.
 *
 * @param value Numeric UI value.
 * @returns Decimal string with two fraction digits.
 */
export const toDecimalString = (value: number): string => {
  return value.toFixed(2);
};

/**
 * Parses a decimal string returned by the API.
 *
 * @param value Raw decimal string.
 * @returns Numeric representation for display and charting.
 */
export const parseDecimalString = (value: string): number => {
  return Number.parseFloat(value);
};

/**
 * Converts the current form state into the API request body.
 *
 * @param form Current form state.
 * @returns Request DTO expected by the API.
 */
export const toInstallmentVsCashCalculationRequest = (
  form: InstallmentVsCashFormState,
): InstallmentVsCashCalculationRequestDto => {
  const payload: InstallmentVsCashCalculationRequestDto = {
    cash_price: toDecimalString(form.cashPrice ?? 0),
    installment_count: Math.trunc(form.installmentCount ?? 0),
    inflation_rate_annual: toDecimalString(form.inflationRateAnnual ?? 0),
    fees_enabled: form.feesEnabled,
    fees_upfront: toDecimalString(form.feesUpfront ?? 0),
    first_payment_delay_days: resolveFirstPaymentDelayDays(form),
    opportunity_rate_type: form.opportunityRateType,
  };

  if (form.installmentInputMode === "amount") {
    payload.installment_amount = toDecimalString(form.installmentAmount ?? 0);
  } else {
    payload.installment_total = toDecimalString(form.installmentTotal ?? 0);
  }

  if (form.opportunityRateType === "manual") {
    payload.opportunity_rate_annual = toDecimalString(
      form.opportunityRateAnnual ?? 0,
    );
  }

  if (form.scenarioLabel.trim().length > 0) {
    payload.scenario_label = form.scenarioLabel.trim();
  }

  return payload;
};

/**
 * Builds the chart option comparing cash and installment scenarios month by month.
 *
 * @param calculation Latest calculation.
 * @returns ECharts option configured for the Auraxis chart wrapper.
 */
export const buildInstallmentVsCashChartOption = (
  calculation: InstallmentVsCashCalculation,
): EChartsOption => {
  const labels = calculation.result.schedule.map((item) => {
    return item.installmentNumber === 0
      ? "Hoje"
      : `${item.installmentNumber}ª parcela`;
  });

  return {
    tooltip: {
      trigger: "axis",
    },
    legend: {
      top: 0,
      textStyle: {
        color: tokens.text.muted,
      },
    },
    grid: {
      left: 24,
      right: 16,
      bottom: 24,
      top: 56,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "À vista",
        type: "line",
        smooth: true,
        lineStyle: {
          color: tokens.brand.secondary,
        },
        itemStyle: {
          color: tokens.brand.secondary,
        },
        data: calculation.result.schedule.map((item) => item.cashCumulative),
      },
      {
        name: "Parcelado nominal",
        type: "line",
        smooth: true,
        lineStyle: {
          color: tokens.status.dangerSoft,
        },
        itemStyle: {
          color: tokens.status.dangerSoft,
        },
        data: calculation.result.schedule.map((item) => item.cumulativeNominal),
      },
      {
        name: "Parcelado em valor presente",
        type: "line",
        smooth: true,
        lineStyle: {
          color: tokens.status.successSoft,
        },
        itemStyle: {
          color: tokens.status.successSoft,
        },
        data: calculation.result.schedule.map(
          (item) => item.cumulativePresentValue,
        ),
      },
    ],
  };
};

/**
 * Returns a compact label for the recommendation.
 *
 * @param option Recommendation value.
 * @returns PT-BR copy for the result hero.
 */
export const getRecommendationLabel = (option: RecommendedOption): string => {
  if (option === "cash") {
    return "À vista é a melhor escolha";
  }
  if (option === "installment") {
    return "Parcelado é a melhor escolha";
  }
  return "As opções estão praticamente empatadas";
};

/**
 * Checks whether an unknown payload can restore the calculator form state.
 *
 * @param value Unknown persisted payload.
 * @returns True when the payload matches the expected shape.
 */
export const isInstallmentVsCashPendingPayload = (
  value: unknown,
): value is InstallmentVsCashPendingPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { form?: unknown };
  if (typeof candidate.form !== "object" || candidate.form === null) {
    return false;
  }

  const form = candidate.form as Record<string, unknown>;
  return typeof form.scenarioLabel === "string"
    && typeof form.installmentInputMode === "string"
    && typeof form.firstPaymentDelayPreset === "string"
    && typeof form.opportunityRateType === "string"
    && typeof form.feesEnabled === "boolean";
};

/**
 * Checks whether an unknown value matches the calculation shape.
 *
 * @param value Unknown result payload.
 * @returns True when the result can be safely restored by the page.
 */
export const isInstallmentVsCashCalculation = (
  value: unknown,
): value is InstallmentVsCashCalculation => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const result = candidate.result as Record<string, unknown> | undefined;
  return typeof candidate.toolId === "string"
    && typeof candidate.ruleVersion === "string"
    && typeof candidate.input === "object"
    && typeof result === "object"
    && typeof result?.recommendedOption === "string";
};
