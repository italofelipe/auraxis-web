/**
 * Pure logic for the "fatura {mmm/aa}" badge shown on credit-card rows in the
 * transactions list.
 *
 * Background: when the list is browsed by month, the backend groups credit-card
 * entries by their *bill* month (the card's closing cycle) instead of the
 * purchase date. A purchase made on 19/06 that lands on the July bill therefore
 * shows up under "July" while still displaying its real date (19/06). The badge
 * flags that temporal borrow so the date is not misread.
 *
 * The decision is fully derivable on the client from the row's `due_date`, the
 * selected month and the period mode — no card cycle metadata is needed here,
 * because the backend already performed the bill grouping.
 */

/** Period navigation mode exposed by `useTransactionFilters`. */
export type BillBadgePeriodMode = "month" | "custom";

/** Inputs needed to decide whether a row should show the bill badge. */
export interface CreditCardBillBadgeInput {
  /** `credit_card_id` of the transaction row (null for non-card entries). */
  readonly creditCardId: string | null;
  /** Transaction `due_date` in ISO `YYYY-MM-DD` format. */
  readonly dueDate: string;
  /** Active period mode; the badge only applies to `"month"`. */
  readonly periodMode: BillBadgePeriodMode;
  /**
   * Start-of-month timestamp (epoch ms) of the currently selected month, as
   * stored by `useTransactionFilters` (`filterStartDate` in month mode), or
   * `null` when it cannot be resolved.
   */
  readonly selectedMonthTimestamp: number | null;
}

/** Result of {@link resolveCreditCardBillBadge} when the badge is visible. */
export interface CreditCardBillBadge {
  /** Selected month formatted as short pt-BR `mmm/aa` (e.g. `"jul/26"`). */
  readonly billMonthLabel: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Formats a timestamp's month as a short pt-BR `mmm/aa` label via `Intl`.
 *
 * Uses `formatToParts` so the slash separator is composed explicitly and the
 * abbreviated month keeps no locale trailing period (e.g. `"jul."` → `"jul"`).
 *
 * @param timestamp Epoch milliseconds for any instant inside the target month.
 * @returns Label such as `"jul/26"`.
 */
export function formatBillMonthLabel(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).formatToParts(new Date(timestamp));

  const month = (parts.find((part) => part.type === "month")?.value ?? "")
    .replace(/\.$/, "")
    .toLowerCase();
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  return `${month}/${year}`;
}

/**
 * Reads the `year`/`month` pair from an ISO `YYYY-MM-DD` string.
 *
 * @param isoDate ISO date string.
 * @returns `{ year, month }` (1-based month) or `null` when malformed.
 */
function parseIsoYearMonth(isoDate: string): { year: number; month: number } | null {
  if (!ISO_DATE_PATTERN.test(isoDate)) {
    return null;
  }

  const [year, month] = isoDate.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  return { year: year as number, month: month as number };
}

/**
 * Decides whether a transaction row should display the "fatura {mmm/aa}" badge
 * and, if so, the month label to render.
 *
 * The badge appears only when:
 *  - the period mode is `"month"` (custom ranges keep the raw `due_date`);
 *  - the row is a credit-card entry (`creditCardId` is set);
 *  - the selected month is known; and
 *  - the `due_date` belongs to a different calendar month than the selected
 *    one — i.e. the purchase was "borrowed" from another month by the bill
 *    cycle. When they coincide the badge is suppressed to avoid noise.
 *
 * @param input Row and period context.
 * @returns Badge descriptor, or `null` when no badge should be shown.
 */
export function resolveCreditCardBillBadge(
  input: CreditCardBillBadgeInput,
): CreditCardBillBadge | null {
  if (input.periodMode !== "month") {
    return null;
  }
  if (input.creditCardId === null) {
    return null;
  }
  if (input.selectedMonthTimestamp === null) {
    return null;
  }

  const due = parseIsoYearMonth(input.dueDate);
  if (due === null) {
    return null;
  }

  const selected = new Date(input.selectedMonthTimestamp);
  const selectedYear = selected.getFullYear();
  const selectedMonth = selected.getMonth() + 1;

  if (due.year === selectedYear && due.month === selectedMonth) {
    return null;
  }

  return { billMonthLabel: formatBillMonthLabel(input.selectedMonthTimestamp) };
}
