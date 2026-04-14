/**
 * Composable facade for the thirteenth-salary calculator.
 *
 * Wraps the pure domain functions from the model layer in a thin,
 * testable composable that holds no Vue reactive state.
 * State management lives in the page shell (page.vue).
 */

export {
  calculateThirteenthSalary,
  validateThirteenthSalaryForm,
  createDefaultThirteenthSalaryFormState,
  BR_TAX_TABLE_YEAR,
  type ThirteenthSalaryFormState,
  type ThirteenthSalaryResult,
  type ThirteenthSalaryInstallment,
  type ThirteenthSalaryValidationError,
} from "~/features/tools/model/thirteenth-salary";
