import { defineNuxtRouteMiddleware, useHead } from "#app";

/**
 * Routes that should not be indexed by search engines.
 * Matches the `robots: false` entries in `routeRules` in `nuxt.config.ts`.
 */
const NOINDEX_ROUTES = ["/login", "/register", "/forgot-password"];

/**
 * Global middleware that injects a `noindex,nofollow` robots meta tag for
 * routes classified as public-noindex.  This complements the `robots: false`
 * route rule in `nuxt.config.ts` by ensuring the directive is also present
 * in client-side navigation (not only in the static manifest).
 */
export default defineNuxtRouteMiddleware((to) => {
  if (NOINDEX_ROUTES.includes(to.path)) {
    useHead({
      meta: [{ name: "robots", content: "noindex,nofollow" }],
    });
  }

  return undefined;
});
