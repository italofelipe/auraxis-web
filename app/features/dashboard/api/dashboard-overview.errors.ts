/**
 * Raised when the dashboard overview filters are invalid for the requested period.
 */
export class DashboardOverviewFiltersError extends Error {
  /**
   * @param message Human-readable validation message.
   */
  constructor(message: string) {
    super(message);
    this.name = "DashboardOverviewFiltersError";
  }
}
