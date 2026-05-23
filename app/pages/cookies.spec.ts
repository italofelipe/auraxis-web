import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import CookiesPolicyPage from "./cookies.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the cookies policy page with the minimal Nuxt context required by head composables.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(CookiesPolicyPage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("CookiesPolicyPage (/cookies)", () => {
  it("renders the page title", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Política de Cookies");
  });

  it("displays document version and updated date", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("1.0.0-draft");
    expect(wrapper.text()).toContain("2026-05-16");
  });

  it("lists cookie categories and consent choices", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Essenciais");
    expect(wrapper.text()).toContain("Preferências");
    expect(wrapper.text()).toContain("Analytics");
    expect(wrapper.text()).toContain("Marketing");
    expect(wrapper.text()).toContain("aceitar todos os cookies não essenciais");
    expect(wrapper.text()).toContain("rejeitar todos os cookies não essenciais");
  });

  it("explains that analytics and marketing do not load before consent", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("não devem ser carregados antes do consentimento");
  });

  it("links to privacy policy and terms", () => {
    const wrapper = mountPage();

    expect(wrapper.find("a[href=\"/privacy\"]").exists()).toBe(true);
    expect(wrapper.find("a[href=\"/terms\"]").exists()).toBe(true);
  });
});
