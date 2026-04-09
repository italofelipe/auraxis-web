import type { CalendarDay } from "~/features/transactions/composables/useFinancialCalendar";

/** Props accepted by CalendarDayDetail. */
export interface CalendarDayDetailProps {
  /** The calendar day whose transactions should be displayed. Null closes the modal. */
  day: CalendarDay | null;
  /** Controls modal visibility. */
  visible: boolean;
}

/** Events emitted by CalendarDayDetail. */
export interface CalendarDayDetailEmits {
  /**
   * Emitted when the modal requests to be closed.
   *
   * @param e - Event name.
   */
  (e: "update:visible", value: boolean): void;
}
