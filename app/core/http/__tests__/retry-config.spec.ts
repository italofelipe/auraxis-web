import { describe, expect, it } from "vitest";

import { DEFAULT_RETRY_CONFIG, isRetryableStatus } from "../retry-config";

// ---------------------------------------------------------------------------
// isRetryableStatus
// ---------------------------------------------------------------------------

describe("isRetryableStatus", () => {
  it("retorna true para 429 (rate-limit)", () => {
    expect(isRetryableStatus(429)).toBe(true);
  });

  it("retorna true para 502 (Bad Gateway)", () => {
    expect(isRetryableStatus(502)).toBe(true);
  });

  it("retorna true para 503 (Service Unavailable)", () => {
    expect(isRetryableStatus(503)).toBe(true);
  });

  it("retorna true para 504 (Gateway Timeout)", () => {
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("retorna false para 401 (Unauthorized)", () => {
    expect(isRetryableStatus(401)).toBe(false);
  });

  it("retorna false para 403 (Forbidden)", () => {
    expect(isRetryableStatus(403)).toBe(false);
  });

  it("retorna false para 404 (Not Found)", () => {
    expect(isRetryableStatus(404)).toBe(false);
  });

  it("retorna false para 400 (Bad Request)", () => {
    expect(isRetryableStatus(400)).toBe(false);
  });

  it("retorna false para 500 (Internal Server Error nao esta na allowlist)", () => {
    expect(isRetryableStatus(500)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_RETRY_CONFIG shape
// ---------------------------------------------------------------------------

describe("DEFAULT_RETRY_CONFIG", () => {
  it("define 2 retries", () => {
    expect(DEFAULT_RETRY_CONFIG.retries).toBe(2);
  });

  it("define retryDelay como funcao", () => {
    expect(typeof DEFAULT_RETRY_CONFIG.retryDelay).toBe("function");
  });

  it("define retryCondition como funcao", () => {
    expect(typeof DEFAULT_RETRY_CONFIG.retryCondition).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_RETRY_CONFIG retryCondition behaviour
// ---------------------------------------------------------------------------

describe("DEFAULT_RETRY_CONFIG.retryCondition", () => {
  const retryCondition = DEFAULT_RETRY_CONFIG.retryCondition!;

  /**
   * Builds a minimal Axios error-like object for testing the retry condition.
   *
   * @param status HTTP status code, or undefined to simulate a network error.
   * @returns Mock Axios error object.
   */
  const makeError = (
    status?: number,
  ): Parameters<typeof retryCondition>[0] => ({
    isAxiosError: true,
    name: "AxiosError",
    message: "test error",
    toJSON: () => ({}),
    config: {} as never,
    response: status !== undefined
      ? ({
          status,
          data: {},
          headers: {},
          config: {} as never,
          statusText: String(status),
        } as never)
      : undefined,
    code: undefined,
  });

  it("retorna true para 503", () => {
    expect(retryCondition(makeError(503))).toBe(true);
  });

  it("retorna true para 502", () => {
    expect(retryCondition(makeError(502))).toBe(true);
  });

  it("retorna true para 504", () => {
    expect(retryCondition(makeError(504))).toBe(true);
  });

  it("retorna true para 429 (rate-limit)", () => {
    expect(retryCondition(makeError(429))).toBe(true);
  });

  it("retorna false para 401", () => {
    expect(retryCondition(makeError(401))).toBe(false);
  });

  it("retorna false para 403", () => {
    expect(retryCondition(makeError(403))).toBe(false);
  });

  it("retorna false para 404", () => {
    expect(retryCondition(makeError(404))).toBe(false);
  });

  it("retorna false para resposta sem status definido", () => {
    expect(retryCondition(makeError(undefined))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Exponential backoff delay shape validation
// ---------------------------------------------------------------------------

describe("DEFAULT_RETRY_CONFIG.retryDelay exponentialDelay shape", () => {
  it("retorna numero maior que 0 para attempt 0", () => {
    const delay = DEFAULT_RETRY_CONFIG.retryDelay!(0, {} as never);

    expect(typeof delay).toBe("number");
    expect(delay).toBeGreaterThan(0);
  });

  it("delay do attempt 1 e maior que o delay do attempt 0", () => {
    const delay0 = DEFAULT_RETRY_CONFIG.retryDelay!(0, {} as never);
    const delay1 = DEFAULT_RETRY_CONFIG.retryDelay!(1, {} as never);

    expect(delay1).toBeGreaterThan(delay0);
  });
});
