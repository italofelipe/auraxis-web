// O SDK entra por `~/shared/analytics/posthog-loader`, que faz o `import()`
// dinâmico do build `no-external` — o único entrypoint válido (#1209) e agora
// o único lugar do código que o nomeia. Import estático aqui colocava a
// biblioteca no chunk de entrada de todo mundo, inclusive de quem recusa
// cookies (#1246).
import {
  isPostHogSdkRequested,
  loadPostHogSdk,
} from "~/shared/analytics/posthog-loader";
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
  | "signup_consent_record_failed"
  // ── Funil da landing/apex (#1208) ─────────────────────────────────────
  // Feeds the apex acquisition funnel (pageview → CTA → checkout →
  // provider → upgrade_completed). The paid steps reuse upgrade_clicked /
  // upgrade_completed from the #524 contract with a `source` property.
  | "landing_cta_clicked"
  | "checkout_form_submitted"
  | "checkout_provider_redirected"
  | "checkout_account_exists"
  | "checkout_failed"
  | "checkout_abandoned";

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
export async function initPostHog(
  apiKey: string,
  apiHost: string,
): Promise<AnalyticsClient> {
  const posthog = await loadPostHogSdk();

  posthog.init(apiKey, {
    api_host: apiHost,
    // "history_change": the SDK captures the initial load AND history-API
    // navigations. The previous manual page:finish hook never fired on
    // full-page loads, so the SSG landing (plain <a> navigations) emitted
    // ZERO $pageview — and the pageview of the page where consent is granted
    // was lost too, because init happens after page:finish (#1208).
    capture_pageview: "history_change",
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
  let clientPromise: Promise<AnalyticsClient> | null = null;

  /**
   * Lazily initializes PostHog only when analytics consent is currently allowed.
   *
   * Devolve a MESMA promise em toda chamada, então as continuações rodam na
   * ordem em que foram encadeadas: um `capture` disparado no instante do aceite
   * chega antes do seguinte, e nenhum evento se perde na janela entre o
   * consentimento e o módulo carregar (#1208).
   *
   * @returns Promise do cliente inicializado, ou null quando falta consentimento.
   */
  const ensureInitialized = (): Promise<AnalyticsClient> | null => {
    if (!gateway.canUseAnalytics()) {
      return null;
    }

    clientPromise ??= initPostHog(apiKey, apiHost).then((initializedClient) => {
      // Surveys extension, bundled (#1209): with the no-external build the
      // CDN fallback does not exist, so the extension ships as a local lazy
      // chunk from our own origin — loaded only for consented sessions, and
      // long before the popover delay of the abandonment survey on
      // /checkout/cancelado. Optional by design: a failed load must never
      // take analytics down with it.
      void import("posthog-js/dist/surveys").catch(() => { /* optional */ });
      return initializedClient;
    });

    void loadPostHogSdk().then((posthog) => {
      posthog.opt_in_capturing?.();
    });

    return clientPromise;
  };

  const unsubscribe = gateway.onChange((allowed) => {
    if (allowed) {
      ensureInitialized();
      return;
    }

    // Sem `isPostHogSdkRequested` esta linha baixaria o SDK só para desligá-lo
    // — exatamente para quem recusou os cookies.
    if (isPostHogSdkRequested()) {
      void loadPostHogSdk().then((posthog) => {
        posthog.opt_out_capturing?.();
        posthog.reset();
      });
    }
  });

  ensureInitialized();

  return {
    capture: (event: AuraxisEvent, properties?: Record<string, unknown>): void => {
      void ensureInitialized()?.then((analytics) => {
        analytics.capture(event, properties);
      });
    },
    identify: (userId: string): void => {
      void ensureInitialized()?.then((analytics) => {
        analytics.identify(userId);
      });
    },
    reset: (): void => {
      if (!gateway.canUseAnalytics()) {
        return;
      }
      void clientPromise?.then((analytics) => {
        analytics.reset();
      });
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
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const apiKey = String(config.public.posthogApiKey ?? "").trim();

  if (!apiKey) {
    return { provide: { analytics: NOOP_CLIENT } };
  }

  const apiHost = String(config.public.posthogApiHost ?? "https://eu.i.posthog.com").trim();
  const client = createConsentAwareAnalyticsClient(apiKey, apiHost);

  return { provide: { analytics: client } };
});
/* v8 ignore stop */
