import type {
  InstallmentVsCashAssumptionsDto,
  CreateGoalFromInstallmentVsCashResponseDto,
  InstallmentVsCashComparisonDto,
  InstallmentVsCashNormalizedInputDto,
  InstallmentVsCashResultDto,
  InstallmentVsCashScheduleItemDto,
  CreatePlannedExpenseFromInstallmentVsCashResponseDto,
  InstallmentVsCashCalculationResponseDto,
  InstallmentVsCashIndicatorSnapshotDto,
  InstallmentVsCashSaveResponseDto,
  InstallmentVsCashSavedSimulationDto,
} from "~/features/tools/contracts/installment-vs-cash.dto";
import {
  parseDecimalString,
  type InstallmentVsCashCalculation,
  type InstallmentVsCashComparison,
  type InstallmentVsCashGoalBridgeResponse,
  type InstallmentVsCashIndicatorSnapshot,
  type InstallmentVsCashNormalizedInput,
  type InstallmentVsCashPlannedExpenseBridgeResponse,
  type InstallmentVsCashResult,
  type InstallmentVsCashScheduleItem,
  type InstallmentVsCashSavedCalculation,
  type InstallmentVsCashSavedSimulation,
} from "~/features/tools/model/installment-vs-cash";

/**
 * Maps an optional indicator snapshot DTO.
 *
 * @param dto Raw indicator snapshot.
 * @returns Domain snapshot or null.
 */
const mapIndicatorSnapshot = (
  dto: InstallmentVsCashIndicatorSnapshotDto | null,
): InstallmentVsCashIndicatorSnapshot | null => {
  if (!dto) {
    return null;
  }

  return {
    presetType: dto.preset_type,
    source: dto.source,
    annualRatePercent: parseDecimalString(dto.annual_rate_percent),
    asOf: dto.as_of,
  };
};

/**
 * Maps the normalized input block.
 *
 * @param dto Raw normalized input DTO.
 * @returns Domain normalized input.
 */
const mapNormalizedInput = (
  dto: InstallmentVsCashNormalizedInputDto,
): InstallmentVsCashNormalizedInput => ({
  cashPrice: parseDecimalString(dto.cash_price),
  installmentCount: dto.installment_count,
  installmentAmount: parseDecimalString(dto.installment_amount),
  installmentTotal: parseDecimalString(dto.installment_total),
  firstPaymentDelayDays: dto.first_payment_delay_days,
  opportunityRateType: dto.opportunity_rate_type,
  opportunityRateAnnual: parseDecimalString(dto.opportunity_rate_annual),
  inflationRateAnnual: parseDecimalString(dto.inflation_rate_annual),
  feesUpfront: parseDecimalString(dto.fees_upfront),
  scenarioLabel: dto.scenario_label ?? null,
});

/**
 * Maps the comparison block.
 *
 * @param dto Raw comparison DTO.
 * @returns Domain comparison object.
 */
const mapComparison = (
  dto: InstallmentVsCashComparisonDto,
): InstallmentVsCashComparison => ({
  cashOptionTotal: parseDecimalString(dto.cash_option_total),
  installmentOptionTotal: parseDecimalString(dto.installment_option_total),
  installmentPresentValue: parseDecimalString(dto.installment_present_value),
  installmentRealValueToday: parseDecimalString(dto.installment_real_value_today),
  presentValueDeltaVsCash: parseDecimalString(dto.present_value_delta_vs_cash),
  absoluteDeltaVsCash: parseDecimalString(dto.absolute_delta_vs_cash),
  relativeDeltaVsCashPercent: parseDecimalString(dto.relative_delta_vs_cash_percent),
  breakEvenDiscountPercent: parseDecimalString(dto.break_even_discount_percent),
  breakEvenOpportunityRateAnnual: parseDecimalString(
    dto.break_even_opportunity_rate_annual,
  ),
});

/**
 * Maps the assumptions block.
 *
 * @param dto Raw assumptions DTO.
 * @returns Domain assumptions object.
 */
const mapAssumptions = (
  dto: InstallmentVsCashAssumptionsDto,
): InstallmentVsCashResult["assumptions"] => ({
  opportunityRateType: dto.opportunity_rate_type,
  opportunityRateAnnualPercent: parseDecimalString(
    dto.opportunity_rate_annual_percent,
  ),
  inflationRateAnnualPercent: parseDecimalString(dto.inflation_rate_annual_percent),
  periodicity: dto.periodicity,
  firstPaymentDelayDays: dto.first_payment_delay_days,
  upfrontFeesApplyTo: dto.upfront_fees_apply_to,
  neutralityRule: dto.neutrality_rule,
});

/**
 * Maps a single schedule item.
 *
 * @param dto Raw schedule DTO.
 * @returns Domain schedule row.
 */
const mapScheduleItem = (
  dto: InstallmentVsCashScheduleItemDto,
): InstallmentVsCashScheduleItem => ({
  installmentNumber: dto.installment_number,
  dueInDays: dto.due_in_days,
  amount: parseDecimalString(dto.amount),
  presentValue: parseDecimalString(dto.present_value),
  realValueToday: parseDecimalString(dto.real_value_today),
  cumulativeNominal: parseDecimalString(dto.cumulative_nominal),
  cumulativePresentValue: parseDecimalString(dto.cumulative_present_value),
  cumulativeRealValueToday: parseDecimalString(dto.cumulative_real_value_today),
  cashCumulative: parseDecimalString(dto.cash_cumulative),
});

/**
 * Maps the result block.
 *
 * @param dto Raw result DTO.
 * @returns Domain result object.
 */
const mapResult = (dto: InstallmentVsCashResultDto): InstallmentVsCashResult => ({
  recommendedOption: dto.recommended_option,
  recommendationReason: dto.recommendation_reason,
  formulaExplainer: dto.formula_explainer,
  comparison: mapComparison(dto.comparison),
  options: {
    cash: {
      total: parseDecimalString(dto.options.cash.total),
    },
    installment: {
      count: dto.options.installment.count,
      amounts: dto.options.installment.amounts.map(parseDecimalString),
      installmentAmount: parseDecimalString(dto.options.installment.installment_amount),
      nominalTotal: parseDecimalString(dto.options.installment.nominal_total),
      upfrontFees: parseDecimalString(dto.options.installment.upfront_fees),
      firstPaymentDelayDays: dto.options.installment.first_payment_delay_days,
    },
  },
  neutralityBand: {
    absoluteBrl: parseDecimalString(dto.neutrality_band.absolute_brl),
    relativePercent: parseDecimalString(dto.neutrality_band.relative_percent),
  },
  assumptions: mapAssumptions(dto.assumptions),
  indicatorSnapshot: mapIndicatorSnapshot(dto.indicator_snapshot),
  schedule: dto.schedule.map(mapScheduleItem),
});

/**
 * Maps a specialized saved simulation DTO.
 *
 * @param dto Raw simulation DTO.
 * @returns Domain simulation object.
 */
const mapSavedSimulation = (
  dto: InstallmentVsCashSavedSimulationDto,
): InstallmentVsCashSavedSimulation => {
  return {
    id: dto.id,
    userId: dto.user_id,
    toolId: dto.tool_id,
    ruleVersion: dto.rule_version,
    inputs: mapNormalizedInput(dto.inputs),
    result: mapResult(dto.result),
    saved: dto.saved,
    goalId: dto.goal_id,
    createdAt: dto.created_at,
  };
};

/**
 * Maps the calculate endpoint response into the domain model used by the page.
 *
 * @param dto Raw API response.
 * @returns Strongly typed calculation domain object.
 */
export const mapInstallmentVsCashCalculationDto = (
  dto: InstallmentVsCashCalculationResponseDto,
): InstallmentVsCashCalculation => {
  return {
    toolId: dto.tool_id,
    ruleVersion: dto.rule_version,
    input: mapNormalizedInput(dto.input),
    result: mapResult(dto.result),
  };
};

/**
 * Maps the save endpoint response.
 *
 * @param dto Raw API response.
 * @returns Strongly typed saved-calculation bundle.
 */
export const mapInstallmentVsCashSaveResponseDto = (
  dto: InstallmentVsCashSaveResponseDto,
): InstallmentVsCashSavedCalculation => {
  return {
    simulation: mapSavedSimulation(dto.simulation),
    calculation: mapInstallmentVsCashCalculationDto(dto.calculation),
  };
};

/**
 * Maps the goal bridge response.
 *
 * @param dto Raw API response.
 * @returns Domain response for the goal bridge.
 */
export const mapInstallmentVsCashGoalBridgeResponseDto = (
  dto: CreateGoalFromInstallmentVsCashResponseDto,
): InstallmentVsCashGoalBridgeResponse => {
  return {
    goal: {
      id: dto.goal.id,
      title: dto.goal.title,
      description: dto.goal.description,
      category: dto.goal.category,
      targetAmount: parseDecimalString(dto.goal.target_amount),
      currentAmount: parseDecimalString(dto.goal.current_amount),
      priority: dto.goal.priority,
      targetDate: dto.goal.target_date,
      status: dto.goal.status,
      createdAt: dto.goal.created_at,
      updatedAt: dto.goal.updated_at,
    },
    simulation: mapSavedSimulation(dto.simulation),
  };
};

/**
 * Maps the planned-expense bridge response.
 *
 * @param dto Raw API response.
 * @returns Domain response for the planned-expense bridge.
 */
export const mapInstallmentVsCashPlannedExpenseBridgeResponseDto = (
  dto: CreatePlannedExpenseFromInstallmentVsCashResponseDto,
): InstallmentVsCashPlannedExpenseBridgeResponse => {
  return {
    transactions: dto.transactions.map((item) => ({
      id: item.id,
      title: item.title,
      amount: parseDecimalString(item.amount),
      type: item.type,
      dueDate: item.due_date,
      startDate: item.start_date,
      endDate: item.end_date,
      description: item.description,
      observation: item.observation,
      isRecurring: item.is_recurring,
      isInstallment: item.is_installment,
      installmentCount: item.installment_count,
      tagId: item.tag_id,
      accountId: item.account_id,
      creditCardId: item.credit_card_id,
      status: item.status,
      currency: item.currency,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
    simulation: mapSavedSimulation(dto.simulation),
  };
};
