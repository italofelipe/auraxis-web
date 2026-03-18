import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSentryInit = vi.hoisted(() => vi.fn());

vi.mock("@sentry/nuxt", () => ({
  init: mockSentryInit,
}));

vi.mock("#app", () => ({
  defineNuxtPlugin: (fn: (nuxtApp: unknown) => unknown): ((nuxtApp: unknown) => unknown) => fn,
  useRuntimeConfig: vi.fn(),
}));

describe("normalizeDsn", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("retorna string vazia quando valor é undefined", async () => {
    const { normalizeDsn } = await import("../../app/plugins/sentry.client");
    expect(normalizeDsn(undefined)).toBe("");
  });

  it("retorna string vazia quando valor é string de espaços", async () => {
    const { normalizeDsn } = await import("../../app/plugins/sentry.client");
    expect(normalizeDsn("   ")).toBe("");
  });

  it("retorna DSN sem espaços quando valor é válido", async () => {
    const { normalizeDsn } = await import("../../app/plugins/sentry.client");
    const dsn = "https://abc@sentry.io/123";
    expect(normalizeDsn(dsn)).toBe(dsn);
  });
});

describe("initSentry", () => {
  beforeEach(() => {
    mockSentryInit.mockClear();
    vi.resetModules();
  });

  it("chama Sentry.init com tracesSampleRate=0.1 e sendDefaultPii=false", async () => {
    const { initSentry } = await import("../../app/plugins/sentry.client");

    initSentry("https://x@sentry.io/1", "production");

    const args = mockSentryInit.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.tracesSampleRate).toBe(0.1);
    expect(args.sendDefaultPii).toBe(false);
    expect(args.enabled).toBe(true);
  });

  it("repassa dsn e environment para Sentry.init", async () => {
    const { initSentry } = await import("../../app/plugins/sentry.client");
    const dsn = "https://abc@o0.ingest.sentry.io/12345";

    initSentry(dsn, "staging");

    const args = mockSentryInit.mock.calls[0]![0] as Record<string, unknown>;
    expect(args.dsn).toBe(dsn);
    expect(args.environment).toBe("staging");
  });

  it("não chama Sentry.init sem ser invocado", async () => {
    await import("../../app/plugins/sentry.client");
    expect(mockSentryInit).not.toHaveBeenCalled();
  });
});
