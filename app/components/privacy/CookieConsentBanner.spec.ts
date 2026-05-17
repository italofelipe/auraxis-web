/* eslint-disable jsdoc/require-jsdoc */
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";

import {
  COOKIE_CONSENT_KEY,
  readCookieConsent,
  rejectOptionalCookieConsent,
} from "~/shared/privacy/cookie-consent";
import CookieConsentBanner from "./CookieConsentBanner.vue";

const clearConsentCookie = (): void => {
  document.cookie = `${COOKIE_CONSENT_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    clearConsentCookie();
  });

  it("renders the cookie banner when no preference was saved", async () => {
    const wrapper = mount(CookieConsentBanner);
    await nextTick();

    expect(wrapper.get("[role='region']").text()).toContain("Controle seus cookies");
    expect(wrapper.text()).toContain("Aceitar todos");
    expect(wrapper.text()).toContain("Rejeitar opcionais");
  });

  it("stays hidden when the visitor already chose preferences", () => {
    rejectOptionalCookieConsent(new Date("2026-05-17T10:00:00.000Z"));

    const wrapper = mount(CookieConsentBanner);

    expect(wrapper.find("[role='region']").exists()).toBe(false);
  });

  it("accepts all optional cookies from the banner", async () => {
    const wrapper = mount(CookieConsentBanner);
    await nextTick();

    await wrapper.get("button[data-testid='cookie-accept-all']").trigger("click");

    expect(readCookieConsent()).toMatchObject({ analytics: true, marketing: true });
    expect(wrapper.find("[role='region']").exists()).toBe(false);
  });

  it("rejects optional cookies from the banner", async () => {
    const wrapper = mount(CookieConsentBanner);
    await nextTick();

    await wrapper.get("button[data-testid='cookie-reject-optional']").trigger("click");
    wrapper.unmount();

    expect(readCookieConsent()).toMatchObject({ analytics: false, marketing: false });
    expect(wrapper.find("[role='region']").exists()).toBe(false);
  });

  it("saves granular preferences", async () => {
    const wrapper = mount(CookieConsentBanner);
    await nextTick();

    await wrapper.get("button[data-testid='cookie-configure']").trigger("click");
    await wrapper.get("input[data-testid='cookie-marketing']").setValue(true);
    await wrapper.get("input[data-testid='cookie-analytics']").setValue(false);
    await wrapper.get("button[data-testid='cookie-save-preferences']").trigger("click");

    expect(readCookieConsent()).toMatchObject({ analytics: false, marketing: true });
    expect(wrapper.find("[role='region']").exists()).toBe(false);
  });
});
