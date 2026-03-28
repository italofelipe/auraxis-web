export type UiListPanelProps = {
  /** Panel heading displayed in the header row. */
  title?: string;
  /** When true, renders animated skeleton rows instead of the default slot. */
  loading?: boolean;
  /**
   * Number of skeleton rows to show during loading.
   * @default 4
   */
  loadingRows?: number;
};
