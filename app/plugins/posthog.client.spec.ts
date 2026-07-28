/* eslint-disable jsdoc/require-jsdoc */
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = vi.hoisted(() => ({
  capture: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("posthog-js/dist/module.no-external", () => ({
  default: posthogMock,
}));

// eslint-disable-next-line import/first
import { createConsentAwareAnalyticsClient } from "./posthog.client";

interface TestAnalyticsConsentGateway {
  canUseAnalytics(): boolean;
  onChange(listener: (nextAllowed: boolean) => void): () => void;
  setAllowed(nextAllowed: boolean): void;
}

const createGateway = (initialAllowed: boolean): TestAnalyticsConsentGateway => {
  let allowed = initialAllowed;
  const listeners: Array<(allowed: boolean) => void> = [];

  return {
    canUseAnalytics: () => allowed,
    onChange: (listener: (nextAllowed: boolean) => void): (() => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    },
    setAllowed: (nextAllowed: boolean): void => {
      allowed = nextAllowed;
      listeners.forEach((listener) => listener(nextAllowed));
    },
  };
};

describe("PostHog consent gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not initialize or capture events before analytics consent", () => {
    const gateway = createGateway(false);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("dashboard_viewed");
    client.identify("user-123");

    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
    expect(posthogMock.identify).not.toHaveBeenCalled();
  });

  it("initializes once and captures after analytics consent is granted", () => {
    const gateway = createGateway(false);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    gateway.setAllowed(true);
    client.capture("dashboard_viewed", { source: "test" });
    client.identify("user-123");

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    // Pageviews are SDK-native (#1208): "history_change" covers the initial
    // full-page load AND SPA navigations — the manual page:finish hook never
    // fired on full-page loads, so the SSG landing captured zero pageviews.
    expect(posthogMock.init).toHaveBeenCalledWith(
      "ph_test",
      expect.objectContaining({ capture_pageview: "history_change" }),
    );
    expect(posthogMock.capture).toHaveBeenCalledWith("dashboard_viewed", { source: "test" });
    expect(posthogMock.identify).toHaveBeenCalledWith("user-123");
  });

  it("stops future analytics events when consent is revoked", () => {
    const gateway = createGateway(true);
    const client = createConsentAwareAnalyticsClient("ph_test", "https://eu.i.posthog.com", gateway);

    client.capture("dashboard_viewed");
    gateway.setAllowed(false);
    client.capture("portfolio_viewed");

    expect(posthogMock.opt_out_capturing).toHaveBeenCalledOnce();
    expect(posthogMock.reset).toHaveBeenCalledOnce();
    expect(posthogMock.capture).not.toHaveBeenCalledWith("portfolio_viewed", undefined);
  });
});
