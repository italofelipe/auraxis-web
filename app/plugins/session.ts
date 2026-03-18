import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";

/**
 * Restores the authenticated session from the persisted cookie before any
 * route middleware runs.  `enforce: 'pre'` guarantees this plugin executes
 * ahead of other plugins so that `sessionStore.isAuthenticated` is already
 * populated when `authenticated` / `guest-only` middlewares evaluate it
 * (WEB-AUTH-01).
 *
 * Also restores any pending tool context from sessionStorage so that a user
 * who completed login after a /tools redirect lands back with their context
 * pre-loaded (WEB-TOOLS-CTX-01).
 */
export default defineNuxtPlugin({
  name: "session-restore",
  enforce: "pre",
  setup() {
    // Only restore session and tool context on the client — during SSR/prerender
    // there is no cookie or sessionStorage to read from, and accessing Pinia
    // stores before nuxtApp.payload is fully initialised causes a
    // "Cannot read properties of undefined (reading 'state')" crash (#190).
    if (!import.meta.client) {
      return;
    }

    const sessionStore = useSessionStore();
    sessionStore.restore();

    const toolContextStore = useToolContextStore();
    toolContextStore.restore();
  },
});
