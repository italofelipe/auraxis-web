import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware(() => {
  const sessionStore = useSessionStore();
  sessionStore.restore();

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  return undefined;
});
