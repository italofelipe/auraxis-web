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

  it("não chama callbacks em 401 — relança ApiError normalmente", async () => {
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
