/**
 * A single data series for rendering in a chart.
 */
export interface ChartSeries {
  readonly name: string;
  readonly data: number[];
  readonly color: string;
}

/**
 * Normalized result of the chart series mapper.
 * Consumers use `labels` for the x-axis and `series` for the data lines/bars.
 */
export interface ChartSeriesResult {
  readonly labels: string[];
  readonly series: ChartSeries[];
  readonly isEmpty: boolean;
}
