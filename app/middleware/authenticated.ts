import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "#app";
import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export default defineNuxtRouteMiddleware(async () => {
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

  if (import.meta.client && !sessionStore.isAuthenticated) {
    const runtimeConfig = useRuntimeConfig();
    const apiBase = String(runtimeConfig.public.apiBase ?? DEFAULT_API_BASE);
    await sessionStore.runSessionRestore(apiBase, refreshAccessToken);
  }

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  return undefined;
});
