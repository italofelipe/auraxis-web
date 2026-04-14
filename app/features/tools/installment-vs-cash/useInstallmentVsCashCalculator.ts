/**
 * Composable facade for the Installment vs Cash calculator.
 *
 * Re-exports pure domain helpers from the model layer under a stable
 * feature-level entry point. No Vue reactive state is held here.
 * Calculation is delegated to the API via useInstallmentVsCashCalculateMutation.
 */

export {
  validateInstallmentVsCashForm,
  createDefaultInstallmentVsCashFormState,
  toInstallmentVsCashCalculationRequest,
  resolveFirstPaymentDelayDays,
  buildInstallmentVsCashChartOption,
  getRecommendationLabel,
  isInstallmentVsCashPendingPayload,
  isInstallmentVsCashCalculation,
  INSTALLMENT_VS_CASH_TOOL_ID,
  INSTALLMENT_VS_CASH_PUBLIC_PATH,
  type InstallmentVsCashFormState,
  type InstallmentVsCashCalculation,
  type InstallmentVsCashResult,
  type InstallmentVsCashSavedSimulation,
  type InstallmentVsCashValidationError,
  type CreateInstallmentVsCashGoalPayload,
  type CreateInstallmentVsCashPlannedExpensePayload,
  type SelectedPaymentOption,
  type InstallmentDelayPreset,
  type InstallmentInputMode,
  type OpportunityRateType,
} from "~/features/tools/model/installment-vs-cash";
