import axiosRetry, { type IAxiosRetryConfig } from "axios-retry";

/**
 * HTTP status codes that qualify for automatic retry.
 *
 * - 502: Bad Gateway
 * - 503: Service Unavailable
 * - 504: Gateway Timeout
 *
 * 4xx errors are intentionally excluded — they indicate client-side faults
 * (auth, validation) that retrying cannot fix. 429 in particular is excluded:
 * the AI insights daily limit returns 429 `AI_DAILY_LIMIT_EXCEEDED`, a hard
 * per-day cap that never clears on immediate retry — retrying it only triples
 * the request count (1 + 2 retries) and risks racing the server-side quota
 * counter. Genuine transient back-pressure is covered by the 5xx codes.
 */
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

/**
 * Returns true when the response status code is eligible for retry.
 *
 * @param status HTTP status code from the failed response.
 * @returns Whether the request should be retried.
 */
export const isRetryableStatus = (status: number): boolean =>
  RETRYABLE_STATUSES.has(status);

/**
 * Canonical retry configuration for all Auraxis HTTP clients.
 *
 * - 2 retries with exponential back-off (axiosRetry.exponentialDelay).
 * - Only retries on 429, 502, 503, 504 — never on other 4xx errors.
 * - Network errors (ECONNRESET, ETIMEDOUT, etc.) are also retried via
 *   `axiosRetry.isNetworkError`.
 */
export const DEFAULT_RETRY_CONFIG: IAxiosRetryConfig = {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network-level errors (no response received)
    if (axiosRetry.isNetworkError(error)) {
      return true;
    }

    const status = error.response?.status;

    if (status === undefined) {
      return false;
    }

    return isRetryableStatus(status);
  },
};

export { axiosRetry };
