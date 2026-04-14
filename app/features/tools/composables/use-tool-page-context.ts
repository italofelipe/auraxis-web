import { computed, type ComputedRef } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "#app";

import { useApiError } from "~/composables/useApiError";
import { useSessionStore } from "~/stores/session";
import { useEntitlementQuery } from "~/features/paywall/queries/use-entitlement-query";

export interface ToolPageContext {
  /** Translate helper from useI18n. */
  t: ReturnType<typeof useI18n>["t"];
  /** Number-format helper from useI18n. */
  n: ReturnType<typeof useI18n>["n"];
  /** Naive-UI message notification API. */
  toast: ReturnType<typeof useMessage>;
  /** Extracts a human-readable message from an API error. */
  getErrorMessage: ReturnType<typeof useApiError>["getErrorMessage"];
  /** Vue-Router instance. */
  router: ReturnType<typeof useRouter>;
  /** Pinia session store instance. */
  sessionStore: ReturnType<typeof useSessionStore>;
  /** True when the user is authenticated. */
  isAuthenticated: ComputedRef<boolean>;
  /** True when the user has the "advanced_simulations" entitlement. */
  hasPremiumAccess: ComputedRef<boolean>;
  /** Formats a number as BRL currency string. */
  formatBrl: (value: number) => string;
}

/**
 * Shared setup context for tool calculator pages.
 *
 * Centralises the auth, access, i18n and formatting boilerplate
 * that every tool page needs, so each page avoids re-declaring the
 * same ~15 lines of identical setup code.
 *
 * @returns Common composables and computed values used by tool pages.
 */
export function useToolPageContext(): ToolPageContext {
  const { t, n } = useI18n();
  const toast = useMessage();
  const { getErrorMessage } = useApiError();
  const router = useRouter();
  const sessionStore = useSessionStore();

  const isAuthenticated = computed<boolean>(() => sessionStore.isAuthenticated);

  const premiumAccessQuery = useEntitlementQuery("advanced_simulations");

  const hasPremiumAccess = computed<boolean>(
    () => premiumAccessQuery.data.value === true,
  );

  /**
   * Formats a numeric value as Brazilian Real currency string.
   *
   * @param value - Number to format.
   * @returns Formatted BRL string.
   */
  function formatBrl(value: number): string {
    return n(value, "currency");
  }

  return {
    t,
    n,
    toast,
    getErrorMessage,
    router,
    sessionStore,
    isAuthenticated,
    hasPremiumAccess,
    formatBrl,
  };
}
