import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./privacy.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the canonical privacy page.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(PrivacyPage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("PrivacyPage (/privacy)", () => {
  it("renders the canonical privacy policy document", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Política de Privacidade");
    expect(wrapper.text()).toContain("LGPD");
    expect(wrapper.text()).toContain("não usa dados do usuário para treinar modelos próprios");
  });

  it("links to the canonical terms and cookies routes", () => {
    const wrapper = mountPage();

    expect(wrapper.findAll("a[href=\"/terms\"]").length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find("a[href=\"/cookies\"]").exists()).toBe(true);
  });
});
