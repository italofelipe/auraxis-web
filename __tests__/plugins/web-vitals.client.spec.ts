import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Metric } from "web-vitals";

const mockCapture = vi.hoisted(() => vi.fn());
const mockSetMeasurement = vi.hoisted(() => vi.fn());
const mockSetTag = vi.hoisted(() => vi.fn());

vi.mock("posthog-js", () => ({
  default: { capture: mockCapture },
}));

vi.mock("@sentry/nuxt", () => ({
  setMeasurement: mockSetMeasurement,
  setTag: mockSetTag,
}));

vi.mock("#app", () => ({
  defineNuxtPlugin: (fn: (nuxtApp: unknown) => unknown): ((nuxtApp: unknown) => unknown) => fn,
}));

/**
 * Builds a Metric fixture with sensible defaults; callers override only what
 * matters for the assertion under test.
 * @param overrides Partial fields applied on top of the fixture defaults.
 * @returns Fully populated Metric object compatible with web-vitals callbacks.
 */
const baseMetric = (overrides: Partial<Metric>): Metric =>
  ({
    name: "LCP",
    value: 1234.7,
    rating: "good",
    id: "v5-1",
    delta: 1234.7,
    navigationType: "navigate",
    entries: [],
    ...overrides,
  }) as Metric;

describe("isTrackedMetric", () => {
  it("accepts every Core Web Vital we track", async () => {
    const { isTrackedMetric } = await import("../../app/plugins/web-vitals.client");
    for (const name of ["CLS", "LCP", "INP", "FCP", "TTFB"]) {
      expect(isTrackedMetric(name)).toBe(true);
    }
  });

  it("rejects unknown metric names", async () => {
    const { isTrackedMetric } = await import("../../app/plugins/web-vitals.client");
    expect(isTrackedMetric("FID")).toBe(false);
    expect(isTrackedMetric("")).toBe(false);
  });
});

describe("toPayload", () => {
  it("rounds time-based metrics to integer milliseconds", async () => {
    const { toPayload } = await import("../../app/plugins/web-vitals.client");
    const payload = toPayload(baseMetric({ name: "LCP", value: 1234.7, delta: 12.3 }));
    expect(payload.value).toBe(1235);
    expect(payload.delta).toBe(12);
  });

  it("rounds CLS to three decimals (unitless ratio)", async () => {
    const { toPayload } = await import("../../app/plugins/web-vitals.client");
    const payload = toPayload(baseMetric({ name: "CLS", value: 0.12345, delta: 0.0009 }));
    expect(payload.value).toBe(0.123);
    expect(payload.delta).toBe(0.001);
  });

  it("throws on unsupported metric names", async () => {
    const { toPayload } = await import("../../app/plugins/web-vitals.client");
    expect(() => toPayload(baseMetric({ name: "FID" as Metric["name"] }))).toThrow(/Unsupported/);
  });
});

describe("reportToPostHog", () => {
  beforeEach(() => {
    mockCapture.mockClear();
  });

  it("emits a web_vital event with the payload", async () => {
    const { reportToPostHog, toPayload } = await import("../../app/plugins/web-vitals.client");
    const payload = toPayload(baseMetric({ name: "INP", value: 42 }));
    reportToPostHog(payload);
    expect(mockCapture).toHaveBeenCalledWith("web_vital", payload);
  });
});

describe("reportToSentry", () => {
  beforeEach(() => {
    mockSetMeasurement.mockClear();
    mockSetTag.mockClear();
  });

  it("records a millisecond measurement for timing metrics", async () => {
    const { reportToSentry, toPayload } = await import("../../app/plugins/web-vitals.client");
    const payload = toPayload(baseMetric({ name: "LCP", value: 1800, rating: "needs-improvement" }));
    reportToSentry(payload);
    expect(mockSetMeasurement).toHaveBeenCalledWith("webvital.lcp", 1800, "millisecond");
    expect(mockSetTag).toHaveBeenCalledWith("webvital.lcp.rating", "needs-improvement");
  });

  it("records a unitless measurement for CLS", async () => {
    const { reportToSentry, toPayload } = await import("../../app/plugins/web-vitals.client");
    const payload = toPayload(baseMetric({ name: "CLS", value: 0.08, rating: "good" }));
    reportToSentry(payload);
    expect(mockSetMeasurement).toHaveBeenCalledWith("webvital.cls", 0.08, "none");
  });
});

describe("emit", () => {
  beforeEach(() => {
    mockCapture.mockClear();
    mockSetMeasurement.mockClear();
    mockSetTag.mockClear();
  });

  it("forwards the metric to PostHog and Sentry", async () => {
    const { emit } = await import("../../app/plugins/web-vitals.client");
    emit(baseMetric({ name: "FCP", value: 900 }));
    expect(mockCapture).toHaveBeenCalledTimes(1);
    expect(mockSetMeasurement).toHaveBeenCalledTimes(1);
    expect(mockSetTag).toHaveBeenCalledTimes(1);
  });
});
