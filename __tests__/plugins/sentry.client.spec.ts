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

describe("scrubPiiFromEvent — request body redaction", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("redacta request.data inteiro quando URL casa /auth/login", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      request: {
        url: "https://api.auraxis.com.br/auth/login",
        method: "POST",
        data: { email: "user@example.com", password: "Sup3rS3cret!" },
      },
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    expect(result.request?.data).toBe("[Filtered]");
  });

  it("redacta request.data quando URL casa /payments", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      request: {
        url: "https://api.auraxis.com.br/payments",
        method: "POST",
        data: {
          card_number: "4111111111111111",
          cvv: "123",
          holder: "Fulano",
        },
      },
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    expect(result.request?.data).toBe("[Filtered]");
  });

  it("redacta request.data quando URL casa /subscriptions", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      request: {
        url: "https://api.auraxis.com.br/subscriptions",
        method: "POST",
        data: { plan: "gold", card_token: "tok_abc123" },
      },
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    expect(result.request?.data).toBe("[Filtered]");
  });

  it("preserva request.data quando URL não casa nenhuma rota sensível", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      request: {
        url: "https://api.auraxis.com.br/transactions",
        method: "GET",
        data: { page: 1, limit: 20 },
      },
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    expect(result.request?.data).toEqual({ page: 1, limit: 20 });
  });

  it("redacta breadcrumbs http com URL sensível e data contendo body", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      breadcrumbs: [
        {
          category: "xhr",
          data: {
            url: "https://api.auraxis.com.br/auth/login",
            method: "POST",
            request_body: JSON.stringify({ email: "a@b.com", password: "x" }),
          },
        },
        {
          category: "xhr",
          data: {
            url: "https://api.auraxis.com.br/transactions",
            method: "GET",
          },
        },
      ],
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    const first = result.breadcrumbs?.[0];
    const second = result.breadcrumbs?.[1];
    expect(first?.data?.request_body).toBe("[Filtered]");
    expect(second?.data?.request_body).toBeUndefined();
    expect(second?.data?.method).toBe("GET");
  });

  it("redacta extra.body e extra.request quando presentes em rotas sensíveis", async () => {
    const { scrubPiiFromEvent } = await import("../../app/plugins/sentry.client");
    const event = {
      request: { url: "https://api.auraxis.com.br/auth/login", method: "POST" },
      extra: {
        body: { email: "u@x.com", password: "secret" },
        request: { endpoint: "/auth/login", payload: { password: "x" } },
        unrelated: "keep-me",
      },
    };
    const result = scrubPiiFromEvent(
      event as unknown as Parameters<typeof scrubPiiFromEvent>[0],
      {} as Parameters<typeof scrubPiiFromEvent>[1],
    );
    expect(result.extra?.body).toBe("[Filtered]");
    expect(result.extra?.request).toBe("[Filtered]");
    expect(result.extra?.unrelated).toBe("keep-me");
  });
});
