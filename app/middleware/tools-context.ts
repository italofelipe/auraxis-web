import { defineNuxtRouteMiddleware } from "#app";

/**
 * Restores tool context after a login redirect.
 *
 * When the user is redirected from /tools to /login (or /register) with
 * `?redirect=/tools&tool=<id>` query params, and then lands back on the app
 * after authentication, this middleware reads those params so the UI can
 * scroll to or pre-select the relevant tool.
 *
 * Usage: add `definePageMeta({ middleware: ['tools-context'] })` to any page
 * that should react to a returning tools context (e.g., /tools itself).
 *
 * The middleware does NOT perform redirects — it only exposes the tool param
 * for the page to consume via `useRoute().query.tool`.
 */
export default defineNuxtRouteMiddleware(() => {
  // Intentionally a no-op: the middleware exists so the route query is
  // forwarded and available to the page composable.  Any tool-specific
  // restoration logic is handled inside the page itself by reading
  // `useRoute().query.tool`.
  return undefined;
});
