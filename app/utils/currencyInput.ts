import { formatCurrency } from "./currency";

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
export const serializeCurrencyAmount = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) {
    return "0.00";
  }

  return value.toFixed(2);
};
