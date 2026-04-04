import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHttpClientMethods, normalizeHttpClientBaseUrl, type HttpClientDeps } from "./useHttpClient";
import { ApiError } from "~/utils/apiError";

const BASE = "http://api.test";
const TOKEN = "jwt-token-abc";
const LOGIN_PATH = "/login";

type FetcherFn = NonNullable<HttpClientDeps["fetcher"]>;
type LogoutHandler = NonNullable<HttpClientDeps["onLogout"]>;
type NavigateHandler = NonNullable<HttpClientDeps["onNavigate"]>;
type TokenProvider = NonNullable<HttpClientDeps["getToken"]>;

let fetcher: ReturnType<typeof vi.fn> & FetcherFn;
let getToken: ReturnType<typeof vi.fn> & TokenProvider;
let onLogout: ReturnType<typeof vi.fn> & LogoutHandler;
let onNavigate: ReturnType<typeof vi.fn> & NavigateHandler;

/**
 * Builds a client instance using the current mock dependencies.
 * @returns Typed HTTP client methods backed by mocks.
 */
const buildClient = (): ReturnType<typeof createHttpClientMethods> =>
  createHttpClientMethods({
    baseUrl: BASE,
    ctx: { fetcher, getToken, onLogout, onNavigate },
  });

beforeEach((): void => {
  fetcher = vi.fn() as ReturnType<typeof vi.fn> & FetcherFn;
  getToken = vi.fn() as ReturnType<typeof vi.fn> & TokenProvider;
  onLogout = vi.fn() as ReturnType<typeof vi.fn> & LogoutHandler;
  onNavigate = vi.fn() as ReturnType<typeof vi.fn> & NavigateHandler;
});

describe("useHttpClient — Authorization header", () => {
  it("injects Authorization header when token is present", async (): Promise<void> => {
    getToken.mockReturnValue(TOKEN);
    fetcher.mockResolvedValue({ ok: true });

    await buildClient().get("/users");

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/users`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TOKEN}`,
        }),
      }),
    );
  });

  it("omits Authorization header when token is null", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({ ok: true });

    await buildClient().get("/users");

    const [, opts] = fetcher.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(opts.headers.Authorization).toBeUndefined();
  });
});

describe("useHttpClient — 401 handling", () => {
  it("calls logout and navigates to /login on 401 response", async (): Promise<void> => {
    getToken.mockReturnValue(TOKEN);
    fetcher.mockRejectedValue({ status: 401, message: "Unauthorized" });
    onLogout.mockResolvedValue(undefined);
    onNavigate.mockResolvedValue(undefined);

    await expect(buildClient().get("/protected")).rejects.toBeInstanceOf(ApiError);

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(LOGIN_PATH);
  });

  it("throws ApiError with status 401", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue({ status: 401, message: "Unauthorized" });
    onLogout.mockResolvedValue(undefined);
    onNavigate.mockResolvedValue(undefined);

    const error = await buildClient().get("/protected").catch((e: unknown): unknown => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(401);
  });
});

describe("useHttpClient — error normalisation", () => {
  it("throws ApiError with correct status and message for non-401 errors", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue({ status: 422, message: "Unprocessable Entity" });

    const error = await buildClient().post("/submit", {}).catch((e: unknown): unknown => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(422);
    expect((error as ApiError).message).toBe("Unprocessable Entity");
  });

  it("includes error code from API response when present", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue({
      status: 400,
      message: "Bad Request",
      data: { code: "VALIDATION_FAILED" },
    });

    const error = await buildClient().post("/submit", {}).catch((e: unknown): unknown => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("VALIDATION_FAILED");
  });

  it("wraps generic errors as ApiError with status 500", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue(new Error("network failure"));

    const error = await buildClient().get("/health").catch((e: unknown): unknown => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe("network failure");
  });

  it("does not call logout for non-401 errors", async (): Promise<void> => {
    getToken.mockReturnValue(TOKEN);
    fetcher.mockRejectedValue({ status: 500, message: "Internal Server Error" });

    await buildClient().get("/data").catch((): void => {});

    expect(onLogout).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe("useHttpClient — HTTP method wiring", () => {
  it("calls GET with correct method option", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({});

    await buildClient().get("/ping");

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/ping`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("calls POST with body", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({});

    await buildClient().post("/items", { name: "test" });

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/items`,
      expect.objectContaining({ method: "POST", body: { name: "test" } }),
    );
  });

  it("calls PUT with body", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({});

    await buildClient().put("/items/1", { name: "updated" });

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/items/1`,
      expect.objectContaining({ method: "PUT", body: { name: "updated" } }),
    );
  });

  it("calls PATCH with body", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({});

    await buildClient().patch("/items/1", { name: "patched" });

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/items/1`,
      expect.objectContaining({ method: "PATCH", body: { name: "patched" } }),
    );
  });

  it("calls DELETE", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockResolvedValue({});

    await buildClient().del("/items/1");

    expect(fetcher).toHaveBeenCalledWith(
      `${BASE}/items/1`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("normalizeHttpClientBaseUrl", () => {
  it("removes single trailing slash", (): void => {
    expect(normalizeHttpClientBaseUrl("http://api.test/")).toBe("http://api.test");
  });

  it("removes multiple trailing slashes", (): void => {
    expect(normalizeHttpClientBaseUrl("http://api.test///")).toBe("http://api.test");
  });

  it("returns URL unchanged when no trailing slash", (): void => {
    expect(normalizeHttpClientBaseUrl("http://api.test")).toBe("http://api.test");
  });

  it("handles empty string", (): void => {
    expect(normalizeHttpClientBaseUrl("")).toBe("");
  });

  it("handles URL with path and trailing slash", (): void => {
    expect(normalizeHttpClientBaseUrl("http://api.test/v1/")).toBe("http://api.test/v1");
  });
});

describe("useHttpClient — error normalisation (edge cases)", () => {
  it("re-throws existing ApiError instances unchanged", async (): Promise<void> => {
    const existing = new ApiError(403, "Forbidden");
    fetcher.mockRejectedValue(existing);
    getToken.mockReturnValue(null);

    const error = await buildClient().get("/secure").catch((e: unknown) => e);
    expect(error).toBe(existing);
    expect((error as ApiError).status).toBe(403);
  });

  it("wraps error objects with non-numeric status as 500", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue({ status: "bad", message: "weird error" });

    const error = await buildClient().get("/weird").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("handles error without message property", async (): Promise<void> => {
    getToken.mockReturnValue(null);
    fetcher.mockRejectedValue({ status: 422 });

    const error = await buildClient().post("/submit", {}).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("Unexpected error");
  });
});
