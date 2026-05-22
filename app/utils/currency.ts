/**
 * Formats a monetary value as a currency string.
 *
 * @param value    Numeric value to format.
 * @param currency ISO 4217 currency code (default `"BRL"`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Formatted currency string, e.g. `"R$ 1.234,56"`.
 */
export const formatCurrency = (
  value: unknown,
  currency = "BRL",
  locale = "pt-BR",
): string => {
  const amount = typeof value === "number" ? value : Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(safeAmount);
};
