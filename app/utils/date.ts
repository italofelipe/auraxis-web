/**
 * Date formatting utilities for the Auraxis web application.
 *
 * All functions use the `pt-BR` locale and the browser-native `Intl` API,
 * which is already used by `currency.ts` and `month.ts` to keep the bundle
 * free of third-party date libraries for simple display needs.
 */

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("pt-BR", {
  numeric: "always",
});

/** Milliseconds per minute. */
const MS_PER_MINUTE = 60_000;

/** Milliseconds per hour. */
const MS_PER_HOUR = 3_600_000;

/** Milliseconds per day. */
const MS_PER_DAY = 86_400_000;

/**
 * Formats a date value as `dd/mm/yyyy` using the `pt-BR` locale.
 *
 * @param date Date instance or ISO-8601 string to format.
 * @returns Human-readable date string, e.g. `"28/03/2026"`.
 */
export const formatDate = (date: Date | string): string => {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return dateFormatter.format(parsed);
};

/**
 * Returns a human-readable relative time string in `pt-BR`,
 * e.g. `"há 3 dias"`, `"há 2 horas"`, `"há 5 minutos"`, or `"agora"`.
 *
 * Relative values are resolved against `Date.now()` at call time.
 *
 * @param date Date instance or ISO-8601 string to compare against now.
 * @returns Localised relative time string.
 */
export const formatRelativeTime = (date: Date | string): string => {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const diffMs = parsed.getTime() - Date.now();

  const absMs = Math.abs(diffMs);

  if (absMs < MS_PER_MINUTE) {
    return relativeTimeFormatter.format(Math.round(diffMs / 1_000), "second");
  }

  if (absMs < MS_PER_HOUR) {
    return relativeTimeFormatter.format(Math.round(diffMs / MS_PER_MINUTE), "minute");
  }

  if (absMs < MS_PER_DAY) {
    return relativeTimeFormatter.format(Math.round(diffMs / MS_PER_HOUR), "hour");
  }

  return relativeTimeFormatter.format(Math.round(diffMs / MS_PER_DAY), "day");
};

/**
 * Formats a date range as `"dd/mm/yyyy – dd/mm/yyyy"` (en-dash separator).
 *
 * @param start Start of the range (Date instance or ISO-8601 string).
 * @param end End of the range (Date instance or ISO-8601 string).
 * @returns Human-readable date range string.
 */
export const formatDateRange = (start: Date | string, end: Date | string): string => {
  return `${formatDate(start)} – ${formatDate(end)}`;
};
