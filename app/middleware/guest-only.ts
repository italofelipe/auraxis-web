import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useAuthRedirectContext } from "~/composables/useAuthRedirectContext/useAuthRedirectContext";
import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware(() => {
  const sessionStore = useSessionStore();

  // Lazy restore: only read from the cookie when the in-memory state is empty.
  // Same reasoning as in authenticated.ts — avoid overwriting a valid in-memory
  // session that was populated by signIn() in the same client session.
  if (!sessionStore.isAuthenticated) {
    sessionStore.restore();
  }

  if (sessionStore.isAuthenticated) {
    // An authenticated visitor can land here carrying a saved destination —
    // e.g. the admin middleware bounced them while the session was still
    // restoring (#1171). Honor it instead of stranding them on the dashboard;
    // consumeRedirect() falls back to /dashboard when nothing is pending.
    return navigateTo(useAuthRedirectContext().consumeRedirect());
  }

  return undefined;
});
