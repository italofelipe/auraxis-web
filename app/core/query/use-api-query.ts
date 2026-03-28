/**
 * Generic query factory for the Auraxis API.
 *
 * Wraps `useQuery` from TanStack Vue Query with typed `ApiError` propagation,
 * so individual feature composables do not need to repeat the error-type
 * annotation on every query definition.
 *
 * Default cache behaviour is inherited from the global QueryClient configured
 * in `app/plugins/vue-query.ts` (staleTime 30 s, gcTime 300 s, retry 1).
 * Options passed at call-site always take precedence.
 *
 * Must be called from within a Vue component `setup` context.
 */

import {
  type QueryKey,
  type UseQueryOptions,
  type UseQueryReturnType,
  useQuery,
} from "@tanstack/vue-query";

import type { ApiError } from "~/core/errors";

/**
 * Creates a type-safe TanStack Vue Query instance backed by an async fetcher.
 *
 * The error channel is typed as {@link ApiError} — errors from the Axios
 * response interceptor (normalised by `toApiError`) flow through untouched.
 *
 * @template TData Shape of the resolved data returned by the fetcher.
 * @param queryKey Stable cache key for this query.
 * @param fetcher Async function that resolves the data.
 * @param options Optional TanStack query options (queryKey and queryFn are
 *   excluded — supply them via the first two parameters).
 * @returns Reactive Vue Query state: `data`, `isLoading`, `isError`, `error`, etc.
 *
 * @example
 * ```ts
 * export const useGoalsQuery = () =>
 *   createApiQuery(["goals", "list"], () => goalsApi.getGoals());
 * ```
 */
export const createApiQuery = <TData>(
  queryKey: QueryKey,
  fetcher: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError>, "queryKey" | "queryFn">,
): UseQueryReturnType<TData, ApiError> => {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn: fetcher,
    ...options,
  });
};
