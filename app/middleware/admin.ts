import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { getAdminAccessFromToken } from "~/features/admin/model/admin-access";
import { useSessionStore } from "~/stores/session";

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return undefined;
  }

  const sessionStore = useSessionStore();

  if (!sessionStore.isAuthenticated) {
    sessionStore.restore();
  }

  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }

  if (to.path === "/admin/forbidden") {
    return undefined;
  }

  if (!getAdminAccessFromToken(sessionStore.accessToken).isAdmin) {
    return navigateTo("/admin/forbidden", { replace: true });
  }

  return undefined;
});
