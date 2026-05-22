/**
 * Request-ID propagation context.
 *
 * Stores the most recent `x-request-id` returned by `auraxis-api` so that
 * subsequent client-side logs can be correlated with the corresponding
 * backend request. Maintained as a module-level singleton — there is only
 * one client per runtime (see app/core/http/CLAUDE.md) so sharing is safe.
 *
 * The api side of this propagation (RequestIDMiddleware echoing the id in
 * every response) is the responsibility of `auraxis-api`. Until that lands,
 * `currentRequestId()` returns undefined and the logger gracefully omits
 * the field.
 */

import type { AxiosResponse } from "axios";

let _currentRequestId: string | undefined;

/**
 * Returns the most recently captured request_id, or undefined.
 *
 * @returns Current request_id or undefined.
 */
export const currentRequestId = (): string | undefined => {
  return _currentRequestId;
};

/**
 * Sets the active request_id. Empty / whitespace-only ids are ignored.
 *
 * @param id Candidate request_id (typically from `x-request-id` header).
 */
export const setRequestId = (id: string | undefined): void => {
  if (typeof id !== "string" || id.trim().length === 0) {
    return;
  }
  _currentRequestId = id;
};

/**
 * Test utility — resets the captured id between tests.
 */
export const resetRequestIdForTests = (): void => {
  _currentRequestId = undefined;
};

/**
 * Axios response interceptor that captures the `x-request-id` header and
 * makes it available via {@link currentRequestId}. Re-exports the response
 * unchanged.
 *
 * Register on the HTTP client to enable propagation:
 *   client.interceptors.response.use(captureRequestIdInterceptor);
 *
 * @param response Axios response.
 * @returns The same response (unchanged).
 */
export const captureRequestIdInterceptor = (
  response: AxiosResponse,
): AxiosResponse => {
  const headers = response.headers;
  if (headers && typeof headers === "object") {
    const id = (headers as Record<string, unknown>)["x-request-id"];
    if (typeof id === "string") {
      setRequestId(id);
    }
  }
  return response;
};
