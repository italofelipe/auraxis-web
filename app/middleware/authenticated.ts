import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware(() => {
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

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  return undefined;
});
