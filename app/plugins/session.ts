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
    const sessionStore = useSessionStore();
    sessionStore.restore();

    const toolContextStore = useToolContextStore();
    toolContextStore.restore();
  },
});
