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

const SPENDING_PATTERNS_TYPE = "spending_patterns";

/**
 * A "rich" insight is a period-aware report (daily/weekly/monthly/recap) — i.e.
 * anything that is not the lightweight `spending_patterns` Radar payload.
 *
 * @param item Insight DTO.
 * @returns True when the insight is a rich period report.
 */
const isRichInsight = (item: AIInsightDTO): boolean =>
  (item.insight_type as string) !== SPENDING_PATTERNS_TYPE;

/**
 * Splits a list of insights into today's headline insight and the past history.
 *
 * "Today" is determined by comparing the date portion of `created_at` against
 * `todayIso` (YYYY-MM-DD). Among today's insights the headline prefers the most
 * recent *rich* report (daily/weekly/monthly) over a `spending_patterns` Radar
 * payload, falling back to the most recent today insight when no rich one
 * exists. Every remaining insight goes to `past`, ordered newest-first. Input
 * order is not trusted.
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

  const todayItems = sorted.filter((item) => toDay(item.created_at) === todayIso);
  if (todayItems.length === 0) {
    return { todayInsight: null, past: sorted };
  }

  const todayInsight = todayItems.find(isRichInsight) ?? todayItems[0] ?? null;
  const past = sorted.filter((item) => item !== todayInsight);

  return { todayInsight, past };
};
