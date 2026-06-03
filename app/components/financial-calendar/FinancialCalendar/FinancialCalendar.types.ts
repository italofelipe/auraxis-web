import type { TransactionDto } from "~/features/transactions/contracts/transaction.dto";

/**
 * Aggregated data for a single calendar cell.
 *
 * Cells outside the current month (`isCurrentMonth === false`) are padding
 * slots used to fill the 6×7 weekly grid; their transaction arrays are empty.
 */
export type CalendarDay = {
  /** ISO date string YYYY-MM-DD identifying this cell. */
  readonly date: string;
  /** Numeric day of month (1–31). */
  readonly dayOfMonth: number;
  /** True when this cell belongs to the displayed month. */
  readonly isCurrentMonth: boolean;
  /** True when this cell represents today's date. */
  readonly isToday: boolean;
  /** Transactions whose due_date matches this date. */
  readonly transactions: TransactionDto[];
  /** Sum of all income transactions for this day. */
  readonly totalIncome: number;
  /** Sum of all expense transactions for this day (always ≥ 0). */
  readonly totalExpense: number;
  /** Net daily balance: totalIncome − totalExpense. */
  readonly dailyBalance: number;
  /** Running cumulative balance from the first day of the month. */
  readonly cumulativeBalance: number;
  /**
   * True when this day is part of a "cash valley":
   * a sequence of 3 or more consecutive days within the current month
   * where the daily net balance is negative.
   */
  readonly isCashValley: boolean;
};

/** Props accepted by FinancialCalendar. */
export interface FinancialCalendarProps {
  /**
   * Optional initial year override.
   * Defaults to the current year when omitted.
   */
  initialYear?: number;
  /**
   * Optional initial month override (0 = January, 11 = December).
   * Defaults to the current month when omitted.
   */
  initialMonth?: number;
}

/** Events emitted by FinancialCalendar. */
export interface FinancialCalendarEmits {
  /**
   * Emitted when the user clicks a day cell.
   *
   * @param e - Event name.
   * @param day - The CalendarDay data for the clicked cell.
   */
  (e: "day-click", day: CalendarDay): void;
}
