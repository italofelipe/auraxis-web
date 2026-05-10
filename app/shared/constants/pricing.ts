/**
 * Canonical Auraxis pricing constants.
 * Source of truth: ADR #669 — founder-confirmed 2026-05-10
 *
 * Monthly:  R$29,90/mês
 * Annual:   R$287,04/ano (20% off vs monthly: 29.90*12*0.80)
 */
export const PRICING = {
  MONTHLY_PRICE: 29.90,
  ANNUAL_PRICE: 287.04,
  ANNUAL_MONTHLY_EQUIVALENT: +(287.04 / 12).toFixed(2), // ~23.92
  ANNUAL_SAVINGS_PERCENT: Math.round((29.90 * 12 - 287.04) / (29.90 * 12) * 100), // 20
  CURRENCY: "BRL",
  LOCALE: "pt-BR",
} as const;
