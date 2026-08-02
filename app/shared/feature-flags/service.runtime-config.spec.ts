import { describe, expect, it, vi } from "vitest";

// In client bundles `process.env` is shimmed to `{}`, so getRuntimeEnv must
// read the hydrated Nuxt runtime config (public.appEnv) to know the real
// environment in the browser (#1156). This spec pins that path; the sibling
// service.spec.ts covers the process.env fallback used outside a Nuxt app.
vi.mock("nuxt/app", () => ({
  useRuntimeConfig: (): { public: { appEnv: string } } => ({
    public: { appEnv: "production" },
  }),
}));

// eslint-disable-next-line import/first
import { getRuntimeEnv, isFeatureEnabled } from "./service";

describe("feature flag service — runtime config source", () => {
  it("resolves the environment from runtimeConfig.public.appEnv", () => {
    expect(getRuntimeEnv()).toBe("production");
  });

  it("keeps dev-only surfaces off in production even with a shimmed process.env", () => {
    // web.admin.insights is enabled-dev in the catalog — with appEnv coming
    // from the runtime config the surface must stay hidden in production.
    expect(isFeatureEnabled("web.admin.insights")).toBe(false);
  });

  it("keeps always-on statuses enabled in production", () => {
    expect(isFeatureEnabled("web.admin.feature-flag-mutations")).toBe(true);
  });

  it("exposes the spreadsheet import in production", () => {
    // The wizard shipped in #1300 but sat behind enabled-dev, so it never
    // reached a real user (#1309). This pins the go-live: flipping the catalog
    // back to a dev-only status fails here instead of silently hiding the
    // feature again.
    expect(isFeatureEnabled("web.import.csv-xlsx")).toBe(true);
  });
});
