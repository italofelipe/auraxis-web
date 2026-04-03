import posthog from "posthog-js";

/**
 * Named analytics events emitted throughout the application.
 * Extending this union keeps the event catalog type-safe and discoverable.
 */
export type AuraxisEvent =
  | "user_signed_in"
  | "user_registered"
  | "user_signed_out"
  | "dashboard_viewed"
  | "portfolio_viewed"
  | "goals_viewed"
  | "simulations_viewed"
  | "subscription_viewed"
  | "error_boundary_triggered";

/** Typed analytics client exposed as `$analytics` in the Nuxt app. */
export interface AnalyticsClient {
  /**
   * Captures a named application event with optional properties.
   * @param event Canonical event name from the AuraxisEvent catalog.
   * @param properties Arbitrary key-value payload attached to the event.
   */
  capture(event: AuraxisEvent, properties?: Record<string, unknown>): void;

  /**
   * Associates subsequent events with the given user identifier.
   * Call after a successful sign-in.
   * @param userId Opaque user identifier (no PII).
   */
  identify(userId: string): void;

  /** Resets the session — call on sign-out to disassociate the user. */
  reset(): void;
}

/** No-op client used when PostHog is not configured (dev / missing key). */
const NOOP_CLIENT: AnalyticsClient = {
  capture: (): void => { /* noop */ },
  identify: (): void => { /* noop */ },
  reset: (): void => { /* noop */ },
};

/**
 * Initializes the PostHog SDK and returns a typed analytics client.
 *
 * @param apiKey PostHog project API key.
 * @param apiHost PostHog ingest host URL.
 * @returns Typed AnalyticsClient backed by PostHog.
 */
export function initPostHog(apiKey: string, apiHost: string): AnalyticsClient {
  posthog.init(apiKey, {
    api_host: apiHost,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",
  });

  return {
    capture: (event: AuraxisEvent, properties?: Record<string, unknown>): void => {
      posthog.capture(event, properties);
    },
    identify: (userId: string): void => {
      posthog.identify(userId);
    },
    reset: (): void => {
      posthog.reset();
    },
  };
}

/**
 * Nuxt client plugin that initializes PostHog analytics and wires up
 * automatic page-view tracking via the Vue Router.
 *
 * Opt-in: the plugin is inert when `NUXT_PUBLIC_POSTHOG_API_KEY` is absent.
 * Provides `$analytics` (AnalyticsClient) for manual event capture.
 */
/* v8 ignore start */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const apiKey = String(config.public.posthogApiKey ?? "").trim();

  if (!apiKey) {
    return { provide: { analytics: NOOP_CLIENT } };
  }

  const apiHost = String(config.public.posthogApiHost ?? "https://eu.i.posthog.com").trim();
  const client = initPostHog(apiKey, apiHost);

  nuxtApp.hook("page:finish", (): void => {
    posthog.capture("$pageview");
  });

  return { provide: { analytics: client } };
});
/* v8 ignore stop */
