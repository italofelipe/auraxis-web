/**
 * Formats a monetary value as a currency string.
 *
 * @param value    Numeric value to format.
 * @param currency ISO 4217 currency code (default `"BRL"`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Formatted currency string, e.g. `"R$ 1.234,56"`.
 */
export const formatCurrency = (
  value: number,
  currency = "BRL",
  locale = "pt-BR",
): string =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
