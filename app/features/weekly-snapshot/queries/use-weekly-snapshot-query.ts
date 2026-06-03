import { type UseQueryReturnType, useQuery } from "@tanstack/vue-query";
import { type MaybeRefOrGetter, toValue } from "vue";

import { STALE_TIME } from "~/core/query/stale-time";
import {
  useWeeklySnapshotApiClient,
  type WeeklySnapshotApiClient,
} from "~/features/weekly-snapshot/services/weekly-snapshot.client";
import type { WeeklySnapshot } from "~/features/weekly-snapshot/model/weekly-snapshot";

interface UseWeeklySnapshotQueryOptions {
  /** Whether the query may run. Gate on premium entitlement to avoid 403 churn. */
  enabled?: MaybeRefOrGetter<boolean>;
}

/**
 * Vue Query hook for the premium AI weekly-summary narrative.
 *
 * Errors propagate as query error state (no silent catch). Callers should pass
 * `enabled` bound to the premium entitlement so free users never trigger the
 * backend 403.
 *
 * @param providedClient Optional injected client for unit tests.
 * @param options Query controls (notably `enabled`).
 * @returns Vue Query state with the weekly snapshot domain model.
 */
export const useWeeklySnapshotQuery = (
  providedClient?: WeeklySnapshotApiClient,
  options: UseWeeklySnapshotQueryOptions = {},
): UseQueryReturnType<WeeklySnapshot, Error> => {
  const client = providedClient ?? useWeeklySnapshotApiClient();

  return useQuery({
    queryKey: ["weekly-snapshot"] as const,
    queryFn: (): Promise<WeeklySnapshot> => client.getWeeklySnapshot(),
    enabled: (): boolean => toValue(options.enabled ?? true),
    staleTime: STALE_TIME.STATIC,
    // The endpoint is read-only and cheap, but a transient 429/5xx must not
    // fan out into a retry storm (the dashboard mounts this once). One attempt.
    retry: false,
  });
};
