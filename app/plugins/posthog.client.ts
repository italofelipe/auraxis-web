import posthog from "posthog-js";
import {
  canUseAnalyticsCookies,
  subscribeToCookieConsentChanges,
} from "~/shared/privacy/cookie-consent";

/**
 * Named analytics events emitted throughout the application.
 * Extending this union keeps the event catalog type-safe and discoverable.
 *
 * The conversion funnel events (onboarding → first transaction → paywall →
 * upgrade) feed the PostHog dashboard tracked in issue #524. Their names
 * are stable contracts — renaming requires migrating saved PostHog funnels
 * + insights at the same time.
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
  | "error_boundary_triggered"
  // ── Conversion funnel (#524) ──────────────────────────────────────────
  | "onboarding_step_completed"
  | "first_transaction_created"
  | "paywall_shown"
  | "upgrade_clicked"
  | "upgrade_completed"
  // ── Account trust (#922) ──────────────────────────────────────────────
  | "email_confirmation_completed"
  // ── Freemium simulador (#566) ─────────────────────────────────────────
  | "free_simulation_used"
  // ── Aceite de termos no signup (#1118) ────────────────────────────────
  | "signup_consent_record_failed";

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

export interface ConsentAwareAnalyticsClient extends AnalyticsClient {
  /** Captures the synthetic page-view event emitted after Nuxt navigation. */
  capturePageView(): void;

  /** Tears down cookie-consent listeners. Used by tests and hot reload. */
  dispose(): void;
}

export interface AnalyticsConsentGateway {
  /** Returns whether analytics cookies are currently allowed. */
  canUseAnalytics(): boolean;

  /**
   * Subscribes to analytics consent changes.
   * @param listener Callback receiving the latest allowed/blocked state.
   * @returns Unsubscribe callback.
   */
  onChange(listener: (allowed: boolean) => void): () => void;
}

/** No-op client used when PostHog is not configured (dev / missing key). */
const NOOP_CLIENT: AnalyticsClient = {
  capture: (): void => { /* noop */ },
  identify: (): void => { /* noop */ },
  reset: (): void => { /* noop */ },
};

/**
 * Builds the default cookie-consent gateway used by the Nuxt plugin.
 *
 * @returns Analytics consent gateway backed by the first-party consent cookie.
 */
const createDefaultConsentGateway = (): AnalyticsConsentGateway => ({
  canUseAnalytics: canUseAnalyticsCookies,
  onChange: (listener: (allowed: boolean) => void): (() => void) =>
    subscribeToCookieConsentChanges((preferences) => {
      listener(canUseAnalyticsCookies(preferences));
    }),
});

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
 * Creates a PostHog client that stays inert until analytics consent is granted.
 *
 * @param apiKey PostHog project API key.
 * @param apiHost PostHog ingest host URL.
 * @param gateway Consent gateway used to read and observe analytics consent.
 * @returns Analytics client guarded by cookie consent.
 */
export function createConsentAwareAnalyticsClient(
  apiKey: string,
  apiHost: string,
  gateway: AnalyticsConsentGateway = createDefaultConsentGateway(),
): ConsentAwareAnalyticsClient {
  let client: AnalyticsClient | null = null;
  let initialized = false;

  /**
   * Lazily initializes PostHog only when analytics consent is currently allowed.
   *
   * @returns Initialized analytics client or null when consent is missing.
   */
  const ensureInitialized = (): AnalyticsClient | null => {
    if (!gateway.canUseAnalytics()) {
      return null;
    }

    if (!initialized) {
      client = initPostHog(apiKey, apiHost);
      initialized = true;
    }

    posthog.opt_in_capturing?.();
    return client;
  };

  const unsubscribe = gateway.onChange((allowed) => {
    if (allowed) {
      ensureInitialized();
      return;
    }

    if (initialized) {
      posthog.opt_out_capturing?.();
      posthog.reset();
    }
  });

  ensureInitialized();

  return {
    capture: (event: AuraxisEvent, properties?: Record<string, unknown>): void => {
      ensureInitialized()?.capture(event, properties);
    },
    identify: (userId: string): void => {
      ensureInitialized()?.identify(userId);
    },
    reset: (): void => {
      if (gateway.canUseAnalytics()) {
        client?.reset();
      }
    },
    capturePageView: (): void => {
      if (ensureInitialized()) {
        posthog.capture("$pageview");
      }
    },
    dispose: unsubscribe,
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
  const client = createConsentAwareAnalyticsClient(apiKey, apiHost);

  nuxtApp.hook("page:finish", (): void => {
    client.capturePageView();
  });

  return { provide: { analytics: client } };
});
/* v8 ignore stop */
