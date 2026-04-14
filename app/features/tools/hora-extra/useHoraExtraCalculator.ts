/**
 * Composable facade for the Hora Extra calculator.
 *
 * Re-exports the pure domain functions so feature consumers can import
 * from a single, stable feature-level entry point.
 * All calculation logic lives in the model layer — no Vue state here.
 */

export {
  calculateHoraExtra,
  validateHoraExtraForm,
  createDefaultHoraExtraFormState,
  CLT_DEFAULT_HOURS_PER_MONTH,
  OVERTIME_RATES,
  BR_TAX_TABLE_YEAR,
  type HoraExtraFormState,
  type HoraExtraResult,
  type HoraExtraValidationError,
  type OvertimeBreakdown,
} from "~/features/tools/model/hora-extra";
