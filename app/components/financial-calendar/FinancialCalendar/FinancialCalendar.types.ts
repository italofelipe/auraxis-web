import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";

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
