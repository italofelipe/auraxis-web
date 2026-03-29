/**
 * Raised when the API payload does not satisfy the canonical dashboard contract.
 */
export class DashboardOverviewContractError extends Error {
  /**
   * @param message Human-readable contract validation message.
   */
  constructor(message: string) {
    super(message);
    this.name = "DashboardOverviewContractError";
  }
}
