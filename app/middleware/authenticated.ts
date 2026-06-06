import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "#app";
import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export default defineNuxtRouteMiddleware(async () => {
  // Session restore depends on the httpOnly `auraxis_refresh` cookie, which can
  // only be exchanged for an access token from the client (the refresh request
  // and the readable CSRF cookie are not available during SSR). On the server
  // the in-memory Pinia session is always empty on a hard reload, so making the
  // auth decision here would redirect every reload to /login BEFORE the client
  // gets a chance to restore the session. Defer the decision entirely to the
  // client.
  //
  // Root-cause guard: this keeps a private route that ends up rendered
  // server-side (e.g. one missing `ssr: false` in routeRules) from logging the
  // user out on F5.
  if (import.meta.server) {
    return undefined;
  }

  const sessionStore = useSessionStore();

  // Only restore from the persisted cookie when the in-memory session is empty
  // (e.g. after a hard reload, where Pinia starts fresh).
  // Calling restore() unconditionally overwrites a valid in-memory session
  // (set by signIn() right after a successful login) with the cookie value —
  // which may read as null because useCookie loses its Nuxt app context when
  // invoked from a Pinia action's async onSuccess callback.
  if (!sessionStore.isAuthenticated) {
    sessionStore.restore();
  }

  if (!sessionStore.isAuthenticated) {
    const runtimeConfig = useRuntimeConfig();
    const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);
    await sessionStore.runSessionRestore(apiBase, refreshAccessToken);
  }

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  return undefined;
});
