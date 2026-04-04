/** Return type of the useApiError composable. */
export interface UseApiErrorReturn {
  /**
   * Maps an unknown error to a user-friendly localised message.
   *
   * Handles:
   * - `ApiError` instances with a `code` field (mapped to i18n key `errors.<code>`).
   * - `ApiError` instances without a `code` field (mapped by HTTP status).
   * - `Error` instances with `BRAPI_API_KEY_NOT_CONFIGURED` message.
   * - Network errors (no HTTP response).
   * - Axios errors.
   * - Any other unknown value (fallback to `errors.UNKNOWN`).
   *
   * @param error - Unknown thrown value.
   * @returns Localised user-facing error message string.
   */
  getErrorMessage: (error: unknown) => string;
}
