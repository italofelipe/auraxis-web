export interface BillingCycleInput {
  readonly purchaseDate: string | Date;
  readonly closingDay: number;
  readonly dueDay: number;
}

export interface BillingCyclePreview {
  readonly billMonth: string;
  readonly billLabel: string;
  readonly cycleStartDate: string;
  readonly closingDate: string;
  readonly dueDate: string;
  readonly closesAfterPurchase: boolean;
}

const MONTH_LABELS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

/**
 * Converts API date strings and Date instances into local date-only values.
 *
 * @param value API date string or Date instance.
 * @returns Local date-only value.
 */
const toDate = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
};

/**
 * Returns the first day of a month shifted by the provided offset.
 *
 * @param year Base year.
 * @param monthIndex Zero-based base month.
 * @param offset Month offset.
 * @returns First day of the shifted month.
 */
const shiftMonth = (year: number, monthIndex: number, offset: number): Date => {
  return new Date(year, monthIndex + offset, 1);
};

/**
 * Returns the number of days in the target month.
 *
 * @param year Target year.
 * @param monthIndex Zero-based target month.
 * @returns Last calendar day in the month.
 */
const lastDayOfMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Clamps statement days like 31 to the last valid day in short months.
 *
 * @param year Target year.
 * @param monthIndex Zero-based target month.
 * @param day Requested day.
 * @returns Valid day for the month.
 */
const clampDay = (year: number, monthIndex: number, day: number): number => {
  return Math.min(Math.max(day, 1), lastDayOfMonth(year, monthIndex));
};

/**
 * Creates a local Date using a month-safe day.
 *
 * @param year Target year.
 * @param monthIndex Zero-based target month.
 * @param day Requested day.
 * @returns Local date using a clamped day.
 */
const buildDate = (year: number, monthIndex: number, day: number): Date => {
  return new Date(year, monthIndex, clampDay(year, monthIndex, day));
};

/**
 * Serializes a Date as YYYY-MM-DD without timezone conversion.
 *
 * @param date Date to serialize.
 * @returns Date-only ISO string.
 */
const isoDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Serializes the bill month as YYYY-MM.
 *
 * @param date Date inside the target bill month.
 * @returns Bill month key.
 */
const billMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Formats the bill month in Portuguese for the UI preview.
 *
 * @param date Date inside the target bill month.
 * @returns Human-readable bill label.
 */
const billLabel = (date: Date): string => {
  return `${MONTH_LABELS[date.getMonth()]} de ${date.getFullYear()}`;
};

/**
 * Resolves which bill receives a purchase based on closing and due days.
 *
 * @param input Purchase date and card cycle settings.
 * @returns Bill cycle preview for the purchase.
 */
export const resolveCreditCardBillingCycle = (
  input: BillingCycleInput,
): BillingCyclePreview => {
  const purchaseDate = toDate(input.purchaseDate);
  const purchaseYear = purchaseDate.getFullYear();
  const purchaseMonth = purchaseDate.getMonth();

  const closeAnchor =
    purchaseDate.getDate() <= input.closingDay
      ? new Date(purchaseYear, purchaseMonth, 1)
      : shiftMonth(purchaseYear, purchaseMonth, 1);

  const closingDate = buildDate(
    closeAnchor.getFullYear(),
    closeAnchor.getMonth(),
    input.closingDay,
  );
  const previousCloseAnchor = shiftMonth(
    closeAnchor.getFullYear(),
    closeAnchor.getMonth(),
    -1,
  );
  const previousClosingDate = buildDate(
    previousCloseAnchor.getFullYear(),
    previousCloseAnchor.getMonth(),
    input.closingDay,
  );

  const dueAnchor =
    input.dueDay > input.closingDay
      ? closeAnchor
      : shiftMonth(closeAnchor.getFullYear(), closeAnchor.getMonth(), 1);
  const dueDate = buildDate(
    dueAnchor.getFullYear(),
    dueAnchor.getMonth(),
    input.dueDay,
  );
  const cycleStartDate = new Date(previousClosingDate);
  cycleStartDate.setDate(previousClosingDate.getDate() + 1);

  return {
    billMonth: billMonth(closingDate),
    billLabel: billLabel(closingDate),
    cycleStartDate: isoDate(cycleStartDate),
    closingDate: isoDate(closingDate),
    dueDate: isoDate(dueDate),
    closesAfterPurchase: purchaseDate <= closingDate,
  };
};
