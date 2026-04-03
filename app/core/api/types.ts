/**
 * Core API type contracts for the Auraxis v2 envelope standard.
 *
 * All endpoints that receive `X-API-Contract: v2` return responses wrapped
 * in {@link ApiResponse}. List endpoints additionally include {@link PaginationMeta}.
 */

/**
 * Standard v2 envelope returned by every Auraxis API endpoint.
 *
 * @template T Shape of the `data` payload specific to the endpoint.
 */
export interface ApiResponse<T> {
  /** Whether the operation succeeded on the server side. */
  readonly success: boolean;
  /** Human-readable status description from the server. */
  readonly message: string;
  /** Typed payload for this endpoint. */
  readonly data: T;
}

/**
 * Pagination cursor metadata included in list responses.
 */
export interface PaginationMeta {
  /** Current page number (1-based). */
  readonly page: number;
  /** Maximum items per page. */
  readonly limit: number;
  /** Total number of items across all pages. */
  readonly total: number;
  /** Total number of pages. */
  readonly totalPages: number;
}

/**
 * Standard v2 paginated envelope for list endpoints.
 *
 * Extends {@link ApiResponse} where `data` is always an array, and adds
 * {@link PaginationMeta} under `meta`.
 *
 * @template T Shape of each item in the list.
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination cursor for this response. */
  readonly meta: PaginationMeta;
}

/**
 * Callbacks injected into the global HTTP response interceptor.
 *
 * All handlers are optional — omitting one disables that automatic behavior.
 */
export interface ResponseInterceptorOptions {
  /**
   * Called when a response returns HTTP 403.
   * Typically used to show a "no permission" toast.
   *
   * @param message Localised message to display.
   */
  readonly onForbidden?: (message: string) => void;

  /**
   * Called when a response returns HTTP 5xx.
   * Typically used to show a generic "server error" toast.
   *
   * @param message Localised message to display.
   */
  readonly onServerError?: (message: string) => void;

  /**
   * Called when a response returns HTTP 401 and a refresh strategy is available.
   *
   * The implementation should exchange the current refresh token for a new
   * access token and persist both to the session store.
   *
   * Returning the new access token causes the interceptor to automatically
   * retry the original failed request with the refreshed credentials.
   * Returning `null` signals that the refresh failed (e.g. the refresh token
   * is expired or missing) — the original 401 error is then re-thrown.
   *
   * @returns New access token, or `null` if the refresh was unsuccessful.
   */
  readonly onUnauthorized?: () => Promise<string | null>;
}
