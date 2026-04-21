import { useNuxtApp } from "#app";

import type {
  AnalyticsClient,
  AuraxisEvent,
} from "~/plugins/posthog.client";

/**
 * Public-facing analytics façade.
 *
 * Resolves the typed {@link AnalyticsClient} provided by the PostHog plugin
 * via `useNuxtApp().$analytics`. When the plugin is not configured (local dev
 * without `NUXT_PUBLIC_POSTHOG_API_KEY`, or SSR where the client plugin does
 * not run) the lookup falls back to a no-op client so call sites never need
 * to null-check.
 *
 * Features should depend on this composable rather than reaching for
 * `useNuxtApp().$analytics` directly — it keeps the event catalog enforced
 * by TypeScript and isolates the SSR/opt-out branching in one place.
 *
 * @returns Analytics client safe to call from any Vue composition context.
 */
export const useAnalytics = (): AnalyticsClient => {
  const nuxt = useNuxtApp() as unknown as { $analytics?: AnalyticsClient };
  const client = nuxt.$analytics;

  if (client) {
    return client;
  }

  return {
    capture: (_event: AuraxisEvent, _properties?: Record<string, unknown>): void => { /* noop */ },
    identify: (_userId: string): void => { /* noop */ },
    reset: (): void => { /* noop */ },
  };
};
