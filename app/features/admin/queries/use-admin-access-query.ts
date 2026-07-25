import { useQuery, type UseQueryReturnType } from "@tanstack/vue-query";

import { useAdminUsersClient } from "~/features/admin/users/services/admin-users.client";
import { useSessionStore } from "~/stores/session";

export const ADMIN_ACCESS_STALE_TIME_MS = 5 * 60 * 1000;

interface AdminAccessQueryOptions {
  queryKey: ["admin", "session", "access"];
  queryFn: () => Promise<boolean>;
  enabled: () => boolean;
  retry: false;
  staleTime: number;
}

/**
 * Query options for the backend-verified admin access check.
 *
 * The sidebar "Admin" entry cannot rely on JWT claims: the v1 backend never
 * emits admin roles — authorization lives in the control-plane allowlist,
 * surfaced by GET /v2/admin/session (#1163). A non-admin gets a 401/403,
 * which resolves to `false` through Vue Query's error state (retry disabled
 * so regular users cost a single lightweight probe per stale window).
 *
 * @returns Vue Query options resolving to whether the user is an admin.
 */
export function adminAccessQueryOptions(): AdminAccessQueryOptions {
  const sessionStore = useSessionStore();
  const client = useAdminUsersClient();
  return {
    queryKey: ["admin", "session", "access"],
    queryFn: async (): Promise<boolean> => {
      const session = await client.getSession();
      return session.isAdmin === true;
    },
    enabled: (): boolean => sessionStore.isAuthenticated,
    retry: false,
    staleTime: ADMIN_ACCESS_STALE_TIME_MS,
  };
}

/**
 * Reactive backend-verified admin flag for navigation affordances.
 *
 * @returns Vue Query state whose `data` is true only for allowlisted admins.
 */
export function useAdminAccessQuery(): UseQueryReturnType<boolean, Error> {
  return useQuery({ ...adminAccessQueryOptions(), staleTime: ADMIN_ACCESS_STALE_TIME_MS });
}
