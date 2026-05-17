/* eslint-disable jsdoc/require-jsdoc */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  acceptAllCookieConsent,
  canUseAnalyticsCookies,
  canUseMarketingCookies,
  COOKIE_CONSENT_EVENT,
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  rejectOptionalCookieConsent,
  saveCookieConsent,
  subscribeToCookieConsentChanges,
} from "./cookie-consent";

const clearConsentCookie = (): void => {
  document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

describe("cookie consent", () => {
  beforeEach(() => {
    clearConsentCookie();
  });

  it("defaults to no optional cookies when the visitor has not chosen yet", () => {
    expect(readCookieConsent()).toBeNull();
    expect(canUseAnalyticsCookies()).toBe(false);
    expect(canUseMarketingCookies()).toBe(false);
  });

  it("persists all optional categories when the visitor accepts all cookies", () => {
    const saved = acceptAllCookieConsent(new Date("2026-05-17T10:00:00.000Z"));

    expect(saved).toMatchObject({
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: "2026-05-17T10:00:00.000Z",
      version: 1,
    });
    expect(readCookieConsent()).toEqual(saved);
    expect(canUseAnalyticsCookies()).toBe(true);
    expect(canUseMarketingCookies()).toBe(true);
  });

  it("keeps necessary cookies while rejecting optional categories", () => {
    const saved = rejectOptionalCookieConsent(new Date("2026-05-17T11:00:00.000Z"));

    expect(saved).toMatchObject({
      necessary: true,
      analytics: false,
      marketing: false,
      updatedAt: "2026-05-17T11:00:00.000Z",
    });
    expect(canUseAnalyticsCookies()).toBe(false);
    expect(canUseMarketingCookies()).toBe(false);
  });

  it("normalizes necessary cookies to true when granular preferences are saved", () => {
    const saved = saveCookieConsent(
      { necessary: false, analytics: true, marketing: false },
      new Date("2026-05-17T12:00:00.000Z"),
    );

    expect(saved.necessary).toBe(true);
    expect(saved.analytics).toBe(true);
    expect(saved.marketing).toBe(false);
  });

  it("ignores malformed or outdated preference cookies", () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=not-json; path=/`;
    expect(readCookieConsent()).toBeNull();

    clearConsentCookie();
    document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(JSON.stringify({
      version: 999,
      analytics: true,
      marketing: true,
    }))}; path=/`;

    expect(readCookieConsent()).toBeNull();
  });

  it("normalizes legacy saved data with missing updatedAt", () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(JSON.stringify({
      version: 1,
      analytics: true,
      marketing: false,
      updatedAt: null,
    }))}; path=/`;

    expect(readCookieConsent()).toMatchObject({
      analytics: true,
      marketing: false,
      updatedAt: "",
    });
  });

  it("notifies subscribers when preferences change", () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeToCookieConsentChanges(subscriber);

    const saved = saveCookieConsent(
      { analytics: true, marketing: false },
      new Date("2026-05-17T13:00:00.000Z"),
    );

    expect(subscriber).toHaveBeenCalledWith(saved);
    unsubscribe();
    rejectOptionalCookieConsent(new Date("2026-05-17T14:00:00.000Z"));
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("ignores consent events without preference details", () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeToCookieConsentChanges(subscriber);

    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));

    expect(subscriber).not.toHaveBeenCalled();
    unsubscribe();
  });
});
