import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import posthog from "posthog-js";
import * as Sentry from "@sentry/nuxt";

/**
 * Core Web Vitals metric names we track.
 * - CLS: Cumulative Layout Shift (visual stability)
 * - LCP: Largest Contentful Paint (load performance)
 * - INP: Interaction to Next Paint (responsiveness, replaces FID)
 * - FCP: First Contentful Paint (early render signal)
 * - TTFB: Time To First Byte (network/server latency)
 */
export type WebVitalName = "CLS" | "LCP" | "INP" | "FCP" | "TTFB";

/**
 * Normalized metric payload emitted to each sink.
 * Keeps the interface sink-agnostic so tests can assert shape without
 * pulling PostHog/Sentry into the fast path.
 */
export interface WebVitalPayload {
  name: WebVitalName;
  value: number;
  rating: Metric["rating"];
  id: string;
  navigationType: Metric["navigationType"];
  delta: number;
}

const METRIC_NAMES: readonly WebVitalName[] = ["CLS", "LCP", "INP", "FCP", "TTFB"];

/**
 * Type guard that confirms a string matches the tracked metric catalog.
 *
 * @param name Raw metric name from the `web-vitals` callback.
 * @returns Whether the metric is one we emit.
 */
export function isTrackedMetric(name: string): name is WebVitalName {
  return (METRIC_NAMES as readonly string[]).includes(name);
}

/**
 * Maps a web-vitals `Metric` into the stable emission payload.
 *
 * Value is rounded to 2 decimals for CLS (unitless ratio) and whole integers
 * for time-based metrics — mirroring what PostHog/Sentry dashboards expect.
 *
 * @param metric Metric object from a web-vitals reporter.
 * @returns Normalized payload ready to forward to sinks.
 */
export function toPayload(metric: Metric): WebVitalPayload {
  const name = metric.name;
  if (!isTrackedMetric(name)) {
    throw new Error(`Unsupported web-vital metric: ${name}`);
  }
  const isRatio = name === "CLS";
  /**
   * Rounds to 3 decimals for CLS (unitless ratio), integer ms otherwise.
   * @param value Raw numeric value from the metric.
   * @returns Rounded value aligned to downstream sink expectations.
   */
  const round = (value: number): number =>
    isRatio ? Math.round(value * 1000) / 1000 : Math.round(value);
  return {
    name,
    value: round(metric.value),
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    delta: round(metric.delta),
  };
}

/**
 * Reports a Web Vital to PostHog as a `web_vital` event when the SDK is loaded.
 * No-op when PostHog was not initialized (missing key).
 *
 * @param payload Normalized metric payload.
 */
export function reportToPostHog(payload: WebVitalPayload): void {
  if (typeof posthog.capture !== "function") {
    return;
  }
  posthog.capture("web_vital", payload as unknown as Record<string, unknown>);
}

/**
 * Reports a Web Vital to Sentry as a measurement on a lightweight transaction.
 * Uses Sentry's top-level `setMeasurement` API so Performance dashboards can
 * chart it without sampling overhead.
 *
 * @param payload Normalized metric payload.
 */
export function reportToSentry(payload: WebVitalPayload): void {
  const unit = payload.name === "CLS" ? "none" : "millisecond";
  Sentry.setMeasurement(`webvital.${payload.name.toLowerCase()}`, payload.value, unit);
  Sentry.setTag(`webvital.${payload.name.toLowerCase()}.rating`, payload.rating);
}

/**
 * Emits the metric to every configured sink. Exported for unit testing.
 *
 * @param metric Metric object from a web-vitals reporter.
 */
export function emit(metric: Metric): void {
  const payload = toPayload(metric);
  reportToPostHog(payload);
  reportToSentry(payload);
}

/**
 * Nuxt client plugin that registers Core Web Vitals reporters and forwards
 * every sample to PostHog + Sentry. Runs only in the browser to avoid SSR
 * noise. Always reports with `reportAllChanges: false` (one final value per
 * metric) so we do not spam the analytics pipeline on page churn.
 */
/* v8 ignore start */
export default defineNuxtPlugin(() => {
  onCLS(emit);
  onLCP(emit);
  onINP(emit);
  onFCP(emit);
  onTTFB(emit);
});
/* v8 ignore stop */
