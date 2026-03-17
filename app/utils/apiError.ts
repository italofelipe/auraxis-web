/**
 * Typed error thrown by the centralized HTTP client for all non-2xx responses.
 */
export class ApiError extends Error {
  /**
   * Creates an ApiError with HTTP status, message, and optional error code.
   * @param status HTTP status code of the failed response.
   * @param message Human-readable error description.
   * @param code Optional machine-readable error code from the API.
   */
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
