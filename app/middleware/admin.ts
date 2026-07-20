import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from "#app";
import { refreshAccessToken } from "~/composables/useHttp/useHttp";
import { useAdminUsersClient } from "~/features/admin/users/services/admin-users.client";
import { useSessionStore } from "~/stores/session";

const DEFAULT_API_BASE = "http://localhost:5000";

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return undefined;
  }

  const sessionStore = useSessionStore();
  if (!sessionStore.isAuthenticated) {
    const config = useRuntimeConfig();
    await sessionStore.runSessionRestore(
      String(config.public.apiBase ?? DEFAULT_API_BASE),
      refreshAccessToken,
    );
  }
  if (!sessionStore.isAuthenticated) {
    return navigateTo("/login");
  }
  if (to.path === "/admin/forbidden") {
    return undefined;
  }

  try {
    const adminSession = await useAdminUsersClient().getSession();
    if (!adminSession.isAdmin) {
      return navigateTo("/admin/forbidden", { replace: true });
    }
  } catch {
    return navigateTo("/admin/forbidden", { replace: true });
  }
  return undefined;
});
