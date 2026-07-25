import { describe, expect, it, vi } from "vitest";

const mockGetSession = vi.hoisted(() => vi.fn());
const mockIsAuthenticated = vi.hoisted(() => vi.fn(() => true as boolean));

vi.mock("~/features/admin/users/services/admin-users.client", () => ({
  useAdminUsersClient: (): { getSession: typeof mockGetSession } => ({
    getSession: mockGetSession,
  }),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: (): { readonly isAuthenticated: boolean } => ({
    get isAuthenticated(): boolean {
      return mockIsAuthenticated();
    },
  }),
}));

// eslint-disable-next-line import/first
import { adminAccessQueryOptions } from "./use-admin-access-query";

describe("adminAccessQueryOptions", () => {
  it("targets the backend admin session and never retries", () => {
    const options = adminAccessQueryOptions();
    expect(options.queryKey).toEqual(["admin", "session", "access"]);
    expect(options.retry).toBe(false);
    expect(options.staleTime).toBe(5 * 60 * 1000);
  });

  it("is disabled for unauthenticated visitors", () => {
    mockIsAuthenticated.mockReturnValue(false);
    const options = adminAccessQueryOptions();
    expect(typeof options.enabled === "function" ? options.enabled() : options.enabled).toBe(false);
  });

  it("resolves isAdmin=true from the backend session", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetSession.mockResolvedValue({ isAdmin: true, email: "admin@auraxis.com.br" });
    const options = adminAccessQueryOptions();
    await expect(options.queryFn()).resolves.toBe(true);
  });

  it("resolves isAdmin=false when the backend denies the operator", async () => {
    mockGetSession.mockResolvedValue({ isAdmin: false });
    const options = adminAccessQueryOptions();
    await expect(options.queryFn()).resolves.toBe(false);
  });
});
