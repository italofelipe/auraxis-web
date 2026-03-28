/** Props for the UiPageLoader component. */
export interface UiPageLoaderProps {
  /**
   * Number of skeleton content rows to render.
   * @default 3
   */
  rows?: number;
  /**
   * Whether to render a taller leading skeleton row that approximates
   * a page title or section heading.
   * @default false
   */
  withTitle?: boolean;
}
