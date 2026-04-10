import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";

const DEFAULT_API_BASE = "http://localhost:5000";

/**
 * SEC-GAP-01 — restores the authenticated session by exchanging the
 * httpOnly `auraxis_refresh` cookie for a new access token before any
 * route middleware runs.
 *
 * The access token is never written to a JavaScript-readable cookie or
 * localStorage. It lives only in Pinia state (in memory). On page reload
 * this plugin re-establishes the session silently if the refresh cookie
 * is still valid — otherwise the user is redirected to login by the
 * `authenticated` middleware.
 *
 * NOTE: `enforce: "pre"` was intentionally removed. With Nuxt's plugin
 * system, `enforce: "pre"` runs BEFORE the Pinia plugin installs the
 * store registry, so calling `useSessionStore()` crashes at that point.
 * Regular plugins (no enforce) still execute before route middlewares.
 */
export default defineNuxtPlugin({
  name: "session-restore",
  async setup() {
    // Only restore session and tool context on the client — during SSR /
    // prerender there is no cookie to read from, and accessing Pinia stores
    // before nuxtApp.payload is fully initialised causes a crash.
    if (!import.meta.client) {
      return;
    }

    const sessionStore = useSessionStore();

    // Always clear the legacy auraxis_session non-httpOnly cookie so old
    // token payloads are no longer accessible from JavaScript.
    sessionStore.restore();

    // Bootstrap access token from the httpOnly refresh cookie when Pinia
    // state is empty (e.g. page reload or new tab). If the refresh fails
    // the user stays unauthenticated and the auth middleware redirects them.
    if (!sessionStore.isAuthenticated) {
      const runtimeConfig = useRuntimeConfig();
      const apiBase = String(
        runtimeConfig.public.apiBase ?? DEFAULT_API_BASE,
      );
      await refreshAccessToken(apiBase, sessionStore);
    }

    const toolContextStore = useToolContextStore();
    toolContextStore.restore();
  },
});
