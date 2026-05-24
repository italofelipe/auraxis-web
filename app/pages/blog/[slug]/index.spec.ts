import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { App } from "vue";

import BlogPostPage from "./index.vue";

const routeState = vi.hoisted(() => ({
  params: { slug: "controle-financeiro-sem-planilha-confusa" },
  path: "/blog/controle-financeiro-sem-planilha-confusa",
}));

const createErrorMock = vi.hoisted(() =>
  vi.fn((input: { statusCode: number; statusMessage: string }) => new Error(input.statusMessage)),
);

vi.mock("#imports", () => ({
  createError: createErrorMock,
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useRoute: (): { params: { slug: string }; path: string } => ({
    params: routeState.params,
    path: routeState.path,
  }),
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
 * Installs a route-aware Nuxt context for the blog post page tests.
 *
 * @param app - Vue test app instance.
 */
function blogRouteContextPlugin(app: App): void {
  Reflect.set(app, "$nuxt", {
    _route: { path: routeState.path, meta: {}, params: routeState.params, query: {} },
    $config: {
      public: { siteSurface: "marketing", siteUrl: "https://www.auraxis.com.br" },
    },
    payload: { serverRendered: false },
    ssrContext: {
      head: {
        push: vi.fn(() => ({
          patch: vi.fn(),
          dispose: vi.fn(),
        })),
      },
    },
    static: { data: {} },
    isHydrating: false,
    deferHydration: (): void => {},
    runWithContext: <T>(callback: () => T): T => callback(),
    hooks: { callHook: vi.fn(), hook: vi.fn() },
    _asyncDataPromises: {},
    _asyncData: {},
  });
}

/**
 * Mounts the selected blog post page.
 *
 * @returns Mounted Vue wrapper.
 */
function mountPage(): VueWrapper {
  return mount(BlogPostPage, { global: { plugins: [blogRouteContextPlugin], stubs } });
}

describe("BlogPostPage", () => {
  it("renders the selected post with sections, FAQ and related links", () => {
    routeState.params = { slug: "controle-financeiro-sem-planilha-confusa" };
    routeState.path = "/blog/controle-financeiro-sem-planilha-confusa";
    const wrapper = mountPage();

    expect(wrapper.text()).toContain("Controle financeiro sem planilha confusa");
    expect(wrapper.text()).toContain("O mês precisa ter uma leitura simples");
    expect(wrapper.text()).toContain("Perguntas frequentes");
    expect(wrapper.find("a[href='/blog']").exists()).toBe(true);
    expect(wrapper.find("a[href='/register']").exists()).toBe(true);
  });
});
