import { navigateTo } from "#app";
import { useQueryClient } from "@tanstack/vue-query";
import { useSessionStore } from "~/stores/session";
import { useUserStore } from "~/stores/user";
import { useFiltersStore } from "~/stores/filters";
import { useUiStore } from "~/stores/ui";
import { useToolContextStore } from "~/stores/toolContext";

/**
 * Orchestrates a complete application logout:
 *
 * 1. Clears the TanStack Query cache so no stale data leaks to a subsequent
 *    user who may sign in on the same browser session.
 * 2. Resets every Pinia store that holds user-scoped state.
 * 3. Clears the session cookie via `sessionStore.signOut()`.
 * 4. Navigates to `/login`.
 *
 * Using a dedicated composable (rather than calling `sessionStore.signOut()`
 * directly from components) ensures that the full teardown is always applied
 * consistently, regardless of where logout is triggered.
 *
 * @returns An object containing the `logout` function.
 */
export const useLogout = (): { logout: () => void } => {
  const queryClient = useQueryClient();
  const sessionStore = useSessionStore();
  const userStore = useUserStore();
  const filtersStore = useFiltersStore();
  const uiStore = useUiStore();
  const toolContextStore = useToolContextStore();

  /**
   * Executes the full logout sequence and redirects to `/login`.
   */
  const logout = (): void => {
    // 1. Wipe all cached server state — prevents stale data from being visible
    //    to the next user who logs in on the same browser session.
    queryClient.clear();

    // 2. Reset user-scoped Pinia stores to their initial state.
    userStore.clearProfile();
    filtersStore.reset();
    uiStore.$reset();
    toolContextStore.clear();

    // 3. Clear the session cookie and nullify auth state in the session store.
    //    Done last so the stores above can still read user data if they need to
    //    perform cleanup that depends on identity.
    sessionStore.signOut();

    // 4. Redirect to login page.
    navigateTo("/login");
  };

  return { logout };
};
