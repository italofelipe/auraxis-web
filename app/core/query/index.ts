/**
 * Public API for `app/core/query/`.
 *
 * Re-exports:
 * - {@link createApiQuery} — typed `useQuery` wrapper with `ApiError` propagation
 * - {@link createApiMutation} — typed `useMutation` wrapper with success toast,
 *   cache invalidation, and custom callbacks
 * - {@link ApiMutationOptions} — options interface for `createApiMutation`
 * - {@link STALE_TIME} — canonical `staleTime` presets (PERF-7)
 * - {@link StaleTime} — union of allowed `staleTime` values
 */
export { createApiQuery } from "./use-api-query";
export { createApiMutation } from "./use-api-mutation";
export type { ApiMutationOptions } from "./use-api-mutation";
export { STALE_TIME } from "./stale-time";
export type { StaleTime } from "./stale-time";
