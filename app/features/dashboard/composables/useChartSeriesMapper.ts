import { useI18n } from "vue-i18n";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";
import { useTheme } from "~/composables/useTheme";
import { themePalettes } from "~/theme/tokens/semantic";
import type { ChartSeries, ChartSeriesResult } from "./useChartSeriesMapper.types";

type TimeseriesKey = "income" | "expense" | "balance";

interface SeriesMeta {
  readonly name: string;
}

const TIMESERIES_SERIES: Record<TimeseriesKey, SeriesMeta> = {
  income:  { name: "Receitas" },
  expense: { name: "Despesas" },
  balance: { name: "Saldo" },
};

/**
 * Resolves the theme-aware chart colour for a timeseries key.
 *
 * @param key Timeseries key.
 * @param theme Current resolved theme.
 * @returns Hex colour from semantic chart tokens.
 */
function resolveSeriesColor(key: TimeseriesKey, theme: keyof typeof themePalettes): string {
  const palette = themePalettes[theme].chart;
  const colors: Record<TimeseriesKey, string> = {
    income:  palette.income,
    expense: palette.expense,
    balance: palette.balance,
  };

  return colors[key];
}

/**
 * Formats an ISO calendar date to a compact localized label.
 *
 * @param dateStr ISO date string (YYYY-MM-DD).
 * @param locale  BCP 47 locale string.
 * @returns Compact localized date label.
 */
const formatLabel = (dateStr: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateStr}T00:00:00`));

/**
 * Return type for {@link useChartSeriesMapper}.
 */
export interface ChartSeriesMapperResult {
  /**
   * Maps an array of dashboard timeseries points to normalized chart series
   * with PT-BR labels and design-token colors.
   *
   * @param points Array of timeseries data points.
   * @returns Normalized chart series result.
   */
  mapTimeseries: (points: DashboardTimeseriesPoint[]) => ChartSeriesResult;
}

/**
 * Shared composable that normalizes domain data into chart series.
 *
 * Centralizes label formatting and color assignment so that dashboard,
 * wallet, goals and tools screens share a single source of truth for
 * series rendering.
 *
 * @returns Object with chart mapping utilities.
 */
export function useChartSeriesMapper(): ChartSeriesMapperResult {
  const { locale } = useI18n();
  const { resolvedTheme } = useTheme();

  /**
   * Maps an array of dashboard timeseries points to normalized chart series.
   *
   * @param points Array of timeseries data points.
   * @returns Normalized chart series result with locale-aware labels and design-token colors.
   */
  const mapTimeseries = (points: DashboardTimeseriesPoint[]): ChartSeriesResult => {
    if (points.length === 0) {
      const emptySeries: ChartSeries[] = (["income", "expense", "balance"] as TimeseriesKey[]).map(
        (key) => ({
          name: TIMESERIES_SERIES[key].name,
          data: [],
          color: resolveSeriesColor(key, resolvedTheme.value),
        }),
      );
      return { labels: [], series: emptySeries, isEmpty: true };
    }

    const labels = points.map((p) => formatLabel(p.date, locale.value));

    const series: ChartSeries[] = (["income", "expense", "balance"] as TimeseriesKey[]).map(
      (key) => ({
        name: TIMESERIES_SERIES[key].name,
        data: points.map((p) => p[key]),
        color: resolveSeriesColor(key, resolvedTheme.value),
      }),
    );

    return { labels, series, isEmpty: false };
  };

  return { mapTimeseries };
}
