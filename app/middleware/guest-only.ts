import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware(() => {
  const sessionStore = useSessionStore();

  // Lazy restore: only read from the cookie when the in-memory state is empty.
  // Same reasoning as in authenticated.ts — avoid overwriting a valid in-memory
  // session that was populated by signIn() in the same client session.
  if (!sessionStore.isAuthenticated) {
    sessionStore.restore();
  }

  if (sessionStore.isAuthenticated) {
    return navigateTo("/dashboard");
  }

  return undefined;
});
