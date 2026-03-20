/**
 * Canonical period presets for the dashboard overview filter.
 * "custom" requires explicit start/end dates.
 */
export type DashboardPeriod = "1m" | "3m" | "6m" | "12m" | "custom";

export interface PeriodOption {
  readonly label: string;
  readonly value: DashboardPeriod;
}

/**
 * Ordered list of selectable period options shown in the period selector UI.
 */
export const PERIOD_OPTIONS: ReadonlyArray<PeriodOption> = [
  { label: "1 mês", value: "1m" },
  { label: "3 meses", value: "3m" },
  { label: "6 meses", value: "6m" },
  { label: "12 meses", value: "12m" },
];
