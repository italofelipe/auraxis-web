/**
 * Date formatting utilities for the Auraxis web application.
 *
 * All functions accept an optional `locale` parameter (defaults to `"pt-BR"`).
 * Components that need locale-aware formatting should pass
 * `useI18n().locale.value` to respect the active application language.
 */

/**
 * Formats a date value as `dd/mm/yyyy` (pt-BR) or the locale-equivalent.
 *
 * @param date   Date instance or ISO-8601 string to format.
 * @param locale BCP 47 locale string (default `"pt-BR"`).
 * @returns Human-readable date string, e.g. `"28/03/2026"`.
 */
export const formatDate = (date: Date | string, locale = "pt-BR"): string => {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
};

/**
 * Returns a human-readable relative time string,
 * e.g. `"há 3 dias"` (pt-BR) or `"3 days ago"` (en).
 *
 * Relative values are resolved against `Date.now()` at call time.
 *
 * @param date   Date instance or ISO-8601 string to compare against now.
 * @param locale BCP 47 locale string (default `"pt-BR"`).
 * @returns Localised relative time string.
 */
export const formatRelativeTime = (date: Date | string, locale = "pt-BR"): string => {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const diffMs = parsed.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" });

  /** Milliseconds per minute. */
  const MS_PER_MINUTE = 60_000;
  /** Milliseconds per hour. */
  const MS_PER_HOUR = 3_600_000;
  /** Milliseconds per day. */
  const MS_PER_DAY = 86_400_000;

  if (absMs < MS_PER_MINUTE) {
    return formatter.format(Math.round(diffMs / 1_000), "second");
  }
  if (absMs < MS_PER_HOUR) {
    return formatter.format(Math.round(diffMs / MS_PER_MINUTE), "minute");
  }
  if (absMs < MS_PER_DAY) {
    return formatter.format(Math.round(diffMs / MS_PER_HOUR), "hour");
  }
  return formatter.format(Math.round(diffMs / MS_PER_DAY), "day");
};

/**
 * Formats a date range as `"dd/mm/yyyy – dd/mm/yyyy"` (en-dash separator).
 *
 * @param start  Start of the range (Date instance or ISO-8601 string).
 * @param end    End of the range (Date instance or ISO-8601 string).
 * @param locale BCP 47 locale string (default `"pt-BR"`).
 * @returns Human-readable date range string.
 */
export const formatDateRange = (
  start: Date | string,
  end: Date | string,
  locale = "pt-BR",
): string => `${formatDate(start, locale)} – ${formatDate(end, locale)}`;
