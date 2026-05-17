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

vi.mock("posthog-js", () => ({
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
    client.capturePageView();

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
    client.capturePageView();

    expect(posthogMock.init).toHaveBeenCalledTimes(1);
    expect(posthogMock.capture).toHaveBeenCalledWith("dashboard_viewed", { source: "test" });
    expect(posthogMock.identify).toHaveBeenCalledWith("user-123");
    expect(posthogMock.capture).toHaveBeenCalledWith("$pageview");
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
