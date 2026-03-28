/**
 * Number formatting utilities for the Auraxis web application.
 *
 * Uses the browser-native `Intl.NumberFormat` with the `pt-BR` locale,
 * following the same convention as `currency.ts`.
 */

/**
 * Returns a percentage formatter configured for the given number of decimal places.
 *
 * @param decimals Number of fraction digits (default 2).
 * @returns Configured `Intl.NumberFormat` instance.
 */
const buildPercentFormatter = (decimals: number): Intl.NumberFormat =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Returns a decimal formatter configured for the given number of decimal places.
 *
 * @param decimals Number of fraction digits (default 2).
 * @returns Configured `Intl.NumberFormat` instance.
 */
const buildDecimalFormatter = (decimals: number): Intl.NumberFormat =>
  new Intl.NumberFormat("pt-BR", {
    style: "decimal",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Formats a decimal value (0–1) as a percentage string using the `pt-BR` locale.
 *
 * @param value Decimal value where `1` equals `100 %`.
 * @param decimals Number of fractional digits to display (default `2`).
 * @returns Formatted percentage string, e.g. `"12,50%"` for `0.125`.
 *
 * @example
 * formatPercentage(0.125)       // "12,50%"
 * formatPercentage(0.125, 0)    // "13%"
 */
export const formatPercentage = (value: number, decimals: number = 2): string =>
  buildPercentFormatter(decimals).format(value);

/**
 * Formats a number as a localised decimal string using the `pt-BR` locale.
 *
 * @param value Numeric value to format.
 * @param decimals Number of fractional digits to display (default `2`).
 * @returns Formatted decimal string, e.g. `"1.234,56"` for `1234.56`.
 *
 * @example
 * formatDecimal(1234.56)     // "1.234,56"
 * formatDecimal(1234.56, 0)  // "1.235"
 */
export const formatDecimal = (value: number, decimals: number = 2): string =>
  buildDecimalFormatter(decimals).format(value);

/**
 * Clamps `value` to the inclusive range `[min, max]`.
 *
 * @param value The value to clamp.
 * @param min Lower bound (inclusive).
 * @param max Upper bound (inclusive).
 * @returns The clamped value.
 *
 * @example
 * clamp(150, 0, 100)  // 100
 * clamp(-5, 0, 100)   // 0
 * clamp(42, 0, 100)   // 42
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
