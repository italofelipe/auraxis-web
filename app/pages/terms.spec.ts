import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import TermsPage from "./terms.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the canonical terms page.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(TermsPage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("TermsPage (/terms)", () => {
  it("renders the canonical terms document", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Termos de Uso");
    expect(wrapper.text()).toContain("Limitação de responsabilidade");
    expect(wrapper.text()).toContain("não autoriza provedores de IA a treinarem modelos");
  });

  it("links to the canonical privacy and cookies routes", () => {
    const wrapper = mountPage();

    expect(wrapper.findAll("a[href=\"/privacy\"]").length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find("a[href=\"/cookies\"]").exists()).toBe(true);
  });
});
