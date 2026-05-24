import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

import BlogIndexPage from "./index.vue";
import { nuxtAppContextPlugin } from "~/test-utils";

const routeState = vi.hoisted(() => ({ path: "/blog" }));

vi.mock("#imports", () => ({
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useRoute: (): { path: string } => ({ path: routeState.path }),
  useRuntimeConfig: (): { public: { siteSurface: string; siteUrl: string } } => ({
    public: { siteSurface: "marketing", siteUrl: "https://www.auraxis.com.br" },
  }),
  useSeoMeta: vi.fn(),
}));

const stubs = {
  NuxtLink: {
    props: ["to"],
    template: "<a :href='to'><slot /></a>",
  },
};

/**
 * Mounts the public blog index with the minimal Nuxt context required by head composables.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(BlogIndexPage, { global: { plugins: [nuxtAppContextPlugin], stubs } });
}

describe("BlogIndexPage", () => {
  it("lists editorial posts with helpful SEO copy", () => {
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Guias financeiros para decidir com mais clareza");
    expect(wrapper.text()).toContain("Controle financeiro sem planilha confusa");
    expect(wrapper.text()).toContain("Insights financeiros com contexto");
    expect(wrapper.find("a[href='/blog/controle-financeiro-sem-planilha-confusa']").exists()).toBe(
      true,
    );
  });

  it("links the blog hub to commercial pages and account creation", () => {
    const wrapper = mountPage();

    expect(wrapper.find("a[href='/controle-financeiro']").exists()).toBe(true);
    expect(wrapper.find("a[href='/insights-financeiros']").exists()).toBe(true);
    expect(wrapper.find("a[href='/register']").exists()).toBe(true);
  });
});
