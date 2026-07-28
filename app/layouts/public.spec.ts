import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PublicLayout from "./public.vue";

/* ── Module mocks ──────────────────────────────────────────────────────────── */

let mockSurface = "app";
let mockPath = "/";
let mockMeta: Record<string, unknown> = {};

vi.mock("#app", () => ({
  useRuntimeConfig: (): { public: { siteSurface: string } } => ({
    public: { siteSurface: mockSurface },
  }),
  useRoute: (): { path: string; meta: Record<string, unknown> } => ({
    path: mockPath,
    meta: mockMeta,
  }),
}));

const stubs = {
  UiPublicHeader: { template: "<header class='ui-public-header' />" },
  UiPublicFooter: { template: "<footer class='ui-public-footer' />" },
};

/**
 * Mounts the layout for a given surface/route combination.
 *
 * @param surface - Active site surface.
 * @param path - Current route path.
 * @param meta - Route meta (e.g. `publicChrome`).
 * @returns Mounted wrapper.
 */
const mountLayout = (
  surface: string,
  path: string,
  meta: Record<string, unknown> = {},
): ReturnType<typeof mount> => {
  mockSurface = surface;
  mockPath = path;
  mockMeta = meta;
  return mount(PublicLayout, { global: { stubs } });
};

beforeEach(() => {
  mockSurface = "app";
  mockPath = "/";
  mockMeta = {};
});

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe("public layout — shared chrome", () => {
  it("renders the shared chrome on the app surface", () => {
    const wrapper = mountLayout("app", "/support");

    expect(wrapper.find(".ui-public-header").exists()).toBe(true);
    expect(wrapper.find(".ui-public-footer").exists()).toBe(true);
  });

  it("renders the shared chrome on landing content pages", () => {
    const wrapper = mountLayout("landing", "/controle-financeiro");

    expect(wrapper.find(".ui-public-header").exists()).toBe(true);
  });

  it("hides the shared chrome when the page opts out (checkout)", () => {
    const wrapper = mountLayout("landing", "/checkout", { publicChrome: false });

    expect(wrapper.find(".ui-public-header").exists()).toBe(false);
    expect(wrapper.find(".ui-public-footer").exists()).toBe(false);
  });

  it("hides the shared chrome on the landing home (own header/footer)", () => {
    const wrapper = mountLayout("landing", "/");

    expect(wrapper.find(".ui-public-header").exists()).toBe(false);
  });

  it.each(["/en", "/en/"])(
    "hides the shared chrome on the landing home under the %s locale prefix",
    (path) => {
      const wrapper = mountLayout("landing", path);

      expect(wrapper.find(".ui-public-header").exists()).toBe(false);
      expect(wrapper.find(".ui-public-footer").exists()).toBe(false);
    },
  );

  it("keeps the chrome on locale-prefixed content pages", () => {
    const wrapper = mountLayout("landing", "/en/tools/fire");

    expect(wrapper.find(".ui-public-header").exists()).toBe(true);
  });

  it("keeps the chrome on the app-surface home", () => {
    const wrapper = mountLayout("app", "/");

    expect(wrapper.find(".ui-public-header").exists()).toBe(true);
  });
});
