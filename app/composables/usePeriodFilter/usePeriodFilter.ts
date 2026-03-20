import { ref, readonly } from "vue";
import type { UsePeriodFilterReturn, Period, PeriodOption } from "./usePeriodFilter.types";

/** Opções canônicas de período para dashboards e relatórios. */
export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "day", label: "Dia", labelShort: "D" },
  { value: "week", label: "Semana", labelShort: "S" },
  { value: "month", label: "Mês", labelShort: "M" },
  { value: "quarter", label: "Trimestre", labelShort: "T" },
  { value: "year", label: "Ano", labelShort: "A" },
];

/**
 * Gerencia o filtro de período para dashboards e relatórios.
 * Exporta opções canônicas como constante para reutilização.
 * @param initial - Período inicial selecionado (padrão: "month").
 * @returns Objeto com selectedPeriod, setPeriod, periodOptions e isSelected.
 */
export function usePeriodFilter(initial: Period = "month"): UsePeriodFilterReturn {
  const selectedPeriod = ref<Period>(initial);

  return {
    selectedPeriod: readonly(selectedPeriod),
    periodOptions: PERIOD_OPTIONS,
    setPeriod: (period: Period): void => { selectedPeriod.value = period; },
    isSelected: (period: Period): boolean => selectedPeriod.value === period,
  };
}
