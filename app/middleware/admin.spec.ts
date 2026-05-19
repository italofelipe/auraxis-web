import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRestore = vi.hoisted(() => vi.fn());
const mockAccessToken = vi.hoisted(() => vi.fn<() => string | null>(() => null));
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));

/**
 * Builds an unsigned JWT-like token for middleware authorization tests.
 *
 * @param payload JWT payload claims.
 * @returns Token-shaped string.
 */
const tokenWithPayload = (payload: Record<string, unknown>): string => {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url");
  return `header.${encodedPayload}.signature`;
};

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    restore: typeof mockRestore;
    accessToken: string | null;
    isAuthenticated: boolean;
  } => ({
    restore: mockRestore,
    get accessToken(): string | null {
      return mockAccessToken();
    },
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  defineNuxtRouteMiddleware: (
    fn: (to: { path: string }) => unknown,
  ): ((to: { path: string }) => unknown) => fn,
}));

describe("admin middleware", () => {
  beforeEach(() => {
    vi.resetModules();
    mockRestore.mockClear();
    mockNavigateTo.mockClear();
    mockAccessToken.mockReturnValue(null);
    mockIsAuthenticated.mockReturnValue(false);
  });

  it("redirects guests to login", async () => {
    const middleware = await import("./admin");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/admin" });

    expect(mockRestore).toHaveBeenCalledOnce();
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
    expect(result).toBe("/login");
  });

  it("redirects authenticated non-admin users to the admin forbidden page", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockAccessToken.mockReturnValue(tokenWithPayload({ roles: ["user"] }));

    const middleware = await import("./admin");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/admin" });

    expect(mockNavigateTo).toHaveBeenCalledWith("/admin/forbidden", { replace: true });
    expect(result).toBe("/admin/forbidden");
  });

  it("allows users with admin claims", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockAccessToken.mockReturnValue(tokenWithPayload({ roles: ["admin"] }));

    const middleware = await import("./admin");
    const result = (middleware.default as (to: { path: string }) => unknown)({ path: "/admin" });

    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
