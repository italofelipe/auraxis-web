import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "#app";
import { useSessionStore } from "~/stores/session";

/**
 * Redirects authenticated users away from the operational app home.
 *
 * The same `/` route also serves the marketing landing when the build surface
 * is `marketing`, so this middleware only acts on the app surface.
 */
export default defineNuxtRouteMiddleware(() => {
  const config = useRuntimeConfig();
  const surface = (config.public as Record<string, unknown>).siteSurface;

  if (surface === "marketing") {
    return undefined;
  }

  const sessionStore = useSessionStore();
  if (!sessionStore.isAuthenticated) {
    sessionStore.restore();
  }

  if (sessionStore.isAuthenticated) {
    return navigateTo("/dashboard");
  }

  return undefined;
});
