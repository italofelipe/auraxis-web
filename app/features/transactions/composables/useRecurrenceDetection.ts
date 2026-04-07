/**
 * useRecurrenceDetection — PROD-13-1
 *
 * Pure algorithm: detects probable recurring transaction patterns from an
 * existing transaction list without any additional network requests.
 *
 * Detection criteria (all must match):
 *  1. Group by tag_id (or title substring when tag absent).
 *  2. Value repeats across ≥ 3 distinct calendar months (±5% tolerance).
 *  3. Median gap between due_dates is 28–31 days (monthly cadence).
 *  4. Transaction is not already marked as recurring.
 *
 * Returns ranked patterns with a confidence level: high / medium / low.
 *
 * Issues: #533 (parent), #559
 */

import { computed, type ComputedRef } from "vue";
import type { TransactionDto } from "../contracts/transaction.dto";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Relative tolerance for "same amount" comparison (±5 %). */
const AMOUNT_TOLERANCE = 0.05;

/** Minimum occurrences across distinct months to be considered a pattern. */
const MIN_DISTINCT_MONTHS = 3;

/** Acceptable day-gap range for monthly recurrence. */
const MONTHLY_GAP_MIN = 25;
const MONTHLY_GAP_MAX = 35;

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecurrenceConfidence = "high" | "medium" | "low";

export interface RecurrencePattern {
  /** Grouping key: tag_id if available, otherwise a normalised title fragment. */
  readonly groupKey: string;

  /** Human-readable label derived from the most common transaction title. */
  readonly label: string;

  /** Median amount across matched occurrences (numeric). */
  readonly medianAmount: number;

  /** IDs of the source transactions that formed this pattern. */
  readonly transactionIds: readonly string[];

  /** Detected confidence level. */
  readonly confidence: RecurrenceConfidence;

  /** Estimated yearly financial impact based on median amount. */
  readonly annualImpact: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses a decimal string to a float, returning 0 on failure.
 *
 * @param value - The string representation of the monetary amount.
 * @returns Parsed number or 0.
 */
function parseAmount(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Checks whether two amounts are within ±AMOUNT_TOLERANCE of each other
 * relative to the reference amount.
 *
 * @param a - First amount.
 * @param b - Second amount.
 * @returns True when they are close enough.
 */
function amountsMatch(a: number, b: number): boolean {
  if (a === 0 && b === 0) { return true; }
  const ref = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) / ref <= AMOUNT_TOLERANCE;
}

/**
 * Returns the median of a numeric array, or 0 for an empty array.
 *
 * @param values - Sorted or unsorted array of numbers.
 * @returns Median value.
 */
function median(values: number[]): number {
  if (values.length === 0) { return 0; }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
}

/**
 * Returns a normalised substring of title suitable for grouping when there
 * is no tag_id.  Lowercased, trimmed, first 30 chars.
 *
 * @param title - The raw transaction title.
 * @returns Normalised key.
 */
function titleKey(title: string): string {
  return title.toLowerCase().trim().slice(0, 30);
}

/**
 * Returns the YYYY-MM string for a given ISO date string, or empty string on
 * parse failure.
 *
 * @param isoDate - ISO 8601 date string (YYYY-MM-DD).
 * @returns Month key or empty string.
 */
function monthKey(isoDate: string): string {
  if (!isoDate) { return ""; }
  return isoDate.slice(0, 7); // "YYYY-MM"
}

/**
 * Computes consecutive day-gaps between an array of ISO date strings sorted
 * ascending.
 *
 * @param sortedDates - ISO date strings sorted oldest → newest.
 * @returns Array of day differences between consecutive dates.
 */
function dayGaps(sortedDates: string[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] ?? "").getTime();
    const curr = new Date(sortedDates[i] ?? "").getTime();
    if (!Number.isFinite(prev) || !Number.isFinite(curr)) { continue; }
    gaps.push(Math.round((curr - prev) / 86_400_000));
  }
  return gaps;
}

/**
 * Assigns a confidence level based on the number of distinct months matched
 * and how consistent the median day-gap is.
 *
 * @param distinctMonths - Number of distinct calendar months with a match.
 * @param medianGap - Median gap in days between occurrences.
 * @returns Confidence level.
 */
function computeConfidence(
  distinctMonths: number,
  medianGap: number,
): RecurrenceConfidence {
  const gapInRange = medianGap >= MONTHLY_GAP_MIN && medianGap <= MONTHLY_GAP_MAX;
  if (distinctMonths >= 6 && gapInRange) { return "high"; }
  if (distinctMonths >= 4 && gapInRange) { return "medium"; }
  // 3 months with monthly cadence — plausible but insufficient history.
  return "low";
}

// ── Core detector (internal helpers) ─────────────────────────────────────────

/**
 * Groups transactions by tag_id (preferred) or title key into a Map.
 *
 * @param candidates - Pre-filtered list of non-recurring transactions.
 * @returns Map from group key to transaction array.
 */
function groupCandidates(
  candidates: readonly TransactionDto[],
): Map<string, TransactionDto[]> {
  const groups = new Map<string, TransactionDto[]>();
  for (const tx of candidates) {
    const key = tx.tag_id ? `tag:${tx.tag_id}` : `title:${titleKey(tx.title)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(tx);
    groups.set(key, bucket);
  }
  return groups;
}

/**
 * Extracts the most frequent transaction title from a matched list,
 * falling back to the group key when no title is present.
 *
 * @param matched - Transactions within the pattern's amount band.
 * @param groupKey - Fallback label when titles are absent.
 * @returns Human-readable label for the pattern.
 */
function extractLabel(matched: readonly TransactionDto[], groupKey: string): string {
  const titleCounts = new Map<string, number>();
  for (const t of matched) {
    titleCounts.set(t.title, (titleCounts.get(t.title) ?? 0) + 1);
  }
  return [...titleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? groupKey;
}

/**
 * Attempts to build a {@link RecurrencePattern} from a group of transactions.
 * Returns `null` when the group does not meet the detection criteria.
 *
 * @param groupKey - Unique key for this group.
 * @param txs - All transactions in the group (unsorted).
 * @returns Detected pattern or null.
 */
function buildPattern(
  groupKey: string,
  txs: readonly TransactionDto[],
): RecurrencePattern | null {
  if (txs.length < MIN_DISTINCT_MONTHS) { return null; }

  const sorted = [...txs].sort((a, b) =>
    (a.due_date ?? "").localeCompare(b.due_date ?? ""),
  );

  const med = median(sorted.map((t) => parseAmount(t.amount)));
  const matched = sorted.filter((t) => amountsMatch(parseAmount(t.amount), med));

  if (matched.length < MIN_DISTINCT_MONTHS) { return null; }

  const months = new Set(matched.map((t) => monthKey(t.due_date)));
  if (months.size < MIN_DISTINCT_MONTHS) { return null; }

  const medGap = median(dayGaps(matched.map((t) => t.due_date)));
  if (medGap < MONTHLY_GAP_MIN || medGap > MONTHLY_GAP_MAX) { return null; }

  return {
    groupKey,
    label: extractLabel(matched, groupKey),
    medianAmount: med,
    transactionIds: matched.map((t) => t.id),
    confidence: computeConfidence(months.size, medGap),
    annualImpact: med * 12,
  };
}

// ── Core detector (public) ────────────────────────────────────────────────────

/**
 * Runs the recurrence detection algorithm on a snapshot of transactions.
 *
 * @param transactions - All user transactions (any period).
 * @returns Array of detected patterns, sorted by confidence descending.
 */
export function detectRecurrencePatterns(
  transactions: readonly TransactionDto[],
): RecurrencePattern[] {
  const candidates = transactions.filter((t) => !t.is_recurring && !t.is_installment);
  const groups = groupCandidates(candidates);

  const patterns: RecurrencePattern[] = [];
  for (const [groupKey, txs] of groups) {
    const pattern = buildPattern(groupKey, txs);
    if (pattern) { patterns.push(pattern); }
  }

  const order: Record<RecurrenceConfidence, number> = { high: 0, medium: 1, low: 2 };
  return patterns.sort(
    (a, b) => order[a.confidence] - order[b.confidence] || b.annualImpact - a.annualImpact,
  );
}

// ── Composable ────────────────────────────────────────────────────────────────

/**
 * Vue composable wrapper around {@link detectRecurrencePatterns}.
 *
 * @param transactions - Reactive list of transactions from useListTransactionsQuery.
 * @returns Computed list of recurrence patterns.
 */
export function useRecurrenceDetection(
  transactions: ComputedRef<readonly TransactionDto[]>,
): { patterns: ComputedRef<RecurrencePattern[]> } {
  const patterns = computed(() => detectRecurrencePatterns(transactions.value));
  return { patterns };
}
