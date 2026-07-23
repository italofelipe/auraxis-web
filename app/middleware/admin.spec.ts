import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRunSessionRestore = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => false as boolean));
const mockGetSession = vi.hoisted(() => vi.fn());
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): {
    readonly isAuthenticated: boolean;
    readonly runSessionRestore: typeof mockRunSessionRestore;
  } => ({
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
    runSessionRestore: mockRunSessionRestore,
  }),
}));

vi.mock("~/features/admin/users/services/admin-users.client", () => ({
  useAdminUsersClient: (): { getSession: typeof mockGetSession } => ({
    getSession: mockGetSession,
  }),
}));

vi.mock("~/composables/useHttp/useHttp", () => ({ refreshAccessToken: vi.fn() }));

vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  useRuntimeConfig: (): { public: { apiBase: string } } => ({
    public: { apiBase: "http://api.test" },
  }),
  defineNuxtRouteMiddleware: (
    fn: (to: { path: string }) => unknown,
  ): ((to: { path: string }) => unknown) => fn,
}));

describe("admin middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(false);
    mockRunSessionRestore.mockResolvedValue(false);
    mockGetSession.mockResolvedValue({ isAdmin: true });
  });

  it("restores the session before redirecting a guest", async () => {
    const middleware = (await import("./admin")).default;
    const result = await middleware({ path: "/admin" } as never, {} as never);

    expect(mockRunSessionRestore).toHaveBeenCalledOnce();
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
    expect(result).toBe("/login");
  });

  it("rejects an authenticated user when the backend session is forbidden", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetSession.mockRejectedValue(new Error("forbidden"));
    const middleware = (await import("./admin")).default;

    const result = await middleware({ path: "/admin" } as never, {} as never);

    expect(mockNavigateTo).toHaveBeenCalledWith("/admin/forbidden", { replace: true });
    expect(result).toBe("/admin/forbidden");
  });

  it("allows an operator validated by GET /v2/admin/session", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const middleware = (await import("./admin")).default;

    const result = await middleware({ path: "/admin" } as never, {} as never);

    expect(mockGetSession).toHaveBeenCalledOnce();
    expect(mockNavigateTo).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
