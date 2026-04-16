import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setResponseHeaderSpy = vi.fn();

vi.mock("h3", () => ({
  defineEventHandler: (handler: unknown): unknown => handler,
  setResponseHeader: (...args: unknown[]): void => {
    setResponseHeaderSpy(...args);
  },
}));

type CspMiddleware = (event: unknown) => void;

/**
 * Dynamically imports the middleware under test after env vars are set.
 *
 * @returns The middleware function.
 */
const loadMiddleware = async (): Promise<CspMiddleware> =>
  (await import("../csp")).default as CspMiddleware;

describe("server/middleware/csp", () => {
  const originalEnv = { ...process.env };
  const fakeEvent = { __event: true };

  beforeEach(() => {
    setResponseHeaderSpy.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("no-ops em production — CloudFront emite o header", async () => {
    process.env.NUXT_PUBLIC_APP_ENV = "production";
    const middleware = await loadMiddleware();
    middleware(fakeEvent);
    expect(setResponseHeaderSpy).not.toHaveBeenCalled();
  });

  it("emite Content-Security-Policy em development", async () => {
    process.env.NUXT_PUBLIC_APP_ENV = "development";
    delete process.env.NUXT_PUBLIC_CSP_REPORT_URI;
    const middleware = await loadMiddleware();
    middleware(fakeEvent);
    expect(setResponseHeaderSpy).toHaveBeenCalledTimes(1);
    const [, headerName, value] = setResponseHeaderSpy.mock.calls[0] ?? [];
    expect(headerName).toBe("Content-Security-Policy");
    expect(String(value)).toContain("frame-ancestors 'none'");
    expect(String(value)).not.toContain("report-uri");
  });

  it("emite header em staging com script-src estrito", async () => {
    process.env.NUXT_PUBLIC_APP_ENV = "staging";
    const middleware = await loadMiddleware();
    middleware(fakeEvent);
    const [, , value] = setResponseHeaderSpy.mock.calls[0] ?? [];
    const scriptDirective = String(value)
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith("script-src"));
    expect(scriptDirective).toBe("script-src 'self'");
  });

  it("anexa report-uri quando NUXT_PUBLIC_CSP_REPORT_URI estiver setado", async () => {
    process.env.NUXT_PUBLIC_APP_ENV = "development";
    process.env.NUXT_PUBLIC_CSP_REPORT_URI = "https://sentry.io/api/1/security/";
    const middleware = await loadMiddleware();
    middleware(fakeEvent);
    const [, , value] = setResponseHeaderSpy.mock.calls[0] ?? [];
    expect(String(value)).toContain("report-uri https://sentry.io/api/1/security/");
  });

  it("cai para NODE_ENV quando NUXT_PUBLIC_APP_ENV estiver ausente", async () => {
    delete process.env.NUXT_PUBLIC_APP_ENV;
    process.env.NODE_ENV = "production";
    const middleware = await loadMiddleware();
    middleware(fakeEvent);
    expect(setResponseHeaderSpy).not.toHaveBeenCalled();
  });
});
