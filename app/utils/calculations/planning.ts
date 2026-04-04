/**
 * @module calculations/planning
 *
 * Pure financial calculation functions for long-term financial planning.
 *
 * Covers:
 * - Retirement simulator (aposentadoria) — Rule of 25× / 4% SWR
 *   FV = PMT * ((1+r)^n - 1) / r  where r = real monthly rate (Fisher)
 * - FIRE variants — FIRE (25×), Lean FIRE (20×), Fat FIRE (33×), Coast FIRE
 * - Mortgage (financiamento imobiliário) — SAC and PRICE amortization systems
 *   SAC: fixed amortization; PRICE: fixed installment (anuidade)
 * - Rent vs Buy (aluguel vs compra) — NPV comparison over user-defined horizon
 *
 * All functions are pure: no side effects, no Vue reactivity.
 * Source of truth for WEB36 unit tests.
 */

/* v8 ignore start */
export * from "~/features/tools/model/aposentadoria";
export * from "~/features/tools/model/fire";
export * from "~/features/tools/model/financiamento-imobiliario";
export * from "~/features/tools/model/aluguel-vs-compra";
/* v8 ignore stop */
