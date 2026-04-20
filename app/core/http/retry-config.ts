import axiosRetry, { type IAxiosRetryConfig } from "axios-retry";

/**
 * HTTP status codes that qualify for automatic retry.
 *
 * - 429: Too Many Requests (rate-limit)
 * - 502: Bad Gateway
 * - 503: Service Unavailable
 * - 504: Gateway Timeout
 *
 * 4xx errors other than 429 are intentionally excluded — they indicate
 * client-side faults (auth, validation) that retrying cannot fix.
 */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

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
