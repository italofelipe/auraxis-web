/**
 * @module calculations/payroll
 *
 * Pure financial calculation functions for Brazilian payroll (CLT).
 *
 * Covers:
 * - BR progressive tax tables (INSS 2025, IRRF 2025) — Lei 14.663/2023
 * - Thirteenth salary (13º salário) — Art. 7º, VIII CF/88; Lei 4.090/1962
 * - Paid vacation (férias) — Arts. 129-153 CLT; STF RE 593.068
 * - Overtime (hora extra) — Art. 59 CLT
 * - Termination pay (rescisão) — Arts. 477-500 CLT; Lei 12.506/2011
 * - INSS + IRRF payroll detail (folha) — IN RFB 2.096/2022
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

/* v8 ignore start */
export * from "~/features/tools/model/br-tax-tables";
export * from "~/features/tools/model/thirteenth-salary";
export * from "~/features/tools/model/ferias";
export * from "~/features/tools/model/hora-extra";
export * from "~/features/tools/model/rescisao";
export * from "~/features/tools/model/inss-ir-folha";
/* v8 ignore stop */
