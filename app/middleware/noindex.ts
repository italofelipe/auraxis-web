import { defineNuxtRouteMiddleware, useHead } from "#app";

/**
 * Routes that should not be indexed by search engines.
 * Covers both default locale (no prefix, PT) and EN locale (/en/*).
 * i18n strategy is "prefix_except_default" — PT has no URL prefix.
 */
const NOINDEX_ROUTES = [
  "/login",           "/en/login",
  "/register",        "/en/register",
  "/forgot-password", "/en/forgot-password",
];

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
