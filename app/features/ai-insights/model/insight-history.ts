import type { AIInsightDTO } from "~/features/ai-insights/contracts/ai-insight";

export interface InsightHistorySplit {
  readonly todayInsight: AIInsightDTO | null;
  readonly past: AIInsightDTO[];
}

/**
 * Returns the date portion (YYYY-MM-DD) of an ISO timestamp.
 *
 * @param createdAt ISO datetime string.
 * @returns The first ten characters (date portion).
 */
const toDay = (createdAt: string): string => createdAt.slice(0, 10);

/**
 * Splits a list of insights into today's insight and the past history.
 *
 * "Today" is determined by comparing the date portion of `created_at` against
 * `todayIso` (YYYY-MM-DD). The most recent insight generated today becomes
 * `todayInsight`; every remaining insight (older today items plus all earlier
 * days) goes to `past`, ordered newest-first. Input order is not trusted.
 *
 * @param items Raw insight history items.
 * @param todayIso Local current date as YYYY-MM-DD.
 * @returns The today/past split.
 */
export const splitTodayAndPast = (
  items: AIInsightDTO[],
  todayIso: string,
): InsightHistorySplit => {
  const sorted = [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const todayIndex = sorted.findIndex((item) => toDay(item.created_at) === todayIso);

  if (todayIndex === -1) {
    return { todayInsight: null, past: sorted };
  }

  const todayInsight = sorted[todayIndex] ?? null;
  const past = sorted.filter((_, index) => index !== todayIndex);

  return { todayInsight, past };
};
