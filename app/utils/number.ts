/**
 * Number formatting utilities for the Auraxis web application.
 *
 * All functions accept an optional `locale` parameter (defaults to `"pt-BR"`).
 * Pass `useI18n().locale.value` from Vue components/composables for
 * locale-aware formatting.
 */

/**
 * Formats a decimal value (0–1) as a percentage string.
 *
 * @param value    Decimal value where `1` equals `100 %`.
 * @param decimals Number of fractional digits to display (default `2`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Formatted percentage string, e.g. `"12,50%"` for `0.125`.
 */
export const formatPercentage = (
  value: number,
  decimals = 2,
  locale = "pt-BR",
): string =>
  new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/**
 * Formats a number as a localised decimal string.
 *
 * @param value    Numeric value to format.
 * @param decimals Number of fractional digits to display (default `2`).
 * @param locale   BCP 47 locale string (default `"pt-BR"`).
 * @returns Formatted decimal string, e.g. `"1.234,56"` for `1234.56`.
 */
export const formatDecimal = (
  value: number,
  decimals = 2,
  locale = "pt-BR",
): string =>
  new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/**
 * Clamps `value` to the inclusive range `[min, max]`.
 *
 * @param value The value to clamp.
 * @param min   Lower bound (inclusive).
 * @param max   Upper bound (inclusive).
 * @returns The clamped value.
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
