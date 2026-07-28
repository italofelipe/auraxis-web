import { useAnalytics } from "~/composables/useAnalytics/useAnalytics";

/** Origem do clique nos CTAs públicos da landing (#1208). */
export type LandingCtaSource =
  | "hero-register"
  | "header-register"
  | "pricing-subscribe"
  | "pricing-register"
  | "final-cta";

/**
 * Extracts the `plano` query param from a CTA destination.
 *
 * @param destination Relative path or absolute URL the CTA points to.
 * @returns The plan slug, or null when the destination carries none.
 */
export const planSlugFromDestination = (destination: string): string | null => {
  try {
    return new URL(destination, "https://auraxis.com.br").searchParams.get("plano");
  } catch {
    return null;
  }
};

/**
 * Click tracking for the landing CTAs (#1208).
 *
 * Every CTA emits `landing_cta_clicked`; the subscribe CTA additionally
 * reuses `upgrade_clicked` from the #524 funnel contract (with
 * `source: "landing-pricing"`) so saved PostHog funnels cross surfaces.
 * Resolved in setup scope on purpose — `useAnalytics()` needs the Nuxt
 * context and must never be called inside a click handler (#1198).
 *
 * @returns `trackCta` bound to the consent-gated analytics client.
 */
export const useLandingCtaTracking = (): {
  trackCta: (source: LandingCtaSource, destination: string) => void;
} => {
  const analytics = useAnalytics();

  /**
   * Captures the CTA click, adding the funnel upgrade event on the
   * subscribe CTA.
   *
   * @param source Which landing CTA was clicked.
   * @param destination URL the CTA navigates to.
   */
  const trackCta = (source: LandingCtaSource, destination: string): void => {
    analytics.capture("landing_cta_clicked", { source, destination });

    if (source === "pricing-subscribe") {
      analytics.capture("upgrade_clicked", {
        source: "landing-pricing",
        destination,
        plan_slug: planSlugFromDestination(destination),
      });
    }
  };

  return { trackCta };
};
