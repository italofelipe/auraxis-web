const DEFAULT_CURRENCY = "BRL";

/**
 * Formats a value as a currency string.
 *
 * @param value    Numeric value to format.
 * @param currency ISO 4217 currency code (default `"BRL"`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Formatted string, e.g. `"R$ 1.234,56"`.
 */
const format = (value: number, currency = DEFAULT_CURRENCY, locale = "pt-BR"): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/**
 * Formats a value as a compact currency string (K/mi).
 *
 * @param value  Numeric value to format.
 * @param locale BCP 47 locale string (default `"pt-BR"`).
 * @returns Compact string, e.g. `"R$ 1,5 mi"`.
 */
const formatCompact = (value: number, locale = "pt-BR"): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);

/**
 * Removes BRL formatting and returns a raw number.
 * Note: parser is locale-specific to pt-BR (dot = thousands, comma = decimal).
 *
 * @param formatted Formatted string, e.g. `"R$ 1.234,56"`.
 * @returns Raw number, e.g. `1234.56`.
 */
const parse = (formatted: string): number => {
  const cleaned = formatted
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  return parseFloat(cleaned);
};

/**
 * Formatter for BRL monetary values.
 * Pure, side-effect-free, 100% testable.
 */
export const CurrencyFormatter = { format, formatCompact, parse };
