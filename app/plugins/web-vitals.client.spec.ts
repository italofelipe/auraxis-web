import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Metric } from "web-vitals";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
}));

const sentryMock = vi.hoisted(() => ({
  setMeasurement: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: posthogMock,
}));

vi.mock("@sentry/nuxt", () => sentryMock);

// eslint-disable-next-line import/first
import { emit } from "./web-vitals.client";

const metric: Metric = {
  name: "LCP",
  value: 2300.4,
  rating: "needs-improvement",
  delta: 2300.4,
  id: "v3-1",
  navigationType: "navigate",
  entries: [],
};

describe("web-vitals consent gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not send metrics to PostHog or Sentry before analytics consent", () => {
    emit(metric, false);

    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(sentryMock.setMeasurement).not.toHaveBeenCalled();
    expect(sentryMock.setTag).not.toHaveBeenCalled();
  });

  it("sends metrics when analytics consent is granted", () => {
    emit(metric, true);

    expect(posthogMock.capture).toHaveBeenCalledWith("web_vital", expect.objectContaining({
      name: "LCP",
      value: 2300,
    }));
    expect(sentryMock.setMeasurement).toHaveBeenCalledWith("webvital.lcp", 2300, "millisecond");
    expect(sentryMock.setTag).toHaveBeenCalledWith("webvital.lcp.rating", "needs-improvement");
  });
});
