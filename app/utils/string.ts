/**
 * String manipulation utilities for the Auraxis web application.
 */

/** Default suffix appended when a string is truncated. */
const DEFAULT_TRUNCATE_SUFFIX = "…";

/**
 * Truncates `text` to at most `maxLength` characters, appending `suffix`
 * (default `"…"`) when the text exceeds the limit.
 *
 * The returned string (including the suffix) never exceeds `maxLength`
 * characters.
 *
 * @param text Source string to truncate.
 * @param maxLength Maximum number of characters in the result.
 * @param suffix String appended when truncation occurs (default `"…"`).
 * @returns Truncated string or the original string if it fits within the limit.
 *
 * @example
 * truncate("Hello World", 7)          // "Hello W…"
 * truncate("Hi", 10)                  // "Hi"
 * truncate("Long text", 6, "...")     // "Lon..."
 */
export const truncate = (
  text: string,
  maxLength: number,
  suffix: string = DEFAULT_TRUNCATE_SUFFIX,
): string => {
  if (text.length <= maxLength) { return text; }
  return text.slice(0, maxLength - suffix.length) + suffix;
};

/**
 * Capitalizes the first character of `text`, leaving the rest unchanged.
 *
 * Returns an empty string when `text` is empty.
 *
 * @param text Source string to capitalize.
 * @returns String with the first character in upper case.
 *
 * @example
 * capitalize("hello world")  // "Hello world"
 * capitalize("")             // ""
 */
export const capitalize = (text: string): string => {
  if (text.length === 0) { return text; }
  return text.charAt(0).toUpperCase() + text.slice(1);
};
