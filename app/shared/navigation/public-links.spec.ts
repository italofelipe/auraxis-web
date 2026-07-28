import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isProductPath,
  resolveProductHref,
  resolvePublicHref,
  resolveSiteSurface,
  usePublicNav,
} from "./public-links";

/* ── Module mocks ──────────────────────────────────────────────────────────── */

const tryUseNuxtAppMock = vi.fn();

vi.mock("#app", () => ({
  tryUseNuxtApp: (): unknown => tryUseNuxtAppMock(),
}));

/**
 * Points the mocked nuxt app at a given runtime surface.
 *
 * @param siteSurface - Value exposed as `$config.public.siteSurface`.
 */
const withSurface = (siteSurface: unknown): void => {
  tryUseNuxtAppMock.mockReturnValue({ $config: { public: { siteSurface } } });
};

beforeEach(() => {
  vi.clearAllMocks();
  withSurface(undefined);
});

/* ── Tests ─────────────────────────────────────────────────────────────────── */

describe("isProductPath", () => {
  it.each(["/login", "/register", "/dashboard", "/plans", "/about-us", "/support"])(
    "treats %s as a product path",
    (path) => {
      expect(isProductPath(path)).toBe(true);
    },
  );

  it("treats nested and query variants of product paths as product", () => {
    expect(isProductPath("/dashboard/settings")).toBe(true);
    expect(isProductPath("/register?plan=annual")).toBe(true);
  });

  it.each(["/", "/tools", "/tools/juros-compostos", "/blog", "/controle-financeiro", "/checkout"])(
    "treats %s as content (non-product)",
    (path) => {
      expect(isProductPath(path)).toBe(false);
    },
  );

  it("does not confuse SEO slugs that share a product prefix substring", () => {
    expect(isProductPath("/planejamento-financeiro")).toBe(false);
    expect(isProductPath("/supporte-falso")).toBe(false);
  });
});

describe("resolveProductHref", () => {
  it("keeps product paths relative on the app surface", () => {
    expect(resolveProductHref("app", "/login")).toBe("/login");
  });

  it("keeps product paths relative on the marketing surface", () => {
    expect(resolveProductHref("marketing", "/register")).toBe("/register");
  });

  it("makes product paths absolute to the app host on the landing surface", () => {
    expect(resolveProductHref("landing", "/register")).toBe(
      "https://app.auraxis.com.br/register",
    );
    expect(resolveProductHref("landing", "/dashboard")).toBe(
      "https://app.auraxis.com.br/dashboard",
    );
  });
});

describe("resolvePublicHref", () => {
  it("routes product paths through the product resolver on the landing surface", () => {
    expect(resolvePublicHref("landing", "/register")).toBe(
      "https://app.auraxis.com.br/register",
    );
  });

  it("keeps content paths relative on every surface", () => {
    expect(resolvePublicHref("landing", "/tools")).toBe("/tools");
    expect(resolvePublicHref("landing", "/controle-financeiro")).toBe("/controle-financeiro");
    expect(resolvePublicHref("marketing", "/blog")).toBe("/blog");
  });
});

describe("resolveSiteSurface", () => {
  it.each(["app", "marketing", "landing"] as const)("returns %s from runtimeConfig", (surface) => {
    withSurface(surface);
    expect(resolveSiteSurface()).toBe(surface);
  });

  it("falls back to app when the surface is missing", () => {
    withSurface(undefined);
    expect(resolveSiteSurface()).toBe("app");
  });

  it("falls back to app when the surface is unknown", () => {
    withSurface("preview");
    expect(resolveSiteSurface()).toBe("app");
  });

  it("falls back to app when there is no nuxt app instance", () => {
    tryUseNuxtAppMock.mockReturnValue(undefined);
    expect(resolveSiteSurface()).toBe("app");
  });
});

describe("usePublicNav", () => {
  it("resolves the surface once at setup and exposes landing-aware helpers", () => {
    withSurface("landing");

    const nav = usePublicNav();

    expect(nav.surface).toBe("landing");
    expect(nav.isLanding).toBe(true);
    expect(nav.productHref("/login")).toBe("https://app.auraxis.com.br/login");
    expect(nav.publicHref("/tools")).toBe("/tools");
  });

  it("keeps product links relative outside the landing", () => {
    withSurface("marketing");

    const nav = usePublicNav();

    expect(nav.isLanding).toBe(false);
    expect(nav.productHref("/register")).toBe("/register");
    expect(nav.publicHref("/register")).toBe("/register");
  });
});
