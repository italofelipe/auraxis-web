import type { AIInsightDTO } from "~/features/ai-insights/contracts/ai-insight";

import type { FluidaCadence } from "./insight-fluida";

/**
 * Returns the `YYYY-MM` label of the month before `reference`.
 *
 * The monthly closing is anchored on the month that just ended — the cron runs
 * on the 1st and labels the insight with the *previous* month.
 *
 * @param reference Date to walk back from.
 * @returns Period label in `YYYY-MM`.
 */
export const previousMonthLabel = (reference: Date): string => {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth(); // 0-based; 0 → previous is December
  const previous = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  return `${previous.year}-${String(previous.month).padStart(2, "0")}`;
};

/**
 * Whether a history item belongs to the given cadence.
 *
 * `recap` is deliberately excluded from `monthly`: the two coexist in the
 * backend with different period labels (`YYYY-MM` vs `YYYY-MM-recap`) and
 * mixing them would surface duplicated readings.
 *
 * @param dto History item.
 * @param cadence Cadence being read.
 * @returns Whether the item matches.
 */
const matchesCadence = (dto: AIInsightDTO, cadence: FluidaCadence): boolean =>
  dto.period_type === cadence || (dto.period_type === undefined && dto.insight_type === cadence);

/**
 * Sorts by creation time, newest first.
 *
 * @param left First item.
 * @param right Second item.
 * @returns Comparator result.
 */
const newestFirst = (left: AIInsightDTO, right: AIInsightDTO): number =>
  new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

/**
 * Picks which persisted insight the Fluida reading should render for a cadence.
 *
 * Daily and weekly take the most recent one. Monthly prefers the closing of the
 * month that just ended — that is the reading the user is looking for right
 * after the turn of the month — and falls back to the latest monthly otherwise.
 *
 * @param items History items, in any order.
 * @param cadence Cadence being read.
 * @param reference Date used to resolve "previous month". Defaults to now.
 * @returns The chosen insight, or null when the cadence has none.
 */
export const selectInsightForCadence = (
  items: readonly AIInsightDTO[],
  cadence: FluidaCadence,
  reference: Date = new Date(),
): AIInsightDTO | null => {
  const candidates = items.filter((dto) => matchesCadence(dto, cadence)).sort(newestFirst);

  if (candidates.length === 0) {
    return null;
  }

  if (cadence === "monthly") {
    const target = previousMonthLabel(reference);
    return candidates.find((dto) => dto.period_label === target) ?? candidates[0] ?? null;
  }

  return candidates[0] ?? null;
};
