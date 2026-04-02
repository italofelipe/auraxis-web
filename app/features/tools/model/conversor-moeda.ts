/**
 * Domain model for the Conversor de Moeda (Currency Converter) calculator.
 *
 * Converts between Brazilian Real (BRL) and foreign currencies using live
 * bid/ask rates from BRAPI, with a manual rate fallback when the API is
 * unavailable.
 *
 * Exchange rate logic:
 *   - direction "buy"  → user holds BRL and buys foreign currency → rate = ask
 *     convertedAmount = brlAmount / ask
 *   - direction "sell" → user holds foreign currency and sells for BRL → rate = bid
 *     convertedAmount = foreignAmount * bid
 *
 * Pairs like "USD-BRL" mean USD is the foreign currency and BRL is the base.
 * The input amount is always in the first currency of the direction:
 *   - "buy"  → amount is in BRL (user pays BRL, receives foreign)
 *   - "sell" → amount is in foreign (user pays foreign, receives BRL)
 */

import type { BrapiCurrencyResult } from "~/features/tools/services/brapi-tools.client";

/** All supported currency pairs for conversion. */
export const CURRENCY_PAIRS = [
  "USD-BRL",
  "EUR-BRL",
  "GBP-BRL",
  "ARS-BRL",
  "JPY-BRL",
  "CAD-BRL",
  "AUD-BRL",
  "CHF-BRL",
  "BTC-BRL",
] as const;

/** A valid currency pair string. */
export type CurrencyPair = (typeof CURRENCY_PAIRS)[number];

/** Form state for the currency converter calculator. */
export interface ConversorMoedaFormState extends Record<string, unknown> {
  /** Amount to convert. Null when not yet entered. */
  amount: number | null;
  /** Selected currency pair, e.g. "USD-BRL". */
  pair: CurrencyPair;
  /**
   * Conversion direction.
   * - "buy"  → user buys foreign currency (pays BRL, receives foreign)
   * - "sell" → user sells foreign currency (pays foreign, receives BRL)
   */
  direction: "buy" | "sell";
  /** Manual exchange rate fallback when BRAPI is unavailable. Null means not set. */
  manualRate: number | null;
}

/** Result of a currency conversion calculation. */
export interface ConversorMoedaResult {
  /** The converted amount in the destination currency. */
  convertedAmount: number;
  /** The exchange rate used for the conversion. */
  rate: number;
  /** BRAPI bid rate (buy BRL, sell foreign). */
  bid: number;
  /** BRAPI ask rate (sell BRL, buy foreign). */
  ask: number;
  /** Percentage change in the exchange rate from the previous close. */
  pctChange: number;
  /** Whether the rate came from BRAPI or was entered manually. */
  source: "brapi" | "manual";
  /** Source currency code, e.g. "USD". */
  fromCurrency: string;
  /** Destination currency code, e.g. "BRL". */
  toCurrency: string;
}

/** Validation error for the conversor-moeda form. */
export interface ConversorMoedaValidationError {
  field: string;
  messageKey: string;
}

/**
 * Creates the default initial state for the currency converter form.
 *
 * @returns Default ConversorMoedaFormState.
 */
export const createDefaultConversorMoedaFormState = (): ConversorMoedaFormState => ({
  amount: null,
  pair: "USD-BRL",
  direction: "buy",
  manualRate: null,
});

/**
 * Validates the currency converter form state.
 *
 * Requires a positive amount and at least one rate source:
 * either a valid BRAPI quote is available (passed separately at calculation time)
 * or a positive manual rate is entered.
 *
 * @param form - The current form state.
 * @param hasBrapiQuote - Whether a live BRAPI quote is available.
 * @returns Array of validation errors (empty if valid).
 */
export const validateConversorMoedaForm = (
  form: ConversorMoedaFormState,
  hasBrapiQuote: boolean,
): ConversorMoedaValidationError[] => {
  const errors: ConversorMoedaValidationError[] = [];

  if (form.amount === null || form.amount <= 0) {
    errors.push({ field: "amount", messageKey: "errors.amountRequired" });
  }

  if (!hasBrapiQuote && (form.manualRate === null || form.manualRate <= 0)) {
    errors.push({ field: "manualRate", messageKey: "errors.rateRequired" });
  }

  return errors;
};

/**
 * Parses the currency codes from a pair string like "USD-BRL".
 *
 * @param pair - The currency pair string.
 * @returns Tuple of [foreignCurrency, baseCurrency].
 */
const parsePair = (pair: CurrencyPair): [string, string] => {
  const [foreign, base] = pair.split("-") as [string, string];
  return [foreign, base];
};

/** Shared context for conversion helpers. */
type ConversionContext = {
  amount: number;
  direction: "buy" | "sell";
  foreignCurrency: string;
  baseCurrency: string;
};

/**
 * Derives the from/to currencies and converted amount from a live BRAPI quote.
 *
 * @param ctx - Conversion context (amount, direction, currency codes).
 * @param quote - The live BRAPI currency quote.
 * @returns Result with brapi-specific fields.
 */
const applyBrapiQuote = (
  ctx: ConversionContext,
  quote: BrapiCurrencyResult,
): ConversorMoedaResult => {
  const { bid, ask } = quote;
  const isBuy = ctx.direction === "buy";
  const rate = isBuy ? ask : bid;
  const convertedAmount = isBuy ? ctx.amount / ask : ctx.amount * bid;
  return {
    convertedAmount,
    rate,
    bid,
    ask,
    pctChange: quote.pctChange,
    source: "brapi",
    fromCurrency: isBuy ? ctx.baseCurrency : ctx.foreignCurrency,
    toCurrency: isBuy ? ctx.foreignCurrency : ctx.baseCurrency,
  };
};

/**
 * Derives the converted amount using a manual exchange rate.
 *
 * @param ctx - Conversion context (amount, direction, currency codes).
 * @param manualRate - The manually entered exchange rate.
 * @returns Result using the manual rate.
 */
const applyManualRate = (
  ctx: ConversionContext,
  manualRate: number,
): ConversorMoedaResult => {
  const isBuy = ctx.direction === "buy";
  const convertedAmount = isBuy ? ctx.amount / manualRate : ctx.amount * manualRate;
  return {
    convertedAmount,
    rate: manualRate,
    bid: manualRate,
    ask: manualRate,
    pctChange: 0,
    source: "manual",
    fromCurrency: isBuy ? ctx.baseCurrency : ctx.foreignCurrency,
    toCurrency: isBuy ? ctx.foreignCurrency : ctx.baseCurrency,
  };
};

/**
 * Performs the currency conversion calculation.
 *
 * This is a pure function — it performs no async operations.
 * The caller is responsible for passing the live quote when available.
 *
 * @param form - The validated form state.
 * @param brapiQuote - Live BRAPI quote for the selected pair, or null for manual mode.
 * @returns Conversion result.
 */
export const calculateConversorMoeda = (
  form: ConversorMoedaFormState,
  brapiQuote: BrapiCurrencyResult | null | undefined,
): ConversorMoedaResult => {
  const [foreignCurrency, baseCurrency] = parsePair(form.pair);
  const ctx: ConversionContext = {
    amount: form.amount ?? 0,
    direction: form.direction,
    foreignCurrency,
    baseCurrency,
  };

  if (brapiQuote) {
    return applyBrapiQuote(ctx, brapiQuote);
  }

  return applyManualRate(ctx, form.manualRate ?? 1);
};
