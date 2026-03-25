import { useSessionStore } from "~/stores/session";
import { useToolContextStore } from "~/stores/toolContext";

/**
 * Restores the authenticated session from the persisted cookie before any
 * route middleware runs.
 *
 * NOTE: `enforce: "pre"` was intentionally removed. With Nuxt's plugin system,
 * `enforce: "pre"` runs BEFORE the Pinia plugin installs the store registry,
 * so calling `useSessionStore()` at that point crashes with
 * "Cannot read properties of undefined (reading '_s')" (activePinia is null).
 *
 * Regular plugins (no enforce) still run before route middlewares — middlewares
 * execute on navigation, after all plugins have initialized — so the auth guard
 * contract is preserved.
 *
 * Also restores any pending tool context from sessionStorage so that a user
 * who completed login after a /tools redirect lands back with their context
 * pre-loaded.
 */
export default defineNuxtPlugin({
  name: "session-restore",
  setup() {
    // Only restore session and tool context on the client — during SSR/prerender
    // there is no cookie or sessionStorage to read from, and accessing Pinia
    // stores before nuxtApp.payload is fully initialised causes a
    // "Cannot read properties of undefined (reading 'state')" crash.
    if (!import.meta.client) {
      return;
    }

    const sessionStore = useSessionStore();
    sessionStore.restore();

    const toolContextStore = useToolContextStore();
    toolContextStore.restore();
  },
});
