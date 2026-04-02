/**
 * Domain model for the Desconto, Markup e Margem calculator.
 *
 * Supports four calculation modes:
 *  - desconto: given original price and discount %, compute final price and savings.
 *  - markup: given cost and markup %, compute sale price and profit.
 *  - margem: given sale price and cost, compute margin % and profit.
 *  - reverso: given final price (after discount) and discount %, recover original price.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Available calculation modes. */
export const DESCONTO_MARKUP_MODES = ["desconto", "markup", "margem", "reverso"] as const;

/** Public route for the Desconto/Markup calculator page. */
export const DESCONTO_MARKUP_PUBLIC_PATH = "/tools/desconto-markup";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Calculation mode for the Desconto, Markup e Margem calculator. */
export type DescontoMarkupMode = "desconto" | "markup" | "margem" | "reverso";

// ─── Form state ───────────────────────────────────────────────────────────────

/** Form state for the Desconto, Markup e Margem calculator. */
export interface DescontoMarkupFormState extends Record<string, unknown> {
  /** Selected calculation mode. */
  mode: DescontoMarkupMode;
  /**
   * Price value in BRL.
   * - desconto: original price before discount.
   * - markup: not used (use cost instead).
   * - margem: sale price.
   * - reverso: final price after discount.
   */
  price: number | null;
  /**
   * Percentage value.
   * - desconto: discount percentage (0–100).
   * - markup: markup percentage (> 0).
   * - margem: not used (computed from price and cost).
   * - reverso: discount percentage (0–100).
   */
  pct: number | null;
  /**
   * Cost value in BRL.
   * - markup: cost of goods sold.
   * - margem: cost of goods sold.
   * - desconto/reverso: not used.
   */
  cost: number | null;
}

/**
 * Returns the default initial form state for the Desconto/Markup calculator.
 *
 * @returns Default DescontoMarkupFormState.
 */
export function createDefaultDescontoMarkupFormState(): DescontoMarkupFormState {
  return {
    mode: "desconto",
    price: null,
    pct: null,
    cost: null,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validation error shape for Desconto/Markup form. */
export interface DescontoMarkupValidationError {
  field: keyof DescontoMarkupFormState;
  messageKey: string;
}

/**
 * Validates the Desconto/Markup form state before calculating.
 *
 * @param form Current form state.
 * @returns Array of validation errors. Empty array means valid.
 */
export function validateDescontoMarkupForm(
  form: DescontoMarkupFormState,
): DescontoMarkupValidationError[] {
  if (form.mode === "desconto") { return validateDescontoMode(form); }
  if (form.mode === "markup") { return validateMarkupMode(form); }
  if (form.mode === "margem") { return validateMargemMode(form); }
  return validateReversoMode(form);
}

/**
 * Validates inputs for desconto mode.
 *
 * @param form Current form state.
 * @returns Validation errors for desconto mode.
 */
function validateDescontoMode(form: DescontoMarkupFormState): DescontoMarkupValidationError[] {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.pct === null || form.pct < 0 || form.pct > 100) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
}

/**
 * Validates inputs for markup mode.
 *
 * @param form Current form state.
 * @returns Validation errors for markup mode.
 */
function validateMarkupMode(form: DescontoMarkupFormState): DescontoMarkupValidationError[] {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.cost === null || form.cost <= 0) {
    errors.push({ field: "cost", messageKey: "errors.costRequired" });
  }
  if (form.pct === null || form.pct < 0) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
}

/**
 * Validates inputs for margem mode.
 *
 * @param form Current form state.
 * @returns Validation errors for margem mode.
 */
function validateMargemMode(form: DescontoMarkupFormState): DescontoMarkupValidationError[] {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.cost === null || form.cost < 0) {
    errors.push({ field: "cost", messageKey: "errors.costRequired" });
  }
  return errors;
}

/**
 * Validates inputs for reverso mode.
 *
 * @param form Current form state.
 * @returns Validation errors for reverso mode.
 */
function validateReversoMode(form: DescontoMarkupFormState): DescontoMarkupValidationError[] {
  const errors: DescontoMarkupValidationError[] = [];
  if (form.price === null || form.price <= 0) {
    errors.push({ field: "price", messageKey: "errors.priceRequired" });
  }
  if (form.pct === null || form.pct < 0 || form.pct >= 100) {
    errors.push({ field: "pct", messageKey: "errors.pctRequired" });
  }
  return errors;
}

// ─── Result ───────────────────────────────────────────────────────────────────

/** Calculation result for the Desconto/Markup calculator. */
export interface DescontoMarkupResult {
  /**
   * The primary computed value in BRL.
   * - desconto: final price after discount.
   * - markup: sale price.
   * - margem: margin percentage (as a percentage value, e.g. 25.0 = 25%).
   * - reverso: original price before discount.
   */
  calculatedValue: number;
  /**
   * Percentage result.
   * - desconto: effective discount percentage.
   * - markup: markup percentage (echoes input).
   * - margem: margin percentage.
   * - reverso: discount percentage (echoes input).
   */
  pctResult: number;
  /**
   * Savings or profit in BRL.
   * - desconto: savings = original − final.
   * - markup: profit = sale − cost.
   * - margem: profit = sale − cost.
   * - reverso: discount applied = original − final.
   */
  savingsOrProfit: number;
  /** Mode used for this calculation. */
  mode: DescontoMarkupMode;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

/**
 * Calculates the result for the selected mode.
 *
 * Formulas:
 *  - desconto: finalPrice = price * (1 − pct/100); savings = price − finalPrice.
 *  - markup: salePrice = cost * (1 + pct/100); profit = salePrice − cost.
 *  - margem: marginPct = (price − cost) / price * 100; profit = price − cost.
 *  - reverso: originalPrice = price / (1 − pct/100); discount = originalPrice − price.
 *
 * @param form Validated form state.
 * @returns Complete result for the selected mode.
 */
export function calculateDescontoMarkup(form: DescontoMarkupFormState): DescontoMarkupResult {
  if (form.mode === "desconto") { return calcDesconto(form); }
  if (form.mode === "markup") { return calcMarkup(form); }
  if (form.mode === "margem") { return calcMargem(form); }
  return calcReverso(form);
}

/**
 * Calculates desconto (discount) mode result.
 *
 * @param form Validated form state.
 * @returns Desconto result.
 */
function calcDesconto(form: DescontoMarkupFormState): DescontoMarkupResult {
  const price = form.price ?? 0;
  const pct = form.pct ?? 0;
  const finalPrice = round2(price * (1 - pct / 100));
  return {
    calculatedValue: finalPrice,
    pctResult: pct,
    savingsOrProfit: round2(price - finalPrice),
    mode: "desconto",
  };
}

/**
 * Calculates markup mode result.
 *
 * @param form Validated form state.
 * @returns Markup result.
 */
function calcMarkup(form: DescontoMarkupFormState): DescontoMarkupResult {
  const cost = form.cost ?? 0;
  const pct = form.pct ?? 0;
  const salePrice = round2(cost * (1 + pct / 100));
  return {
    calculatedValue: salePrice,
    pctResult: pct,
    savingsOrProfit: round2(salePrice - cost),
    mode: "markup",
  };
}

/**
 * Calculates margem (margin) mode result.
 *
 * @param form Validated form state.
 * @returns Margem result.
 */
function calcMargem(form: DescontoMarkupFormState): DescontoMarkupResult {
  const price = form.price ?? 0;
  const cost = form.cost ?? 0;
  const marginPct = price > 0 ? round2(((price - cost) / price) * 100) : 0;
  return {
    calculatedValue: marginPct,
    pctResult: marginPct,
    savingsOrProfit: round2(price - cost),
    mode: "margem",
  };
}

/**
 * Calculates reverso (reverse discount) mode result.
 *
 * @param form Validated form state.
 * @returns Reverso result.
 */
function calcReverso(form: DescontoMarkupFormState): DescontoMarkupResult {
  const finalPrice = form.price ?? 0;
  const pct = form.pct ?? 0;
  const divisor = 1 - pct / 100;
  const originalPrice = divisor > 0 ? round2(finalPrice / divisor) : 0;
  return {
    calculatedValue: originalPrice,
    pctResult: pct,
    savingsOrProfit: round2(originalPrice - finalPrice),
    mode: "reverso",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Rounds a number to 2 decimal places (currency precision).
 *
 * @param value Number to round.
 * @returns Rounded value.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
