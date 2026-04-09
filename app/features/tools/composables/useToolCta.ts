import { computed } from "vue";
import { useSessionStore } from "~/stores/session";
import type { UseToolCtaReturn } from "./useToolCta.types";

/**
 * Determines whether the guest CTA should be visible for the current user.
 *
 * The CTA is intended for unauthenticated visitors — it invites them to create
 * a free Auraxis account after interacting with a tool. Authenticated users of
 * any plan should never see it.
 *
 * @returns Object with `showCta` — true when the user has no active session.
 */
export function useToolCta(): UseToolCtaReturn {
  const sessionStore = useSessionStore();

  return {
    showCta: computed<boolean>(() => !sessionStore.isAuthenticated),
  };
}
