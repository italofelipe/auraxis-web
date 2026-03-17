import { useSessionStore } from "~/stores/session";

/**
 * Restores the authenticated session from the persisted cookie before any
 * route middleware runs.  `enforce: 'pre'` guarantees this plugin executes
 * ahead of other plugins so that `sessionStore.isAuthenticated` is already
 * populated when `authenticated` / `guest-only` middlewares evaluate it
 * (WEB-AUTH-01).
 */
export default defineNuxtPlugin({
  name: "session-restore",
  enforce: "pre",
  setup() {
    const sessionStore = useSessionStore();
    sessionStore.restore();
  },
});
