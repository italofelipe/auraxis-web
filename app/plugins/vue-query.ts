import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";

import { ApiError } from "~/utils/apiError";

/**
 * Exponential back-off for Vue Query retries (mirrors axios-retry logic).
 *
 * Auth queries must opt out with `{ retry: false }` at the call site because
 * a 401 from `/auth/login` is a legitimate rejection, not a transient failure.
 *
 * @param attemptIndex Zero-based retry attempt index.
 * @returns Delay in milliseconds, capped at 10 000 ms.
 */
const queryRetryDelay = (attemptIndex: number): number =>
  Math.min(1_000 * 2 ** attemptIndex, 10_000);

/** Max query retries on the client before surfacing the error. */
const MAX_QUERY_RETRIES = 2;

/**
 * Retry predicate for Vue Query: never retry a 4xx (client faults like 401/403
 * validation, and the AI `429 AI_DAILY_LIMIT_EXCEEDED` hard cap which never
 * clears on retry). Transient failures (5xx, network errors without an
 * ApiError status) fall back to the bounded retry count.
 *
 * @param failureCount Zero-based count of failures so far.
 * @param error The error thrown by the query function.
 * @returns Whether the query should be retried.
 */
export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  const status = error instanceof ApiError ? error.status : undefined;
  if (status !== undefined && status >= 400 && status < 500) {
    return false;
  }
  return failureCount < MAX_QUERY_RETRIES;
};

/**
 * Instantiates a QueryClient with conservative defaults for server state.
 * @returns QueryClient configured for the application.
 */
const createQueryClient = (): QueryClient => {
  const isServer = import.meta.server;

  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: isServer ? 0 : 300_000,
        retry: isServer ? false : shouldRetryQuery,
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
      },
    },
  });
};

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = createQueryClient();

  nuxtApp.vueApp.use(VueQueryPlugin, {
    queryClient,
  });
});
