import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// ── Hoisted mocks ─────────────────────────────────────────────────────────
// vi.hoisted() runs before module loading so these values can be referenced
// inside vi.mock() factories without temporal dead-zone issues.

const mockQueryClientClear = vi.hoisted(() => vi.fn());
const mockNavigateTo = vi.hoisted(() => vi.fn((path: string): string => path));
const mockSignOut = vi.hoisted(() => vi.fn());
const mockClearProfile = vi.hoisted(() => vi.fn());
const mockFiltersReset = vi.hoisted(() => vi.fn());
const mockUiReset = vi.hoisted(() => vi.fn());
const mockToolContextClear = vi.hoisted(() => vi.fn());
const mockAnalyticsCapture = vi.hoisted(() => vi.fn());
const mockAnalyticsReset = vi.hoisted(() => vi.fn());

// ── Module mocks ──────────────────────────────────────────────────────────
// vi.mock() calls are hoisted above imports by Vite's transform plugin, so
// they run before the subject module resolves its dependencies.

vi.mock("@tanstack/vue-query", () => ({
  useQueryClient: vi.fn(() => ({ clear: mockQueryClientClear })),
}));

// navigateTo is a Nuxt auto-import resolved from the #app virtual module.
vi.mock("#app", () => ({
  navigateTo: mockNavigateTo,
  useNuxtApp: vi.fn(),
}));

vi.mock("~/stores/session", () => ({
  useSessionStore: vi.fn(() => ({ signOut: mockSignOut })),
}));
vi.mock("~/stores/user", () => ({
  useUserStore: vi.fn(() => ({ clearProfile: mockClearProfile })),
}));
vi.mock("~/stores/filters", () => ({
  useFiltersStore: vi.fn(() => ({ reset: mockFiltersReset })),
}));
vi.mock("~/stores/ui", () => ({
  useUiStore: vi.fn(() => ({ $reset: mockUiReset })),
}));
vi.mock("~/stores/toolContext", () => ({
  useToolContextStore: vi.fn(() => ({ clear: mockToolContextClear })),
}));

vi.mock("~/composables/useAnalytics", () => ({
  useAnalytics: vi.fn(() => ({
    capture: mockAnalyticsCapture,
    identify: vi.fn(),
    reset: mockAnalyticsReset,
  })),
}));

// ── Subject under test ────────────────────────────────────────────────────
// Import placed here (after vi.mock factories, before describe) is safe:
// Vite hoists vi.mock() calls above all imports at transform time.
// eslint-disable-next-line import/first
import { useLogout } from "./useLogout";

// ── Tests ─────────────────────────────────────────────────────────────────

describe("useLogout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("clears the Vue Query cache on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockQueryClientClear).toHaveBeenCalledOnce();
  });

  it("clears user profile on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockClearProfile).toHaveBeenCalledOnce();
  });

  it("resets filters store on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockFiltersReset).toHaveBeenCalledOnce();
  });

  it("resets ui store on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockUiReset).toHaveBeenCalledOnce();
  });

  it("clears tool context store on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockToolContextClear).toHaveBeenCalledOnce();
  });

  it("calls sessionStore.signOut on logout", () => {
    const { logout } = useLogout();
    logout();
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("navigates to /login after clearing all state", () => {
    const { logout } = useLogout();
    logout();
    expect(mockNavigateTo).toHaveBeenCalledWith("/login");
  });

  it("clears query cache BEFORE signing out (prevents stale data leak)", () => {
    const callOrder: string[] = [];
    mockQueryClientClear.mockImplementation(() => callOrder.push("queryClient.clear"));
    mockSignOut.mockImplementation(() => callOrder.push("signOut"));

    const { logout } = useLogout();
    logout();

    expect(callOrder.indexOf("queryClient.clear")).toBeLessThan(
      callOrder.indexOf("signOut"),
    );
  });

  it("calls all cleanup steps in a single logout invocation", () => {
    const { logout } = useLogout();
    logout();

    expect(mockQueryClientClear).toHaveBeenCalledOnce();
    expect(mockClearProfile).toHaveBeenCalledOnce();
    expect(mockFiltersReset).toHaveBeenCalledOnce();
    expect(mockUiReset).toHaveBeenCalledOnce();
    expect(mockToolContextClear).toHaveBeenCalledOnce();
    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockNavigateTo).toHaveBeenCalledOnce();
  });

  it("emits user_signed_out and resets the analytics session on logout", () => {
    const { logout } = useLogout();
    logout();

    expect(mockAnalyticsCapture).toHaveBeenCalledWith("user_signed_out");
    expect(mockAnalyticsReset).toHaveBeenCalledOnce();
  });

  it("captures user_signed_out BEFORE resetting analytics (preserves identity)", () => {
    const order: string[] = [];
    mockAnalyticsCapture.mockImplementation(() => order.push("capture"));
    mockAnalyticsReset.mockImplementation(() => order.push("reset"));

    const { logout } = useLogout();
    logout();

    expect(order.indexOf("capture")).toBeLessThan(order.indexOf("reset"));
  });
});
