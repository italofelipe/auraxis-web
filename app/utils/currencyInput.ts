import { formatCurrency } from "./currency";

/**
 * Removes currency symbols/spaces while preserving decimal separators.
 *
 * @param input Raw string value.
 * @returns Clean currency string, or null when nothing parseable remains.
 */
const cleanCurrencyString = (input: string): string | null => {
  const cleaned = input.trim().replace(/[^\d,.-]/g, "");
  return cleaned && !["-", ".", ","].includes(cleaned) ? cleaned : null;
};

/**
 * Normalises either pt-BR or decimal-dot currency strings to JS decimal form.
 *
 * @param value Cleaned currency string.
 * @returns Decimal string suitable for Number().
 */
const normalizeCurrencyString = (value: string): string => {
  if (value.includes(",")) {
    return value.replace(/\./g, "").replace(",", ".");
  }

  const parts = value.split(".");
  if (parts.length <= 2) {
    return value;
  }

  const fraction = parts.pop() ?? "0";
  return `${parts.join("")}.${fraction}`;
};

/**
 * Parses a string currency value after cleaning and separator normalisation.
 *
 * @param input Raw string value.
 * @returns Finite number, or null when invalid.
 */
const parseCurrencyString = (input: string): number | null => {
  const cleaned = cleanCurrencyString(input);
  if (!cleaned) {
    return null;
  }

  const parsed = Number(normalizeCurrencyString(cleaned));
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Converts API decimals, raw numbers and formatted BRL strings to a finite
 * currency number. Unlike POS-style entry parsing, plain `"5000"` means
 * 5000 reais here because this helper is used for persisted data.
 *
 * @param input Raw persisted/display value.
 * @returns Finite numeric value, or null when it cannot be parsed safely.
 */
export const normalizeCurrencyNumber = (input: unknown): number | null => {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }

  if (typeof input !== "string") {
    return null;
  }

  return parseCurrencyString(input);
};

/**
 * Parses a persisted or display currency amount with a safe fallback.
 *
 * @param input Raw persisted/display value.
 * @param fallback Value returned when parsing fails.
 * @returns Finite numeric value.
 */
export const parseCurrencyAmount = (input: unknown, fallback = 0): number =>
  normalizeCurrencyNumber(input) ?? fallback;

/**
 * Parses currency input using the common Brazilian POS-entry behaviour:
 * every typed digit shifts the amount in cents.
 *
 * @param input Raw input from the field.
 * @returns Numeric BRL amount, or null when empty.
 */
export const parseCurrencyCentsInput = (input: string | number | null | undefined): number | null => {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "number") {
    return Number.isFinite(input) ? input : null;
  }

  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) {
    return null;
  }

  return Number(digits) / 100;
};

/**
 * Formats the current currency input value as BRL.
 *
 * @param value Numeric input value.
 * @returns Formatted string for display.
 */
export const formatCurrencyCentsInput = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "";
  }

  return formatCurrency(value);
};

/**
 * Serialises a form amount for transaction API payloads.
 *
 * @param value Numeric amount from the form.
 * @returns Decimal string with two fractional digits.
 */
export const serializeCurrencyAmount = (value: unknown): string => {
  const amount = normalizeCurrencyNumber(value);
  if (amount === null) {
    return "0.00";
  }

  return amount.toFixed(2);
};
