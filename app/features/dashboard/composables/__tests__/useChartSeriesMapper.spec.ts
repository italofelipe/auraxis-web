import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";

import { useChartSeriesMapper } from "../useChartSeriesMapper";
import { colors } from "~/theme/tokens/colors";
import type { DashboardTimeseriesPoint } from "~/features/dashboard/model/dashboard-overview";

vi.mock("vue-i18n", () => ({
  useI18n: (): { locale: ReturnType<typeof ref<string>> } => ({ locale: ref("pt-BR") }),
}));

/**
 * Creates a DashboardTimeseriesPoint fixture for testing.
 *
 * @param overrides Partial fields to override (date, income, expense, balance).
 * @returns A complete timeseries point.
 */
const makePoint = (overrides: Partial<DashboardTimeseriesPoint>): DashboardTimeseriesPoint => ({
  date: "2024-01-01",
  income: 0,
  expense: 0,
  balance: 0,
  ...overrides,
});

describe("useChartSeriesMapper", () => {
  describe("mapTimeseries", () => {
    it("returns isEmpty=true and empty labels/data when given an empty array", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([]);

      expect(result.isEmpty).toBe(true);
      expect(result.labels).toEqual([]);
      expect(result.series).toHaveLength(3);
      for (const s of result.series) {
        expect(s.data).toEqual([]);
      }
    });

    it("returns correct series names for empty input", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([]);
      const [income, expense, balance] = result.series;

      expect(income?.name).toBe("Receitas");
      expect(expense?.name).toBe("Despesas");
      expect(balance?.name).toBe("Saldo");
    });

    it("returns isEmpty=false for a single point", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ date: "2024-01-15", income: 1000, expense: 500, balance: 500 })]);

      expect(result.isEmpty).toBe(false);
      expect(result.labels).toHaveLength(1);
      for (const s of result.series) {
        expect(s.data).toHaveLength(1);
      }
    });

    it("maps income, expense, balance data correctly for a single point", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ date: "2024-01-15", income: 1000, expense: 500, balance: 500 })]);
      const [incomeSeries, expenseSeries, balanceSeries] = result.series;

      expect(incomeSeries?.data[0]).toBe(1000);
      expect(expenseSeries?.data[0]).toBe(500);
      expect(balanceSeries?.data[0]).toBe(500);
    });

    it("handles multiple points with correct label and data length", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const points = [
        makePoint({ date: "2024-01-01", income: 1000, expense: 400, balance: 600 }),
        makePoint({ date: "2024-02-01", income: 1200, expense: 600, balance: 600 }),
        makePoint({ date: "2024-03-01", income: 900, expense: 300, balance: 600 }),
      ];
      const result = mapTimeseries(points);

      expect(result.isEmpty).toBe(false);
      expect(result.labels).toHaveLength(3);
      for (const s of result.series) {
        expect(s.data).toHaveLength(3);
      }
    });

    it("maps income data values correctly across multiple points", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const points = [
        makePoint({ date: "2024-01-01", income: 100, expense: 50, balance: 50 }),
        makePoint({ date: "2024-02-01", income: 200, expense: 80, balance: 120 }),
        makePoint({ date: "2024-03-01", income: 150, expense: 60, balance: 90 }),
      ];
      const result = mapTimeseries(points);
      const [incomeSeries, expenseSeries, balanceSeries] = result.series;

      expect(incomeSeries?.data).toEqual([100, 200, 150]);
      expect(expenseSeries?.data).toEqual([50, 80, 60]);
      expect(balanceSeries?.data).toEqual([50, 120, 90]);
    });

    it("always returns series in order: income, expense, balance", () => {
      const { mapTimeseries } = useChartSeriesMapper();

      const emptyResult = mapTimeseries([]);
      const [ei, ee, eb] = emptyResult.series;
      expect(ei?.name).toBe("Receitas");
      expect(ee?.name).toBe("Despesas");
      expect(eb?.name).toBe("Saldo");

      const nonEmptyResult = mapTimeseries([makePoint({ income: 100, expense: 50, balance: 50 })]);
      const [ni, ne, nb] = nonEmptyResult.series;
      expect(ni?.name).toBe("Receitas");
      expect(ne?.name).toBe("Despesas");
      expect(nb?.name).toBe("Saldo");
    });

    it("assigns correct design-token colors to each series", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ income: 100, expense: 50, balance: 50 })]);
      const [incomeSeries, expenseSeries, balanceSeries] = result.series;

      expect(incomeSeries?.color).toBe(colors.positive.DEFAULT);
      expect(expenseSeries?.color).toBe(colors.negative.DEFAULT);
      expect(balanceSeries?.color).toBe(colors.cyan[500]);
    });

    it("assigns correct design-token colors in empty case too", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([]);
      const [incomeSeries, expenseSeries, balanceSeries] = result.series;

      expect(incomeSeries?.color).toBe(colors.positive.DEFAULT);
      expect(expenseSeries?.color).toBe(colors.negative.DEFAULT);
      expect(balanceSeries?.color).toBe(colors.cyan[500]);
    });

    it("generates a PT-BR formatted label for a known date", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ date: "2024-01-15" })]);
      const [label] = result.labels;

      expect(label).toMatch(/15/);
      expect(label).toMatch(/2024/);
    });

    it("handles negative balance values in data arrays", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ income: 500, expense: 800, balance: -300 })]);
      const [, , balanceSeries] = result.series;

      expect(balanceSeries?.data[0]).toBe(-300);
    });

    it("handles zero values in all fields", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const result = mapTimeseries([makePoint({ income: 0, expense: 0, balance: 0 })]);
      const [incomeSeries, expenseSeries, balanceSeries] = result.series;

      expect(result.isEmpty).toBe(false);
      expect(incomeSeries?.data[0]).toBe(0);
      expect(expenseSeries?.data[0]).toBe(0);
      expect(balanceSeries?.data[0]).toBe(0);
    });

    it("labels array length always matches input points length", () => {
      const { mapTimeseries } = useChartSeriesMapper();
      const points = Array.from({ length: 6 }, (_, i) =>
        makePoint({ date: `2024-0${i + 1}-01`, income: i * 100, expense: i * 50, balance: i * 50 }),
      );
      const result = mapTimeseries(points);

      expect(result.labels).toHaveLength(6);
      for (const s of result.series) {
        expect(s.data).toHaveLength(6);
      }
    });
  });
});
