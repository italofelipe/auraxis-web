/**
 * Canonical Auraxis pricing constants.
 * Source of truth: DEC-168 + founder confirmation 2026-04-05
 *
 * Monthly:  R$27,90/mês
 * Annual:   R$220,00/ano (~34% savings vs monthly: (27.90*12 - 220) / (27.90*12))
 */
export const PRICING = {
  MONTHLY_PRICE: 27.90,
  ANNUAL_PRICE: 220.00,
  ANNUAL_MONTHLY_EQUIVALENT: +(220 / 12).toFixed(2), // ~18.33
  ANNUAL_SAVINGS_PERCENT: Math.round((27.90 * 12 - 220) / (27.90 * 12) * 100), // 34
  CURRENCY: "BRL",
  LOCALE: "pt-BR",
} as const;
