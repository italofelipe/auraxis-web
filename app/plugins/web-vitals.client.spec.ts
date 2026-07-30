import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Metric } from "web-vitals";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
}));

const sentryMock = vi.hoisted(() => ({
  setMeasurement: vi.fn(),
  setTag: vi.fn(),
}));

vi.mock("posthog-js/dist/module.no-external", () => ({
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

/**
 * Deixa as continuações do `import()` dinâmico do SDK rodarem.
 *
 * `reportToPostHog` passou a carregar o PostHog por promise (#1246), então o
 * `capture` acontece depois da chamada. Drenar só microtask não basta:
 * resolver um `import()` envolve o grafo de módulos.
 */
const flushSdkLoad = async (): Promise<void> => {
  for (let index = 0; index < 3; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

describe("web-vitals consent gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not send metrics to PostHog or Sentry before analytics consent", async () => {
    emit(metric, false);
    await flushSdkLoad();

    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(sentryMock.setMeasurement).not.toHaveBeenCalled();
    expect(sentryMock.setTag).not.toHaveBeenCalled();
  });

  it("sends metrics when analytics consent is granted", async () => {
    emit(metric, true);
    await flushSdkLoad();

    expect(posthogMock.capture).toHaveBeenCalledWith("web_vital", expect.objectContaining({
      name: "LCP",
      value: 2300,
    }));
    expect(sentryMock.setMeasurement).toHaveBeenCalledWith("webvital.lcp", 2300, "millisecond");
    expect(sentryMock.setTag).toHaveBeenCalledWith("webvital.lcp.rating", "needs-improvement");
  });
});
