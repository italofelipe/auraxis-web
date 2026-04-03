/**
 * @module calculations/tax
 *
 * Pure financial calculation functions for Brazilian tax regimes.
 *
 * Covers:
 * - MEI DAS — LC 123/2006; Resolução CGSN 140/2018
 * - CLT vs PJ comparison — Simples Nacional, Lucro Presumido, MEI
 *   (break-even invoice analysis including employer costs)
 *
 * Note: MEI_ANNUAL_LIMIT and MEI_MONTHLY_LIMIT are exported once from
 * clt-vs-pj (canonical source for the comparison model). MEI-specific
 * form/result types come from the mei module.
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

// CLT vs PJ comparison — includes MEI_ANNUAL_LIMIT, MEI_MONTHLY_LIMIT
export * from "~/features/tools/model/clt-vs-pj";

// MEI-specific exports (excluding constants already in clt-vs-pj)
export {
  MEI_TABLE_YEAR,
  MEI_DAS_BY_ACTIVITY,
  MEI_ACTIVITY_TYPES,
  type MeiActivity,
  type MeiCurrentSituation,
  MEI_BENEFITS,
  type MeiFormState,
  createDefaultMeiFormState,
  type MeiValidationError,
  validateMeiForm,
  type MeiComparisonPF,
  type MeiResult,
  calculateMei,
} from "~/features/tools/model/mei";
