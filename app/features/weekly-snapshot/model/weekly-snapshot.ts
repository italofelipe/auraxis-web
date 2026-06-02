/**
 * Domain model for the Weekly Snapshot card (UX-02-1, #561).
 *
 * Maps the premium AI weekly-summary narrative DTO into a compact view model
 * and provides pure helpers for the "NOVO" badge (localStorage-backed
 * seen/unseen detection driven by a stable content signature).
 */

import type { WeeklySummaryNarrativeDto } from "../contracts/weekly-snapshot.dto";

export interface WeeklySnapshot {
  narrative: string;
  weekStart: string;
  weekEnd: string;
  currentIncome: number;
  currentExpense: number;
  currentBalance: number;
  transactionCount: number;
  expenseDeltaPercent: number;
  balanceDeltaPercent: number;
}

/** localStorage key holding the last snapshot signature the user has seen. */
export const WEEKLY_SNAPSHOT_SEEN_KEY = "auraxis.weekly-snapshot.seen";

/**
 * Maps the backend narrative DTO into the Weekly Snapshot domain model.
 *
 * @param dto Premium weekly-summary narrative payload.
 * @returns Compact view model for the dashboard card.
 */
export function mapWeeklySnapshotDto(dto: WeeklySummaryNarrativeDto): WeeklySnapshot {
  const current = dto.summary.current_week;
  const comparison = dto.summary.comparison;
  return {
    narrative: dto.narrative,
    weekStart: current.start,
    weekEnd: current.end,
    currentIncome: current.income,
    currentExpense: current.expense,
    currentBalance: current.balance,
    transactionCount: current.transaction_count,
    expenseDeltaPercent: comparison.expense_delta_percent,
    balanceDeltaPercent: comparison.balance_delta_percent,
  };
}

/**
 * Builds a stable signature for change detection. Two snapshots with the same
 * week bounds and current-week expense produce the same signature.
 *
 * @param snapshot Weekly snapshot view model.
 * @returns Signature string.
 */
export function buildSnapshotSignature(snapshot: WeeklySnapshot): string {
  return `${snapshot.weekStart}_${snapshot.weekEnd}_${snapshot.currentExpense}`;
}

/**
 * Decides whether the snapshot is new relative to the last seen signature.
 *
 * @param snapshot Weekly snapshot view model.
 * @param lastSeenSignature Signature previously persisted, or null.
 * @returns True when the snapshot has not been seen yet.
 */
export function isSnapshotUnseen(
  snapshot: WeeklySnapshot,
  lastSeenSignature: string | null,
): boolean {
  return buildSnapshotSignature(snapshot) !== lastSeenSignature;
}
