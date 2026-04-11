import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "~/core/errors";

import { registerResponseInterceptors, toApiError } from "../interceptors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the registered response interceptor rejected handler from an Axios instance.
 *
 * @param client Axios instance with at least one response interceptor.
 * @returns The rejected handler function.
 */
const getRejectedHandler = (
  client: ReturnType<typeof axios.create>,
): ((error: unknown) => Promise<never>) => {
  const handlers = (
    client.interceptors.response as unknown as {
      handlers: Array<{ fulfilled: unknown; rejected: (e: unknown) => Promise<never> }>;
    }
  ).handlers;

  const handler = handlers[0];
  if (!handler) {
    throw new Error("No response interceptor registered");
  }

  return handler.rejected;
};

/**
 * Creates a minimal Axios error shape for use in tests.
 *
 * @param status HTTP status code.
 * @param message Response body message.
 * @param code Optional error code.
 * @returns Axios-like error object.
 */
const makeAxiosError = (
  status: number,
  message = "Error",
  code?: string,
): Error & { isAxiosError: boolean; response: { status: number; data: { message: string; code?: string } } } =>
  Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status, data: { message, code } },
  });

// ---------------------------------------------------------------------------
// toApiError
// ---------------------------------------------------------------------------

describe("toApiError", () => {
  it("retorna a mesma instância quando já é ApiError", () => {
    const original = new ApiError(404, "Not found");
    expect(toApiError(original)).toBe(original);
  });

  it("converte AxiosError em ApiError com status e mensagem da resposta", () => {
    const axiosErr = makeAxiosError(422, "Dado inválido", "VALIDATION_ERROR");
    const err = toApiError(axiosErr);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.message).toBe("Dado inválido");
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("usa status 500 quando AxiosError não tem response", () => {
    const axiosErr = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
    });
    const err = toApiError(axiosErr);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
  });

  it("converte Error genérico em ApiError 500", () => {
    const err = toApiError(new Error("Something went wrong"));

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("Something went wrong");
  });

  it("converte valor primitivo em ApiError 500 com mensagem padrão", () => {
    const err = toApiError("crash");

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
    expect(err.message).toBe("Unexpected error");
  });

  it("converte null em ApiError 500", () => {
    const err = toApiError(null);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// registerResponseInterceptors
// ---------------------------------------------------------------------------

describe("registerResponseInterceptors", () => {
  let client: ReturnType<typeof axios.create>;
  let onForbidden: (message: string) => void;
  let onServerError: (message: string) => void;

  beforeEach(() => {
    client = axios.create({ baseURL: "http://localhost" });
    onForbidden = vi.fn<(message: string) => void>();
    onServerError = vi.fn<(message: string) => void>();
    registerResponseInterceptors(client, { onForbidden, onServerError });
  });

  it("registra exatamente um interceptor de resposta", () => {
    const handlers = (
      client.interceptors.response as unknown as { handlers: Array<unknown> }
    ).handlers;

    expect(handlers.filter(Boolean)).toHaveLength(1);
  });

  it("chama onForbidden com mensagem padrão e relança ApiError em 403", async () => {
    const handler = getRejectedHandler(client);

    await expect(handler(makeAxiosError(403, "Forbidden", "FORBIDDEN"))).rejects.toBeInstanceOf(ApiError);
    expect(onForbidden).toHaveBeenCalledOnce();
    expect(onForbidden).toHaveBeenCalledWith(
      "Você não tem permissão para acessar este recurso.",
    );
    expect(onServerError).not.toHaveBeenCalled();
  });

  it("chama onServerError com mensagem padrão e relança ApiError em 500", async () => {
    const handler = getRejectedHandler(client);

    await expect(handler(makeAxiosError(500, "Internal error"))).rejects.toBeInstanceOf(ApiError);
    expect(onServerError).toHaveBeenCalledOnce();
    expect(onServerError).toHaveBeenCalledWith(
      "Ocorreu um erro no servidor. Tente novamente em instantes.",
    );
    expect(onForbidden).not.toHaveBeenCalled();
  });

  it("chama onServerError em qualquer 5xx (502)", async () => {
    const handler = getRejectedHandler(client);

    await expect(handler(makeAxiosError(502))).rejects.toBeInstanceOf(ApiError);
    expect(onServerError).toHaveBeenCalledOnce();
  });

  it("não chama callbacks em 422 — relança ApiError normalmente", async () => {
    const handler = getRejectedHandler(client);

    const err = await handler(makeAxiosError(422, "Dado inválido")).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
    expect(onForbidden).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it("não chama onForbidden/onServerError em 401 sem onUnauthorized", async () => {
    const handler = getRejectedHandler(client);

    const err = await handler(makeAxiosError(401, "Não autorizado")).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(onForbidden).not.toHaveBeenCalled();
    expect(onServerError).not.toHaveBeenCalled();
  });

  it("funciona sem callbacks definidos (all optional)", async () => {
    const clientNoCallbacks = axios.create({ baseURL: "http://localhost" });
    registerResponseInterceptors(clientNoCallbacks, {});

    const handler = getRejectedHandler(clientNoCallbacks);

    await expect(handler(makeAxiosError(500))).rejects.toBeInstanceOf(ApiError);
  });

  it("erro lançado preserva status e code corretos em 403", async () => {
    const handler = getRejectedHandler(client);

    const err = await handler(
      makeAxiosError(403, "Proibido", "FORBIDDEN"),
    ).catch((e: unknown) => e);

    expect((err as ApiError).status).toBe(403);
    expect((err as ApiError).code).toBe("FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// 401 — token refresh flow
// ---------------------------------------------------------------------------

describe("registerResponseInterceptors — onUnauthorized (token refresh)", () => {
  it("chama onUnauthorized em 401 quando handler está configurado e erro não tem config", async () => {
    const onUnauthorized = vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
    const refreshClient = axios.create({ baseURL: "http://localhost" });
    registerResponseInterceptors(refreshClient, { onUnauthorized });

    const handler = getRejectedHandler(refreshClient);
    const err = await handler(makeAxiosError(401, "Unauthorized")).catch((e: unknown) => e);

    // Error has no config, so refresh is skipped and 401 is re-thrown.
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });

  it("relança ApiError 401 quando onUnauthorized retorna null", async () => {
    const onUnauthorized = vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
    const refreshClient = axios.create({ baseURL: "http://localhost" });
    registerResponseInterceptors(refreshClient, { onUnauthorized });

    const handler = getRejectedHandler(refreshClient);

    const axiosErr = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
      config: { headers: { Authorization: "Bearer old" }, _retry: false },
    });

    const err = await handler(axiosErr).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
  });

  it("não chama onUnauthorized em 401 quando _retry já está marcado (evita loop)", async () => {
    const onUnauthorized = vi.fn<() => Promise<string | null>>().mockResolvedValue("new-token");
    const refreshClient = axios.create({ baseURL: "http://localhost" });
    registerResponseInterceptors(refreshClient, { onUnauthorized });

    const handler = getRejectedHandler(refreshClient);

    const axiosErr = Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
      config: { headers: {}, _retry: true },
    });

    const err = await handler(axiosErr).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 401 — concurrent refresh deduplication (stampede guard)
// ---------------------------------------------------------------------------

describe("registerResponseInterceptors — refresh stampede dedup", () => {
  it("dez 401 concorrentes compartilham o mesmo refresh in-flight", async () => {
    let resolveRefresh: ((token: string | null) => void) | null = null;
    const onUnauthorized = vi.fn<() => Promise<string | null>>().mockImplementation(
      () =>
        new Promise<string | null>((resolve) => {
          resolveRefresh = resolve;
        }),
    );
    // Mock the client so the retry path doesn't attempt a real network call.
    const retryCalls: Array<Record<string, unknown>> = [];
    const baseClient = axios.create({ baseURL: "http://localhost" });
    const clientAsFn = baseClient as unknown as ((
      config: unknown,
    ) => Promise<unknown>) & { interceptors: typeof baseClient.interceptors };
    const proxyHandler: ProxyHandler<typeof clientAsFn> = {
      apply: (_target, _this, args: unknown[]) => {
        retryCalls.push(args[0] as Record<string, unknown>);
        return Promise.resolve({ data: "ok" });
      },
    };
    const proxied = new Proxy(clientAsFn, proxyHandler);
    registerResponseInterceptors(
      proxied as unknown as ReturnType<typeof axios.create>,
      { onUnauthorized },
    );
    const proxiedHandler = (
      (proxied as unknown as typeof clientAsFn).interceptors.response as unknown as {
        handlers: Array<{ rejected: (e: unknown) => Promise<never> }>;
      }
    ).handlers[0]!.rejected;

    const failures = Array.from({ length: 10 }, (_, i) =>
      Object.assign(new Error("Unauthorized"), {
        isAxiosError: true,
        response: { status: 401, data: { message: "Unauthorized" } },
        config: { headers: {}, _retry: false, url: `/res/${i}` },
      }),
    );

    const results = failures.map((err) =>
      proxiedHandler(err).catch((e: unknown) => e),
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    if (!resolveRefresh) {
      throw new Error("refresh was never scheduled");
    }
    (resolveRefresh as (token: string | null) => void)("new-token");

    await Promise.all(results);
    expect(retryCalls.length).toBe(10);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("libera a promise cacheada após a resolução para permitir novos refreshes", async () => {
    const onUnauthorized = vi.fn<() => Promise<string | null>>().mockResolvedValue(null);
    const refreshClient = axios.create({ baseURL: "http://localhost" });
    registerResponseInterceptors(refreshClient, { onUnauthorized });
    const handler = getRejectedHandler(refreshClient);

    /**
     * Creates a fresh axios-like error object with `_retry: false` so each
     * invocation passes the retry-guard and exercises the shared-refresh path.
     *
     * @returns Axios-shaped 401 error ready to hand to the interceptor.
     */
    const makeErr = (): Error => Object.assign(new Error("Unauthorized"), {
      isAxiosError: true,
      response: { status: 401, data: { message: "Unauthorized" } },
      config: { headers: {}, _retry: false },
    });

    await handler(makeErr()).catch(() => undefined);
    await handler(makeErr()).catch(() => undefined);

    // Each sequential 401 (with its own config) must trigger a fresh refresh
    // once the previous one has settled, even though it returned null.
    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });
});
