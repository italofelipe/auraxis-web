/**
 * Opportunity-rate preset accepted by the installment-vs-cash API.
 */
export type OpportunityRateTypeDto =
  | "manual"
  | "product_default"
  | "inflation_only";

/**
 * Recommendation returned by the API after comparing the payment options.
 */
export type RecommendedOptionDto = "cash" | "installment" | "equivalent";

/**
 * Selected payment option used in premium bridge actions.
 */
export type SelectedPaymentOptionDto = "cash" | "installment";

/**
 * DTO payload for the public calculate endpoint.
 */
export interface InstallmentVsCashCalculationRequestDto {
  cash_price: string;
  installment_count: number;
  inflation_rate_annual: string;
  fees_enabled: boolean;
  fees_upfront: string;
  first_payment_delay_days: number;
  opportunity_rate_type: OpportunityRateTypeDto;
  installment_amount?: string;
  installment_total?: string;
  opportunity_rate_annual?: string;
  scenario_label?: string;
}

/**
 * DTO payload for saving a calculation.
 */
export type InstallmentVsCashSaveRequestDto =
  InstallmentVsCashCalculationRequestDto;

/**
 * DTO shape for a snapshot of preset indicators used in the calculation.
 */
export interface InstallmentVsCashIndicatorSnapshotDto {
  preset_type: string;
  source: string;
  annual_rate_percent: string;
  as_of: string;
}

/**
 * DTO shape for the numeric comparison block returned by the API.
 */
export interface InstallmentVsCashComparisonDto {
  cash_option_total: string;
  installment_option_total: string;
  installment_present_value: string;
  installment_real_value_today: string;
  present_value_delta_vs_cash: string;
  absolute_delta_vs_cash: string;
  relative_delta_vs_cash_percent: string;
  break_even_discount_percent: string;
  break_even_opportunity_rate_annual: string;
}

/**
 * DTO shape for the cash option block.
 */
export interface InstallmentVsCashCashOptionDto {
  total: string;
}

/**
 * DTO shape for the installment option block.
 */
export interface InstallmentVsCashInstallmentOptionDto {
  count: number;
  amounts: string[];
  installment_amount: string;
  nominal_total: string;
  upfront_fees: string;
  first_payment_delay_days: number;
}

/**
 * DTO shape for both payment options.
 */
export interface InstallmentVsCashOptionsDto {
  cash: InstallmentVsCashCashOptionDto;
  installment: InstallmentVsCashInstallmentOptionDto;
}

/**
 * DTO shape for the neutrality band.
 */
export interface InstallmentVsCashNeutralityBandDto {
  absolute_brl: string;
  relative_percent: string;
}

/**
 * DTO shape for the assumptions used in the simulation.
 */
export interface InstallmentVsCashAssumptionsDto {
  opportunity_rate_type: OpportunityRateTypeDto;
  opportunity_rate_annual_percent: string;
  inflation_rate_annual_percent: string;
  periodicity: string;
  first_payment_delay_days: number;
  upfront_fees_apply_to: string;
  neutrality_rule: string;
}

/**
 * DTO shape for one row of the generated schedule.
 */
export interface InstallmentVsCashScheduleItemDto {
  installment_number: number;
  due_in_days: number;
  amount: string;
  present_value: string;
  real_value_today: string;
  cumulative_nominal: string;
  cumulative_present_value: string;
  cumulative_real_value_today: string;
  cash_cumulative: string;
}

/**
 * DTO shape for the calculation result block.
 */
export interface InstallmentVsCashResultDto {
  recommended_option: RecommendedOptionDto;
  recommendation_reason: string;
  formula_explainer: string;
  comparison: InstallmentVsCashComparisonDto;
  options: InstallmentVsCashOptionsDto;
  neutrality_band: InstallmentVsCashNeutralityBandDto;
  assumptions: InstallmentVsCashAssumptionsDto;
  indicator_snapshot: InstallmentVsCashIndicatorSnapshotDto | null;
  schedule: InstallmentVsCashScheduleItemDto[];
}

/**
 * DTO shape for the normalized input returned by the API.
 */
export interface InstallmentVsCashNormalizedInputDto {
  cash_price: string;
  installment_count: number;
  installment_amount: string;
  installment_total: string;
  first_payment_delay_days: number;
  opportunity_rate_type: OpportunityRateTypeDto;
  opportunity_rate_annual: string;
  inflation_rate_annual: string;
  fees_upfront: string;
  scenario_label?: string | null;
}

/**
 * DTO shape returned by the calculate endpoint.
 */
export interface InstallmentVsCashCalculationResponseDto {
  tool_id: string;
  rule_version: string;
  input: InstallmentVsCashNormalizedInputDto;
  result: InstallmentVsCashResultDto;
}

/**
 * DTO shape for the saved simulation.
 */
export interface InstallmentVsCashSavedSimulationDto {
  id: string;
  user_id: string | null;
  tool_id: string;
  rule_version: string;
  inputs: InstallmentVsCashNormalizedInputDto;
  result: InstallmentVsCashResultDto;
  saved: boolean;
  goal_id: string | null;
  created_at: string;
}

/**
 * DTO response for the save endpoint.
 */
export interface InstallmentVsCashSaveResponseDto {
  simulation: InstallmentVsCashSavedSimulationDto;
  calculation: InstallmentVsCashCalculationResponseDto;
}

/**
 * DTO payload used to transform a simulation into a goal.
 */
export interface CreateGoalFromInstallmentVsCashDto {
  title: string;
  selected_option: SelectedPaymentOptionDto;
  description?: string;
  category?: string;
  target_date?: string;
  priority?: number;
  current_amount?: string;
}

/**
 * DTO shape for a serialized goal.
 */
export interface GoalBridgeGoalDto {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_amount: string;
  current_amount: string;
  priority: number;
  target_date: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * DTO response for the goal bridge.
 */
export interface CreateGoalFromInstallmentVsCashResponseDto {
  goal: GoalBridgeGoalDto;
  simulation: InstallmentVsCashSavedSimulationDto;
}

/**
 * DTO payload used to turn a simulation into a planned expense.
 */
export interface CreatePlannedExpenseFromInstallmentVsCashDto {
  title: string;
  selected_option: SelectedPaymentOptionDto;
  description?: string;
  observation?: string;
  due_date?: string;
  first_due_date?: string;
  upfront_due_date?: string;
  tag_id?: string;
  account_id?: string;
  credit_card_id?: string;
  currency?: string;
  status?: "pending" | "paid" | "cancelled" | "postponed" | "overdue";
}

/**
 * DTO shape for a serialized planned transaction.
 */
export interface PlannedExpenseTransactionDto {
  id: string;
  title: string;
  amount: string;
  type: string;
  due_date: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  observation: string | null;
  is_recurring: boolean;
  is_installment: boolean;
  installment_count: number | null;
  tag_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  status: string;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * DTO response for the planned-expense bridge.
 */
export interface CreatePlannedExpenseFromInstallmentVsCashResponseDto {
  transactions: PlannedExpenseTransactionDto[];
  simulation: InstallmentVsCashSavedSimulationDto;
}
