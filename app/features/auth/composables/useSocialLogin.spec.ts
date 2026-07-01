import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSocialLogin } from "./useSocialLogin";

const state = vi.hoisted(() => ({ enabled: true }));
const signInMock = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("useRuntimeConfig", () => (): { public: { apiV2Base: string } } => ({
  public: { apiV2Base: "http://v2.test/" },
}));

vi.mock("~/shared/feature-flags/use-feature-flag", () => ({
  useFeatureFlag: (): { value: boolean } => ({
    get value(): boolean {
      return state.enabled;
    },
  }),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { signIn: typeof signInMock } => ({ signIn: signInMock }),
}));

describe("useSocialLogin", () => {
  const originalLocation = window.location;
  const locationStub = { href: "" };

  beforeEach(() => {
    state.enabled = true;
    signInMock.mockReset();
    fetchMock.mockReset();
    locationStub.href = "";
    vi.stubGlobal("$fetch", fetchMock);
    Object.defineProperty(window, "location", {
      value: locationStub,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    vi.unstubAllGlobals();
  });

  it("exposes the feature flag state", () => {
    state.enabled = false;
    expect(useSocialLogin().isEnabled.value).toBe(false);
    state.enabled = true;
    expect(useSocialLogin().isEnabled.value).toBe(true);
  });

  it("initiate redirects to the google authorize endpoint (trailing slash trimmed)", () => {
    useSocialLogin().initiate("google");
    expect(locationStub.href).toBe("http://v2.test/v2/auth/oauth/google/authorize");
  });

  it("initiate builds the facebook url", () => {
    useSocialLogin().initiate("facebook");
    expect(locationStub.href).toBe("http://v2.test/v2/auth/oauth/facebook/authorize");
  });

  it("completeCallback exchanges the cookie and signs in with the email", async () => {
    fetchMock.mockResolvedValue({ access_token: "acc", email: "u@x.com" });

    await useSocialLogin().completeCallback();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://v2.test/v2/auth/session/refresh",
      { method: "POST", credentials: "include" },
    );
    expect(signInMock).toHaveBeenCalledWith({ accessToken: "acc", userEmail: "u@x.com" });
  });

  it("completeCallback falls back to an empty email when null", async () => {
    fetchMock.mockResolvedValue({ access_token: "acc", email: null });

    await useSocialLogin().completeCallback();

    expect(signInMock).toHaveBeenCalledWith({ accessToken: "acc", userEmail: "" });
  });

  it("completeCallback propagates fetch failures without signing in", async () => {
    fetchMock.mockRejectedValue(new Error("401"));

    await expect(useSocialLogin().completeCallback()).rejects.toThrow();
    expect(signInMock).not.toHaveBeenCalled();
  });
});
