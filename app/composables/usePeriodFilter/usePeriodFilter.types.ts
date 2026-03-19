import type { Ref } from "vue";

export type Period = "day" | "week" | "month" | "quarter" | "year"

export interface PeriodOption {
  value: Period
  label: string
  /** Label curto para mobile */
  labelShort: string
}

export interface UsePeriodFilterReturn {
  selectedPeriod: Readonly<Ref<Period>>
  setPeriod: (period: Period) => void
  periodOptions: PeriodOption[]
  isSelected: (period: Period) => boolean
}
