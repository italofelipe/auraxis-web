/**
 * Composable for locale-aware date formatting.
 *
 * Uses the current vue-i18n locale so that dates are always formatted
 * in the language the user has selected, instead of being hardcoded to
 * a specific locale (e.g. "pt-BR").
 *
 * Usage:
 * ```ts
 * const { formatDate, formatMonthYear, formatShortDate } = useLocaleDateFormat()
 * formatShortDate('2026-04-05') // → "05/04/2026" in pt-BR, "04/05/2026" in en-US
 * formatMonthYear('2026-04-05') // → "abr./26" in pt-BR, "Apr/26" in en
 * ```
 *
 * @returns Locale-aware date formatting helpers.
 */
export function useLocaleDateFormat(): {
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatMonthYear: (date: string | Date) => string;
  formatShortDate: (date: string | Date) => string;
} {
  const { locale } = useI18n();

  /**
   * Formats a date using `Intl.DateTimeFormat` with the active locale.
   *
   * @param date A `Date` instance or an ISO-8601 date string.
   * @param options Optional `Intl.DateTimeFormatOptions` to control the output.
   * @returns A localised date string.
   */
  function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const parsed = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale.value, options).format(parsed);
  }

  /**
   * Formats a date as a short month + 2-digit year, e.g. "abr./26" or "Apr/26".
   *
   * @param date A `Date` instance or an ISO-8601 date string.
   * @returns Short month-year label.
   */
  function formatMonthYear(date: string | Date): string {
    return formatDate(date, { month: "short", year: "2-digit" });
  }

  /**
   * Formats a date as a short date, e.g. "05/04/2026".
   *
   * @param date A `Date` instance or an ISO-8601 date string.
   * @returns Localised short date string.
   */
  function formatShortDate(date: string | Date): string {
    return formatDate(date, { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  return { formatDate, formatMonthYear, formatShortDate };
}
