import { beforeEach, describe, expect, it, vi } from "vitest";

const useNuxtAppMock = vi.hoisted(() => vi.fn());

vi.mock("#app", () => ({
  useNuxtApp: useNuxtAppMock,
}));

// eslint-disable-next-line import/first
import { useAnalytics } from "./useAnalytics";

describe("useAnalytics", () => {
  beforeEach(() => {
    useNuxtAppMock.mockReset();
  });

  it("returns the injected $analytics client when present", () => {
    const capture = vi.fn();
    const identify = vi.fn();
    const reset = vi.fn();
    useNuxtAppMock.mockReturnValue({ $analytics: { capture, identify, reset } });

    const analytics = useAnalytics();
    analytics.capture("user_signed_in", { method: "password" });
    analytics.identify("user-123");
    analytics.reset();

    expect(capture).toHaveBeenCalledWith("user_signed_in", { method: "password" });
    expect(identify).toHaveBeenCalledWith("user-123");
    expect(reset).toHaveBeenCalledOnce();
  });

  it("falls back to a no-op client when $analytics is undefined (SSR/opt-out)", () => {
    useNuxtAppMock.mockReturnValue({});

    const analytics = useAnalytics();

    expect(() => analytics.capture("dashboard_viewed")).not.toThrow();
    expect(() => analytics.identify("user-123")).not.toThrow();
    expect(() => analytics.reset()).not.toThrow();
  });
});
