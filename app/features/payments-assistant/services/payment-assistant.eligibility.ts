/**
 * Pure eligibility rules for the Payments Assistant.
 *
 * The assistant surfaces transactions that are still "open" (pending or
 * postponed) and overdue by at least {@link OVERDUE_THRESHOLD_DAYS} days, so the
 * user can clear or discard the backlog of stale entries. Keeping these rules
 * pure (no Vue, no fetch) makes them trivially testable and reusable across the
 * composable and any future surface.
 */

import type { TransactionDto, TransactionStatusDto } from "~/features/transactions/contracts/transaction.dto";
import type { Subscription } from "~/features/subscription/model/subscription";

/** A transaction must be overdue by at least this many days to qualify. */
export const OVERDUE_THRESHOLD_DAYS = 30;

/** Statuses considered "open" (still actionable) by the assistant. */
const ELIGIBLE_STATUSES: ReadonlySet<TransactionStatusDto> = new Set<TransactionStatusDto>([
  "pending",
  "postponed",
]);

/** Subscription statuses that grant access to Premium-only surfaces. */
const PREMIUM_STATUSES: ReadonlySet<Subscription["status"]> = new Set<Subscription["status"]>([
  "active",
  "trialing",
]);

/**
 * Formats a Date as a local `YYYY-MM-DD` calendar date.
 *
 * Uses local components (not UTC) so comparisons line up with the calendar the
 * user sees, avoiding timezone off-by-one around midnight.
 *
 * @param date Date to format.
 * @returns ISO calendar-date string.
 */
const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Whether a `due_date` is overdue by at least `days` days relative to `today`.
 *
 * The comparison is calendar-date only (lexicographic on `YYYY-MM-DD`, which is
 * chronologically correct for that format). A due date exactly on the cutoff
 * (`today - days`) counts as overdue.
 *
 * @param dueDate Due date as `YYYY-MM-DD`.
 * @param days Minimum number of days overdue.
 * @param today Reference "now" date.
 * @returns True when `dueDate <= today - days`.
 */
export const isOverdueByAtLeastDays = (dueDate: string, days: number, today: Date): boolean => {
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - days);
  return dueDate <= toIsoDate(cutoff);
};

/**
 * Selects the transactions the assistant should present, oldest due date first.
 *
 * Keeps only open (pending/postponed) entries overdue beyond the threshold and
 * sorts them ascending by due date so the most stale item is reviewed first.
 *
 * @param transactions Full set of candidate transactions.
 * @param today Reference "now" date.
 * @param thresholdDays Overdue threshold (defaults to {@link OVERDUE_THRESHOLD_DAYS}).
 * @returns Filtered, sorted list of overdue open transactions.
 */
export const selectOverdueCandidates = (
  transactions: readonly TransactionDto[],
  today: Date,
  thresholdDays: number = OVERDUE_THRESHOLD_DAYS,
): TransactionDto[] =>
  transactions
    .filter(
      (transaction) =>
        ELIGIBLE_STATUSES.has(transaction.status) &&
        isOverdueByAtLeastDays(transaction.due_date, thresholdDays, today),
    )
    .slice()
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

/**
 * Whether a subscription grants access to Premium-only features.
 *
 * Premium requires an active or trialing subscription on a paid (non-free) plan.
 *
 * @param subscription Current subscription, if any.
 * @returns True when the user is entitled to Premium surfaces.
 */
export const isPremiumSubscription = (
  subscription: Subscription | null | undefined,
): boolean => {
  if (!subscription) {
    return false;
  }
  if (!PREMIUM_STATUSES.has(subscription.status)) {
    return false;
  }
  return subscription.planSlug !== "free" && subscription.planSlug.length > 0;
};
