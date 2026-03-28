export type UiChartPanelProps = {
  /** Panel title rendered in the header. */
  title?: string;
  /** Optional subtitle shown below the title. */
  subtitle?: string;
  /** Optional helper tooltip text — rendered as a UiInfoTooltip icon. */
  helper?: string;
  /** Height of the chart body area. Passed as a CSS string (e.g. "280px"). Default: "280px". */
  chartHeight?: string;
  /** Shows an animated skeleton in the chart body while data is loading. */
  loading?: boolean;
};
