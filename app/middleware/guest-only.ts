import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware(() => {
  const sessionStore = useSessionStore();

  if (sessionStore.isAuthenticated) {
    return navigateTo("/dashboard");
  }

  return undefined;
});
